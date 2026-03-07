// server/modules/ai/ai.service.ts

// #region Imports
import { getDb } from "../../core/db";
import { throwAppError } from "../../core/trpc/appError";
import type { DbOrTx } from "../../core/db/tx";
import { billingRepo } from "../billing/billing.repo";
import { aiRepo } from "./ai.repo";
import { tokenRepo } from "./token/token.repo";
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
  // #region checkAndDeductQuota
  /**
   * ✅ 원자적 quota 차감 (레이스 컨디션 방지)
   *
   * 기존 checkQuota(read → check)는 동시 요청 시 양쪽이 통과하는 race가 있었음.
   * 이 함수는 tokenRepo.deductTokens (UPDATE WHERE bala_tokn >= amount) 로
   * DB 행 수준 잠금에서 원자적으로 처리한다.
   *
   * 잔액 행이 없으면(최초 사용) 플랜 한도로 초기화 후 1회 재시도.
   * 재시도도 실패하면 → FORBIDDEN.
   */
  async checkAndDeductQuota(comp_idno: number, estimatedTokens: number): Promise<void> {
    const db = getDb();

    let result = await tokenRepo.deductTokens({ db }, { comp_idno, amount: estimatedTokens });

    if (!result.success) {
      // 잔액이 0인 경우: 미초기화일 수 있으므로 플랜 한도로 lazy-seed 후 재시도
      const balance = await tokenRepo.getBalance({ db }, comp_idno);
      if (balance === 0) {
        const sub = await billingRepo.findCurrentSubWithPlan({ db }, comp_idno);
        if (sub) {
          const { limit } = resolveEffectivePlan(sub);
          await tokenRepo.initBalance({ db }, { comp_idno, amount: limit });
          result = await tokenRepo.deductTokens({ db }, { comp_idno, amount: estimatedTokens });
        }
      }
    }

    if (!result.success) {
      const balance = await tokenRepo.getBalance({ db }, comp_idno);
      throwAppError({
        tRPCCode: "FORBIDDEN",
        appCode: "AI_QUOTA_EXCEEDED",
        message: `AI 사용 한도가 소진되었습니다. (잔여: ${balance.toLocaleString()} / 필요: ${estimatedTokens.toLocaleString()} 토큰)`,
        displayType: "toast",
      });
    }
  },
  // #endregion

  // #region refundQuota
  /**
   * AI 호출 실패 시 차감된 토큰을 전액 환불
   * - checkAndDeductQuota 성공 후 AI 호출이 실패한 경우에만 호출
   */
  async refundQuota(comp_idno: number, amount: number): Promise<void> {
    const db = getDb();
    await tokenRepo.addTokens({ db }, { comp_idno, amount });
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
      throwAppError({
        tRPCCode: "NOT_FOUND",
        appCode: "SUBSCRIPTION_NOT_FOUND",
        message: "구독 정보를 찾을 수 없습니다. (초기 구독 생성 누락)",
        displayType: "toast",
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