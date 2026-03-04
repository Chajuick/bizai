// server/modules/ai/ai.service.ts

// #region Imports
import { TRPCError } from "@trpc/server";

import { getDb } from "../../core/db";
import type { DbOrTx } from "../../core/db/tx";
import { billingRepo } from "../billing/billing.repo";
import { aiRepo } from "./ai.repo";
import type { AI_FEATURES } from "../../../drizzle/schema";
// #endregion

// #region Types
type AiFeatCode = (typeof AI_FEATURES)[number];

export type UsageSummaryData = {
  plan_code: string;
  plan_name: string;
  total_limit: number;
  total_used: number;
  remaining: number;
  usage_by_feat: { chat: number; stt: number; llm: number };
  reset_date: Date;
  warning_level: "ok" | "warning" | "exceeded";
};

type RecordUsageArgs = {
  comp_idno: number;
  user_idno: number;
  feat_code: AiFeatCode;
  mode_name: string;
  tokn_inpt: number;
  tokn_outs: number;
  meta_json?: object;
};
// #endregion

// #region Helpers
function getWarningLevel(used: number, limit: number): "ok" | "warning" | "exceeded" {
  const ratio = limit > 0 ? used / limit : 0;
  return ratio >= 1 ? "exceeded" : ratio >= 0.8 ? "warning" : "ok";
}

/**
 * ✅ 정석: "현재 유효한 플랜"을 구한다.
 * - active: 그대로 사용
 * - canceled: ends_date(기간 종료) 전까지는 기존 플랜 유지
 * - canceled + 기간 종료: (정석은 billing sweep job이 free로 바꿔줘야 함)
 *   그래도 혹시 스윕이 아직 안 돌았을 수 있으니, 여기서는 보수적으로 free로 취급
 */
function resolveEffectivePlan(sub: {
  subs_stat: string;
  ends_date: Date;
  plan_code: string;
  plan_name: string;
  tokn_ovrr: number | null;
  tokn_mont: number;
}) {
  const now = new Date();

  // 해지 예약이지만 기간 남아있으면 그대로 유지
  if (sub.subs_stat === "canceled" && sub.ends_date > now) {
    return {
      plan_code: sub.plan_code,
      plan_name: sub.plan_name,
      limit: sub.tokn_ovrr ?? sub.tokn_mont,
      reset_date: sub.ends_date,
    };
  }

  // active/trialing/past_due 등: 일단 구독 row 기준
  if (sub.subs_stat !== "canceled") {
    return {
      plan_code: sub.plan_code,
      plan_name: sub.plan_name,
      limit: sub.tokn_ovrr ?? sub.tokn_mont,
      reset_date: sub.ends_date,
    };
  }

  // canceled + 기간 종료(스윕 미적용 가능) → 보수적으로 free
  return {
    plan_code: "free",
    plan_name: "Free",
    limit: 10_000,
    reset_date: sub.ends_date,
  };
}
// #endregion

// #region Service
export const aiService = {
  // #region checkQuota
  /**
   * ✅ 쿼터 초과 시 FORBIDDEN throw.
   * 정석: active만 보지 말고 "current 구독"(active/canceled 포함)을 기준으로 계산해야 함.
   */
  async checkQuota(comp_idno: number, estimatedTokens: number): Promise<void> {
    const db = getDb();

    const sub = await billingRepo.findCurrentSubWithPlan({ db }, comp_idno);

    // 정석 모델: comp는 항상 구독 row가 있어야 함
    if (!sub) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "구독 정보를 찾을 수 없습니다. (초기 구독 생성 누락)",
      });
    }

    const { limit } = resolveEffectivePlan(sub);

    const now = new Date();
    const { total: used } = await aiRepo.getMonthlyUsage(
      { db },
      comp_idno,
      now.getFullYear(),
      now.getMonth() + 1,
    );

    if (used + estimatedTokens > limit) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `AI 사용량이 소진되었습니다. (사용: ${used.toLocaleString()}, 한도: ${limit.toLocaleString()} 토큰)`,
      });
    }
  },
  // #endregion

  // #region recordUsage
  async recordUsage(db: DbOrTx, args: RecordUsageArgs): Promise<void> {
    await aiRepo.recordUsageEvent(
      { db },
      {
        comp_idno: args.comp_idno,
        user_idno: args.user_idno,
        feat_code: args.feat_code,
        mode_name: args.mode_name,
        tokn_inpt: args.tokn_inpt,
        tokn_outs: args.tokn_outs,
        tokn_tota: args.tokn_inpt + args.tokn_outs,
        meta_json: args.meta_json ?? null,
      },
    );
  },
  // #endregion

  // #region getUsageSummary
  async getUsageSummary(comp_idno: number): Promise<UsageSummaryData> {
    const db = getDb();

    // ✅ active-only 금지: canceled(유예기간)도 현재 플랜로 보여줘야 함
    const sub = await billingRepo.findCurrentSubWithPlan({ db }, comp_idno);

    if (!sub) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "구독 정보를 찾을 수 없습니다. (초기 구독 생성 누락)",
      });
    }

    const { plan_code, plan_name, limit, reset_date } = resolveEffectivePlan(sub);

    const now = new Date();
    const usage = await aiRepo.getMonthlyUsage(
      { db },
      comp_idno,
      now.getFullYear(),
      now.getMonth() + 1,
    );

    const used = usage.total;
    const remaining = Math.max(0, limit - used);
    const warning_level = getWarningLevel(used, limit);

    return {
      plan_code,
      plan_name,
      total_limit: limit,
      total_used: used,
      remaining,
      usage_by_feat: { chat: usage.chat, stt: usage.stt, llm: usage.llm },
      reset_date,
      warning_level,
    };
  },
  // #endregion
};
// #endregion