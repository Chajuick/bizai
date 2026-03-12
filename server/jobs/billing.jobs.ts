// server/jobs/billing.jobs.ts

// #region Imports
import { billingService } from "../modules/billing/billing.service";
import { saleRepo } from "../modules/crm/sale/sale.repo";
import { saleService } from "../modules/crm/sale/sale.service";
import { fileRepo } from "../modules/crm/file/file.repo";
import { fileService } from "../modules/crm/file/file.service";
import { storageDelete } from "../storage";
import { getDb } from "../core/db";
import { logger } from "../core/logger";
// #endregion

// #region Constants

const SYSTEM_USER_ID = 0;

/** Worker 중복 실행 방지 — setInterval 재진입 차단 */
let workerRunning = false;

/** 1회 사이클당 처리할 최대 잡 수 */
const MAX_JOBS_PER_CYCLE = 10;

// #endregion

// #region Billing Sweep

/**
 * 만료된 해지 예약 구독을 Free 플랜으로 전환
 * - Free Plan은 sweep 대상 제외
 * - 운영 권장: 10분마다
 */
export async function runBillingSweepJobs() {
  try {
    const result =
      await billingService.processExpiredCancellations(SYSTEM_USER_ID);

    if (result.processed > 0) {
      logger.info(
        { processed: result.processed },
        "[billing-sweep] expired subscriptions downgraded to free",
      );
    }
  } catch (err) {
    logger.error({ err }, "[billing-sweep] failed");
  }
}

// #endregion

// #region Stale Job Recovery

/**
 * 오래된 running 상태 AI job 복구
 * - reqe_date 기준 10분 이상 running 이면 failed 처리
 * - 연결된 sale.aiex_stat도 함께 failed 동기화
 * - 운영 권장: 5분마다
 */
export async function runStaleJobRecovery() {
  try {
    const STALE_THRESHOLD_MS = 10 * 60 * 1000;
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);
    const db = getDb();

    const recovered = await saleRepo.resetStaleRunningJobs({ db }, cutoff);

    if (recovered > 0) {
      logger.info(
        { recovered },
        "[stale-job-recovery] stale running jobs reset to failed",
      );
    }
  } catch (err) {
    logger.error({ err }, "[stale-job-recovery] failed");
  }
}

// #endregion

// #region Orphan File Cleanup

/**
 * 고아(orphan) 파일 정리
 * - CORE_FILE_LINK에 연결되지 않은 파일을 스토리지에서 삭제 후 soft-delete
 * - 업로드 후 링크 연결 실패/페이지 이탈로 남겨진 파일 대상
 * - 1시간 이상 지난 파일만 정리
 * - 운영 권장: 1시간마다
 */
export async function runOrphanFileCleanup() {
  try {
    const ORPHAN_THRESHOLD_MS = 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - ORPHAN_THRESHOLD_MS);
    const db = getDb();

    const orphans = await fileRepo.findOrphanFiles({ db }, { cutoff, limit: 200 });
    if (!orphans.length) return;

    const deleted: number[] = [];

    for (const file of orphans) {
      try {
        await storageDelete(file.file_path);
      } catch (err) {
        logger.warn(
          { err, file_idno: file.file_idno },
          "[orphan-cleanup] storageDelete failed, soft-deleting anyway",
        );
      }

      deleted.push(file.file_idno);
    }

    if (deleted.length > 0) {
      await fileRepo.softDeleteBatch({ db }, deleted);
      logger.info(
        { count: deleted.length },
        "[orphan-cleanup] orphan files cleaned up",
      );
    }
  } catch (err) {
    logger.error({ err }, "[orphan-cleanup] failed");
  }
}

// #endregion

// #region AI Job Worker Helpers

/**
 * 지원하지 않는 queued job을 failed 처리
 * - 알 수 없는 jobs_type / 잘못 생성된 레거시 job 때문에
 *   워커 전체가 멈추는 상황을 방지한다.
 */
async function failUnsupportedJob(job: {
  jobs_idno: number | string;
  jobs_type?: string | null;
  sale_idno?: number | null;
  meta_json?: unknown;
}) {
  const db = getDb();

  logger.error(
    {
      jobId: job.jobs_idno,
      saleId: job.sale_idno ?? null,
      jobsType: job.jobs_type ?? null,
      meta: job.meta_json ?? null,
    },
    "[ai-job-worker] unsupported queued job",
  );

  /**
   * saleRepo에 아래 같은 함수가 있다고 가정:
   * - markJobFailed({ db }, jobId, failMessage)
   *
   * 아직 없다면 repo에 만들어야 함.
   */
  await saleRepo.markJobFailed(
    { db },
    {
      jobs_idno: Number(job.jobs_idno),
      fail_mess: `Unsupported jobs_type: ${String(job.jobs_type ?? "null")}`,
    }
  );
}

/**
 * queued job 1건 처리
 * - jobs_type 기준으로만 분기
 * - 알 수 없는 타입은 failed 처리
 */
async function processOneQueuedJob(job: {
  jobs_idno: number | string;
  sale_idno: number | null;
  jobs_type?: string | null;
  meta_json?: unknown;
}) {
  const jobId = Number(job.jobs_idno);
  const jobsType = job.jobs_type ?? null;

  logger.info(
    {
      jobId,
      saleId: job.sale_idno,
      jobsType,
    },
    "[ai-job-worker] picked job",
  );

  // #region Transcribe Jobs
  if (jobsType === "transcribe") {
    if (job.sale_idno == null) {
      await fileService.processQueuedFileTranscribeJob(jobId);
    } else {
      await saleService.processQueuedTranscribeJob(jobId);
    }

    logger.info({ jobId, jobsType }, "[ai-job-worker] job processed");
    return;
  }
  // #endregion

  // #region Analyze Jobs
  if (jobsType === "analyze" || jobsType === "analyze_text") {
    await saleService.processQueuedAnalyzeJob(jobId);
    logger.info({ jobId, jobsType }, "[ai-job-worker] job processed");
    return;
  }
  // #endregion

  // #region Unsupported Jobs
  await failUnsupportedJob(job);
  // #endregion
}

// #endregion

// #region AI Job Worker

/**
 * AI 작업 큐 워커
 *
 * 동작:
 * - 가장 오래된 queued job부터 순차 처리
 * - jobs_type = transcribe    → 전사 처리
 * - jobs_type = analyze       → 영업일지 AI 분석 처리
 * - jobs_type = analyze_text  → 텍스트 기반 분석 처리
 *
 * 안정성 원칙:
 * - 지원하지 않는 job 1건 때문에 전체 큐가 멈추지 않도록 한다.
 * - 개별 job 실패는 로그를 남기고 다음 사이클에 영향 최소화
 *
 * 운영 권장:
 * - 5초마다 실행
 */
export async function runAiJobWorker() {
  if (workerRunning) return;
  workerRunning = true;

  try {
    for (let i = 0; i < MAX_JOBS_PER_CYCLE; i++) {
      const db = getDb();
      const job = await saleRepo.findNextQueuedJob({ db });

      if (!job) {
        break;
      }

      try {
        await processOneQueuedJob(job);
      } catch (err) {
        logger.error(
          {
            err,
            jobId: job.jobs_idno,
            saleId: job.sale_idno ?? null,
            jobsType: (job as { jobs_type?: string | null }).jobs_type ?? null,
          },
          "[ai-job-worker] job processing failed",
        );

        /**
         * 개별 job 실패 시 failed 처리
         * - 다음 job까지 막지 않기 위해 continue
         */
        await saleRepo.markJobFailed(
          { db },
          {
            jobs_idno: Number(job.jobs_idno),
            fail_mess: err instanceof Error ? err.message : "Unknown worker error",
          }
        );

        continue;
      }
    }
  } catch (err) {
    logger.error({ err }, "[ai-job-worker] failed");
  } finally {
    workerRunning = false;
  }
}

// #endregion