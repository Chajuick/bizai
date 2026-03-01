// server/modules/billing/billing.service.ts

// #region Imports
import { TRPCError } from "@trpc/server";

import type { ServiceCtx } from "../../core/serviceCtx";
import { getDb } from "../../core/db";
import { billingRepo } from "./billing.repo";
import { aiService } from "../ai/ai.service";
// #endregion

export const billingService = {
  // ───── getSummary ─────
  async getSummary(ctx: ServiceCtx) {
    const db = getDb();
    const sub = await billingRepo.findActiveSubWithPlan({ db }, ctx.comp_idno);

    if (!sub) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "활성 구독을 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.",
      });
    }

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
    };
  },

  // ───── listPlans ─────
  async listPlans() {
    const db = getDb();
    return billingRepo.findAllPlans({ db });
  },

  // ───── applyPlanChange (확장 포인트 — 실제 결제 연동 시 이 함수만 교체) ─────
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

    const sub = await billingRepo.findActiveSubWithPlan({ db }, comp_idno);
    if (!sub) {
      throw new TRPCError({ code: "NOT_FOUND", message: "활성 구독이 없습니다." });
    }

    const now = new Date();
    const ends_date = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await billingRepo.updateSubPlan(
      { db },
      { subs_idno: sub.subs_idno, plan_idno: plan.plan_idno, star_date: now, ends_date, modi_idno: user_idno },
    );

    return { success: true as const };
  },

  // ───── changePlanFake ─────
  async changePlanFake(ctx: ServiceCtx, plan_code: "free" | "pro" | "team" | "enterprise") {
    return billingService.applyPlanChange(ctx.comp_idno, ctx.user_idno, plan_code);
  },

  // ───── cancelSubscription ─────
  async cancelSubscription(ctx: ServiceCtx) {
    const db = getDb();
    const sub = await billingRepo.findActiveSubWithPlan({ db }, ctx.comp_idno);

    if (!sub) {
      throw new TRPCError({ code: "NOT_FOUND", message: "활성 구독을 찾을 수 없습니다." });
    }
    if (sub.plan_code === "free") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "무료 플랜은 해지할 수 없습니다." });
    }

    await billingRepo.updateSubStat(
      { db },
      { subs_idno: sub.subs_idno, subs_stat: "canceled", modi_idno: ctx.user_idno },
    );

    return {
      success: true as const,
      ends_date: sub.ends_date,
      message: `플랜이 해지 예약되었습니다. ${sub.ends_date.toLocaleDateString("ko-KR")}까지 계속 사용하실 수 있습니다.`,
    };
  },

  // ───── getUsageSummary ─────
  async getUsageSummary(ctx: ServiceCtx) {
    return aiService.getUsageSummary(ctx.comp_idno);
  },
};
