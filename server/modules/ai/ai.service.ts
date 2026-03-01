// server/modules/ai/ai.service.ts

import { TRPCError } from "@trpc/server";

import { getDb } from "../../core/db";
import type { DbOrTx } from "../../core/db/tx";
import { billingRepo } from "../billing/billing.repo";
import { aiRepo } from "./ai.repo";
import type { AI_FEATURES } from "../../../drizzle/schema";

type AiFeatCode = (typeof AI_FEATURES)[number];

// ─────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────

export const aiService = {
  /**
   * 쿼터 초과 시 FORBIDDEN 에러를 throw.
   * billingRepo.findActiveSubWithPlan 은 active 구독만 반환하지만
   * canceled(유예기간) 구독도 허용하기 위해 직접 쿼리를 extend하지 않고
   * 여기서 null인 경우 제한 없음으로 처리한다.
   */
  async checkQuota(comp_idno: number, estimatedTokens: number): Promise<void> {
    const db = getDb();
    const sub = await billingRepo.findActiveSubWithPlan({ db }, comp_idno);

    // 구독 없음(테스트/개발) → 제한 없음
    if (!sub) return;

    const limit = sub.tokn_ovrr ?? sub.tokn_mont;
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

  async getUsageSummary(comp_idno: number): Promise<UsageSummaryData> {
    const db = getDb();
    const sub = await billingRepo.findActiveSubWithPlan({ db }, comp_idno);

    // 구독 없을 때 기본값
    if (!sub) {
      return {
        plan_code: "free",
        plan_name: "Free",
        total_limit: 10_000,
        total_used: 0,
        remaining: 10_000,
        usage_by_feat: { chat: 0, stt: 0, llm: 0 },
        reset_date: new Date(),
        warning_level: "ok",
      };
    }

    const limit = sub.tokn_ovrr ?? sub.tokn_mont;
    const now = new Date();
    const usage = await aiRepo.getMonthlyUsage(
      { db },
      comp_idno,
      now.getFullYear(),
      now.getMonth() + 1,
    );

    const used = usage.total;
    const remaining = Math.max(0, limit - used);
    const ratio = limit > 0 ? used / limit : 0;
    const warning_level: "ok" | "warning" | "exceeded" =
      ratio >= 1 ? "exceeded" : ratio >= 0.8 ? "warning" : "ok";

    return {
      plan_code: sub.plan_code,
      plan_name: sub.plan_name,
      total_limit: limit,
      total_used: used,
      remaining,
      usage_by_feat: { chat: usage.chat, stt: usage.stt, llm: usage.llm },
      reset_date: sub.ends_date,
      warning_level,
    };
  },
};
