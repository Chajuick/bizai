// server/jobs/billing.jobs.ts

// #region Imports
import { billingService } from "../modules/billing/billing.service";
// #endregion

// #region Billing Jobs
/**
 * ✅ 만료된 해지예약 구독을 무료로 전환
 * - 실제 운영: 10분~1시간마다 실행 추천
 * - modi_idno는 시스템 사용자 ID를 쓰는 게 정석(예: 0 또는 system user)
 */
export async function runBillingSweepJobs() {
  const SYSTEM_USER_ID = 0;
  await billingService.processExpiredCancellations(SYSTEM_USER_ID);
}
// #endregion