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

// #region Billing Jobs

const SYSTEM_USER_ID = 0;

/** Worker 중복 실행 방지 — setInterval이 이전 실행 완료 전에 재호출되는 경우 차단 */
let workerRunning = false;

/** 1회 사이클당 처리할 최대 잡 수 — 무한 처리 방지 */
const MAX_JOBS_PER_CYCLE = 10;

/**
 * ✅ 만료된 해지예약 구독을 무료로 전환
 * - Free Plan은 sweep 대상 제외 (만료 없음 정책)
 * - 운영: 10분마다 실행 권장
 */
export async function runBillingSweepJobs() {
  try {
    const result = await billingService.processExpiredCancellations(SYSTEM_USER_ID);
    if (result.processed > 0) {
      logger.info({ processed: result.processed }, "[billing-sweep] expired subscriptions downgraded to free");
    }
  } catch (err) {
    logger.error({ err }, "[billing-sweep] failed");
  }
}

/**
 * ✅ Stale "running" AI job 복구
 * - reqe_date 기준 10분 이상 running 상태인 job → failed 처리
 * - 연결된 sale.aiex_stat도 failed로 동기화
 * - 운영: 5분마다 실행 권장
 */
export async function runStaleJobRecovery() {
  try {
    const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10분
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);
    const db = getDb();
    const recovered = await saleRepo.resetStaleRunningJobs({ db }, cutoff);
    if (recovered > 0) {
      logger.info({ recovered }, "[stale-job-recovery] stale running jobs reset to failed");
    }
  } catch (err) {
    logger.error({ err }, "[stale-job-recovery] failed");
  }
}

/**
 * ✅ 고아(orphan) 파일 정리
 * - CORE_FILE_LINK에 연결되지 않은 파일을 스토리지에서 삭제 후 soft-delete
 * - 업로드 후 링크 연결 실패/페이지 이탈로 남겨진 파일 대상
 * - 1시간 이상 된 파일만 처리 (현재 업로드 중인 파일 보호)
 * - 운영: 1시간마다 실행 권장
 */
export async function runOrphanFileCleanup() {
  try {
    const ORPHAN_THRESHOLD_MS = 60 * 60 * 1000; // 1시간
    const cutoff = new Date(Date.now() - ORPHAN_THRESHOLD_MS);
    const db = getDb();

    const orphans = await fileRepo.findOrphanFiles({ db }, { cutoff, limit: 200 });
    if (!orphans.length) return;

    const deleted: number[] = [];
    for (const file of orphans) {
      try {
        await storageDelete(file.file_path);
      } catch (err) {
        // 스토리지 파일이 이미 없거나 권한 문제 → soft-delete는 진행
        logger.warn({ err, file_idno: file.file_idno }, "[orphan-cleanup] storageDelete failed, soft-deleting anyway");
      }
      deleted.push(file.file_idno);
    }

    if (deleted.length) {
      await fileRepo.softDeleteBatch({ db }, deleted);
      logger.info({ count: deleted.length }, "[orphan-cleanup] orphan files cleaned up");
    }
  } catch (err) {
    logger.error({ err }, "[orphan-cleanup] failed");
  }
}

/**
 * ✅ AI 작업 큐 워커
 * - 가장 오래된 queued 잡을 하나씩 처리
 * - jobs_type: "analyze" → processQueuedAnalyzeJob
 * - jobs_type: "transcribe" → processQueuedTranscribeJob
 * - 운영: 5초마다 실행 권장
 */
export async function runAiJobWorker() {
  if (workerRunning) return;
  workerRunning = true;
  try {
    for (let i = 0; i < MAX_JOBS_PER_CYCLE; i++) {
      const db = getDb();
      const job = await saleRepo.findNextQueuedJob({ db });
      if (!job) break;

      const jobsType = (job as { jobs_type?: string }).jobs_type;

      if (jobsType === "transcribe") {
        // sale_idno 없으면 file-only transcribe, 있으면 sale 연결 transcribe
        if (job.sale_idno == null) {
          await fileService.processQueuedFileTranscribeJob(Number(job.jobs_idno));
        } else {
          await saleService.processQueuedTranscribeJob(Number(job.jobs_idno));
        }
        continue;
      }

      // analyze / analyze_text (기존 로직)
      const task = (job.meta_json as { task?: string } | null)?.task;
      if (task !== "analyze" && task !== "analyze_text") break;

      await saleService.processQueuedAnalyzeJob(Number(job.jobs_idno));
    }
  } catch (err) {
    logger.error({ err }, "[ai-job-worker] failed");
  } finally {
    workerRunning = false;
  }
}

// #endregion