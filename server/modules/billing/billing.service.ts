// server/modules/billing/billing.service.ts

// #region Imports
import { TRPCError } from "@trpc/server";

import type { ServiceCtx } from "../../core/serviceCtx";
import { getDb } from "../../core/db";
import { billingRepo } from "./billing.repo";
import { aiService } from "../ai/ai.service";
// #endregion

// #region Helpers
function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}
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
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "무료 플랜이 DB에 존재하지 않습니다." });
    }

    const now = new Date();
    const ends = addDays(now, 30);

    await billingRepo.createSubscription({ db }, {
      comp_idno,
      plan_idno: free.plan_idno,
      subs_stat: "active",
      star_date: now,
      ends_date: ends,
      crea_idno: user_idno,
      modi_idno: user_idno,
      // prov_name/prov_subs/ovrr는 null
    });

    const created = await billingRepo.findCurrentSubWithPlan({ db }, comp_idno);
    if (!created) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "초기 구독 생성에 실패했습니다." });
    }
    return created;
  },
  // #endregion

  // #region processExpiredCancellations
  // ✅ 기간 종료된 해지예약(canceled) → free active로 전환
  // 정석: 크론/잡에서 주기적으로 호출
  async processExpiredCancellations(modi_idno: number) {
    const db = getDb();
    const now = new Date();

    const free = await billingRepo.findPlanByCode({ db }, "free");
    if (!free) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "무료 플랜이 DB에 존재하지 않습니다." });
    }

    const targets = await billingRepo.findExpiredCanceledSubs({ db }, now);
    if (!targets.length) return { processed: 0 };

    for (const t of targets) {
      // 무료 전환 + active 복구 + 새로운 기간 설정(정책에 따라 조정 가능)
      const star_date = now;
      const ends_date = addDays(now, 30);

      await billingRepo.updateSubPlan(
        { db },
        { subs_idno: t.subs_idno, plan_idno: free.plan_idno, star_date, ends_date, modi_idno },
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
      throw new TRPCError({ code: "NOT_FOUND", message: "플랜을 찾을 수 없습니다." });
    }

    const sub = await billingRepo.findCurrentSubWithPlan({ db }, comp_idno);
    if (!sub) {
      throw new TRPCError({ code: "NOT_FOUND", message: "구독이 없습니다. (초기 구독 생성 누락)" });
    }

    const now = new Date();
    const ends_date = addDays(now, 30);

    await billingRepo.updateSubPlan(
      { db },
      { subs_idno: sub.subs_idno, plan_idno: plan.plan_idno, star_date: now, ends_date, modi_idno: user_idno },
    );

    // ✅ 업그레이드/다운그레이드 시 해지예약 해제 + active 복구
    await billingRepo.updateSubStat(
      { db },
      { subs_idno: sub.subs_idno, subs_stat: "active", modi_idno: user_idno },
    );

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
      throw new TRPCError({ code: "NOT_FOUND", message: "구독을 찾을 수 없습니다." });
    }

    if (sub.plan_code === "free") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "무료 플랜은 해지할 수 없습니다." });
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

  // #region getUsageSummary
  async getUsageSummary(ctx: ServiceCtx) {
    return aiService.getUsageSummary(ctx.comp_idno);
  },
  // #endregion
};