// server/modules/billing/billing.service.ts

// #region Imports
import type { ServiceCtx } from "../../core/serviceCtx";
import { throwAppError } from "../../core/trpc/appError";
import { getDb } from "../../core/db";
import { billingRepo } from "./billing.repo";
import { aiService } from "../ai/ai.service";
import { tokenRepo } from "../ai/token/token.repo";
// #endregion

// #region Helpers
function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Free Plan 만료일 — 사실상 만료 없음(영구)
 * ends_date NOT NULL 제약으로 인해 far-future 날짜 사용
 */
const FREE_PLAN_ENDS_DATE = new Date("2099-12-31T00:00:00Z");
// #endregion

export const billingService = {
  // #region ensureSubscriptionForCompany
  // ✅ 모든 워크스페이스는 1개의 구독 row를 “항상” 가진다.
  // 회사 생성 시점에서 보통 처리하지만, 혹시 누락됐을 때를 대비한 세이프티.
  async ensureSubscriptionForCompany(comp_idno: number, user_idno: number) {
    const db = getDb();

    const existing = await billingRepo.findCurrentSubWithPlan({ db }, comp_idno);
    if (existing) return existing;

    const free = await billingRepo.findPlanByCode({ db }, "free");
    if (!free) {
      throwAppError({ tRPCCode: "INTERNAL_SERVER_ERROR", appCode: "FREE_PLAN_NOT_FOUND", message: "무료 플랜이 DB에 존재하지 않습니다.", displayType: "toast", retryable: false });
    }

    const now = new Date();

    await billingRepo.createSubscription({ db }, {
      comp_idno,
      plan_idno: free.plan_idno,
      subs_stat: "active",
      star_date: now,
      ends_date: FREE_PLAN_ENDS_DATE, // Free Plan은 만료 없음
      crea_idno: user_idno,
      modi_idno: user_idno,
      // prov_name/prov_subs/ovrr는 null
    });

    // AI 토큰 잔액 초기화 (행이 없을 때만 — INSERT IGNORE)
    await tokenRepo.initBalance({ db }, { comp_idno, amount: free.tokn_mont });

    const created = await billingRepo.findCurrentSubWithPlan({ db }, comp_idno);
    if (!created) {
      throwAppError({ tRPCCode: "INTERNAL_SERVER_ERROR", appCode: "SUBSCRIPTION_CREATE_FAILED", message: "초기 구독 생성에 실패했습니다.", displayType: "toast", retryable: false });
    }
    return created;
  },
  // #endregion

  // #region processExpiredCancellations
  // ✅ 기간 종료된 구독 → free active로 전환
  // - canceled + ends_date < now: 해지예약 기간 종료
  // - active + ends_date < now: 결제 미갱신으로 기간 종료
  // 정석: 크론/잡에서 주기적으로 호출
  async processExpiredCancellations(modi_idno: number) {
    const db = getDb();
    const now = new Date();

    const free = await billingRepo.findPlanByCode({ db }, "free");
    if (!free) {
      throwAppError({ tRPCCode: "INTERNAL_SERVER_ERROR", appCode: "FREE_PLAN_NOT_FOUND", message: "무료 플랜이 DB에 존재하지 않습니다.", displayType: "toast", retryable: false });
    }

    const [canceledTargets, activeTargets] = await Promise.all([
      billingRepo.findExpiredCanceledSubs({ db }, now),
      billingRepo.findExpiredActiveSubs({ db }, now),
    ]);

    const targets = [...canceledTargets, ...activeTargets];
    if (!targets.length) return { processed: 0 };

    for (const t of targets) {
      // 무료 전환 + active 복구 — Free Plan은 만료 없음(영구)
      await billingRepo.updateSubPlan(
        { db },
        { subs_idno: t.subs_idno, plan_idno: free.plan_idno, star_date: now, ends_date: FREE_PLAN_ENDS_DATE, modi_idno },
      );

      await billingRepo.updateSubStat(
        { db },
        { subs_idno: t.subs_idno, subs_stat: "active", modi_idno },
      );
    }

    return { processed: targets.length };
  },
  // #endregion

  // #region getSummary
  async getSummary(ctx: ServiceCtx) {
    const db = getDb();

    // ✅ 누락 방지(정석은 회사 생성 시점 insert지만, 실수 대비)
    const sub = await billingService.ensureSubscriptionForCompany(ctx.comp_idno, ctx.user_idno);

    const member_count = await billingRepo.countActiveMembers({ db }, ctx.comp_idno);
    const seat_limit = sub.seat_ovrr ?? sub.seat_limt;
    const token_month = sub.tokn_ovrr ?? sub.tokn_mont;
    const remaining_seats = Math.max(0, seat_limit - member_count);

    return {
      plan_code: sub.plan_code,
      plan_name: sub.plan_name,
      subs_stat: sub.subs_stat,

      seat_limit,
      token_month,

      star_date: sub.star_date,
      ends_date: sub.ends_date,

      member_count,
      remaining_seats,

      cancel_at_period_end: sub.subs_stat === "canceled",
    };
  },
  // #endregion

  // #region listPlans
  async listPlans() {
    const db = getDb();
    return billingRepo.findAllPlans({ db });
  },
  // #endregion

  // #region applyPlanChange
  // 확장 포인트 — 실제 결제 연동 시 이 함수만 교체(Stripe 등)
  async applyPlanChange(
    comp_idno: number,
    user_idno: number,
    plan_code: "free" | "pro" | "team" | "enterprise",
  ) {
    const db = getDb();

    const plan = await billingRepo.findPlanByCode({ db }, plan_code);
    if (!plan) {
      throwAppError({ tRPCCode: "NOT_FOUND", appCode: "PLAN_NOT_FOUND", message: "플랜을 찾을 수 없습니다.", displayType: "toast", retryable: false });
    }

    const sub = await billingRepo.findCurrentSubWithPlan({ db }, comp_idno);
    if (!sub) {
      throwAppError({ tRPCCode: "NOT_FOUND", appCode: "SUBSCRIPTION_NOT_FOUND", message: "구독이 없습니다. (초기 구독 생성 누락)", displayType: "toast", retryable: false });
    }

    const now = new Date();
    const ends_date = plan_code === "free" ? FREE_PLAN_ENDS_DATE : addDays(now, 30);

    await billingRepo.updateSubPlan(
      { db },
      { subs_idno: sub.subs_idno, plan_idno: plan.plan_idno, star_date: now, ends_date, modi_idno: user_idno },
    );

    // ✅ 업그레이드/다운그레이드 시 해지예약 해제 + active 복구
    await billingRepo.updateSubStat(
      { db },
      { subs_idno: sub.subs_idno, subs_stat: "active", modi_idno: user_idno },
    );

    // 플랜 변경 시 토큰 잔액을 새 플랜 한도로 재설정 (부족한 경우만 보충)
    const newLimit = plan.tokn_mont;
    const currentBalance = await tokenRepo.getBalance({ db }, comp_idno);
    if (currentBalance < newLimit) {
      await tokenRepo.addTokens({ db }, { comp_idno, amount: newLimit - currentBalance });
    }

    return { success: true as const };
  },
  // #endregion

  // #region changePlanFake
  async changePlanFake(ctx: ServiceCtx, plan_code: "free" | "pro" | "team" | "enterprise") {
    return billingService.applyPlanChange(ctx.comp_idno, ctx.user_idno, plan_code);
  },
  // #endregion

  // #region cancelSubscription
  // ✅ 해지 = canceled(해지예약)로만 전환 (plan은 유지)
  async cancelSubscription(ctx: ServiceCtx) {
    const db = getDb();

    const sub = await billingRepo.findCurrentSubWithPlan({ db }, ctx.comp_idno);
    if (!sub) {
      throwAppError({ tRPCCode: "NOT_FOUND", appCode: "SUBSCRIPTION_NOT_FOUND", message: "구독을 찾을 수 없습니다.", displayType: "toast", retryable: false });
    }

    if (sub.plan_code === "free") {
      throwAppError({ tRPCCode: "BAD_REQUEST", appCode: "FREE_PLAN_CANCEL_NOT_ALLOWED", message: "무료 플랜은 해지할 수 없습니다.", displayType: "toast", retryable: false });
    }

    if (sub.subs_stat === "canceled") {
      return {
        success: true as const,
        ends_date: sub.ends_date,
        message: `이미 해지 예약 상태입니다. ${sub.ends_date.toLocaleDateString("ko-KR")}까지 계속 사용하실 수 있습니다.`,
      };
    }

    await billingRepo.updateSubStat(
      { db },
      { subs_idno: sub.subs_idno, subs_stat: "canceled", modi_idno: ctx.user_idno },
    );

    return {
      success: true as const,
      ends_date: sub.ends_date,
      message: `해지 예약되었습니다. ${sub.ends_date.toLocaleDateString("ko-KR")}까지 계속 사용하실 수 있습니다.`,
    };
  },
  // #endregion

  // #region resumeSubscription
  async resumeSubscription(ctx: ServiceCtx) {
    const db = getDb();

    const sub = await billingRepo.findCurrentSubWithPlan({ db }, ctx.comp_idno);
    if (!sub) {
      throwAppError({
        tRPCCode: "NOT_FOUND",
        appCode: "SUBSCRIPTION_NOT_FOUND",
        message: "구독을 찾을 수 없습니다.",
        displayType: "toast",
        retryable: false,
      });
    }

    if (sub.plan_code === "free") {
      throwAppError({
        tRPCCode: "BAD_REQUEST",
        appCode: "FREE_PLAN_RESUME_NOT_ALLOWED",
        message: "무료 플랜은 해지 예약 상태가 아닙니다.",
        displayType: "toast",
        retryable: false,
      });
    }

    if (sub.subs_stat === "active") {
      return {
        success: true as const,
        message: "이미 정상 구독 상태입니다.",
      };
    }

    if (sub.subs_stat !== "canceled") {
      throwAppError({
        tRPCCode: "BAD_REQUEST",
        appCode: "SUBSCRIPTION_RESUME_NOT_ALLOWED",
        message: "해지 예약 상태의 구독만 취소할 수 있습니다.",
        displayType: "toast",
        retryable: false,
      });
    }

    await billingRepo.updateSubStat(
      { db },
      { subs_idno: sub.subs_idno, subs_stat: "active", modi_idno: ctx.user_idno },
    );

    return {
      success: true as const,
      message: "해지 예약이 취소되었습니다.",
    };
  },
  // #endregion

  // #region getUsageSummary
  async getUsageSummary(ctx: ServiceCtx) {
    return aiService.getUsageSummary(ctx.comp_idno);
  },
  // #endregion
};