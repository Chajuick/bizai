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

/** Worker 중복 실행 방지 */
let workerRunning = false;

/** 1회 사이클당 처리할 최대 잡 수 */
const MAX_JOBS_PER_CYCLE = 10;

/** 기본 worker 실행 주기 */
const WORKER_INTERVAL = 5000;

/** DB 장애 시 최대 backoff */
const MAX_BACKOFF = 60000;

/** 현재 backoff 상태 */
let dbBackoffMs = 0;

/** Job 최대 실행 시간 */
const JOB_TIMEOUT_MS = 120000;

// #endregion


// #region Backoff Helpers

function increaseBackoff() {
  if (dbBackoffMs === 0) {
    dbBackoffMs = WORKER_INTERVAL;
  } else {
    dbBackoffMs = Math.min(dbBackoffMs * 2, MAX_BACKOFF);
  }
}

function resetBackoff() {
  dbBackoffMs = 0;
}

// #endregion


// #region Timeout Helper

/**
 * Job 실행 timeout 보호
 * - 외부 API 지연
 * - 무한 대기
 * - deadlock
 */
async function runWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {

  let timeout: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error("Job execution timeout"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout!);
  }

}

// #endregion


// #region Billing Sweep

/**
 * 만료된 해지 예약 구독을 Free 플랜으로 전환
 */
export async function runBillingSweepJobs() {

  logger.debug("[billing-sweep] started");

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
 * 오래된 running AI job 복구
 */
export async function runStaleJobRecovery() {

  try {

    const STALE_THRESHOLD_MS = 10 * 60 * 1000;

    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

    const db = getDb();

    const recovered =
      await saleRepo.resetStaleRunningJobs({ db }, cutoff);

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
 * 고아 파일 정리
 */
export async function runOrphanFileCleanup() {

  try {

    const ORPHAN_THRESHOLD_MS = 60 * 60 * 1000;

    const cutoff = new Date(Date.now() - ORPHAN_THRESHOLD_MS);

    const db = getDb();

    const orphans =
      await fileRepo.findOrphanFiles({ db }, { cutoff, limit: 200 });

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

  await saleRepo.markJobFailed(
    { db },
    {
      jobs_idno: Number(job.jobs_idno),
      fail_mess:
        `Unsupported jobs_type: ${String(job.jobs_type ?? "null")}`,
    }
  );

}


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

  if (jobsType === "transcribe") {

    if (job.sale_idno == null) {
      await fileService.processQueuedFileTranscribeJob(jobId);
    } else {
      await saleService.processQueuedTranscribeJob(jobId);
    }

    logger.info({ jobId }, "[ai-job-worker] job processed");

    return;

  }

  if (jobsType === "analyze" || jobsType === "analyze_text") {

    await saleService.processQueuedAnalyzeJob(jobId);

    logger.info({ jobId }, "[ai-job-worker] job processed");

    return;

  }

  await failUnsupportedJob(job);

}

// #endregion


// #region AI Job Worker

export async function runAiJobWorker() {

  if (workerRunning) return;

  workerRunning = true;

  logger.debug(
    { backoff: dbBackoffMs },
    "[ai-job-worker] cycle started",
  );

  try {

    const db = getDb();

    resetBackoff();

    for (let i = 0; i < MAX_JOBS_PER_CYCLE; i++) {

      const job =
        await saleRepo.findNextQueuedJob({ db });

      if (!job) {
        logger.debug("[ai-job-worker] queue empty");
        break;
      }

      try {

        await runWithTimeout(
          processOneQueuedJob(job),
          JOB_TIMEOUT_MS
        );

      } catch (err) {

        logger.error(
          {
            err,
            jobId: job.jobs_idno,
            saleId: job.sale_idno ?? null,
          },
          "[ai-job-worker] job processing failed",
        );

        await saleRepo.markJobFailed(
          { db },
          {
            jobs_idno: Number(job.jobs_idno),
            fail_mess:
              err instanceof Error
                ? err.message
                : "Unknown worker error",
          }
        );

      }

    }

  } catch (err: any) {

    const code =
      err?.code ||
      err?.cause?.code ||
      err?.originalError?.code;

    const message =
      err?.message ||
      err?.cause?.message ||
      "";

    if (
      code === "ECONNREFUSED" ||
      message.includes("Connection lost")
    ) {

      increaseBackoff();

      logger.warn(
        { backoffMs: dbBackoffMs },
        "[ai-job-worker] DB unavailable - backing off",
      );

      return;

    }

    logger.error({ err }, "[ai-job-worker] failed");

  } finally {

    workerRunning = false;

  }

}

// #endregion


// #region Worker Scheduler

/**
 * worker 스케줄러
 * - backoff 지원
 * - DB 장애 시 자동 대기 증가
 */
export function scheduleAiWorker() {

  const delay = dbBackoffMs || WORKER_INTERVAL;

  setTimeout(async () => {

    await runAiJobWorker();

    scheduleAiWorker();

  }, delay);

}

// #endregion