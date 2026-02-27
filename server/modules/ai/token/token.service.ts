// server/modules/ai/token/token.service.ts

// #region Imports
import { getDb } from "../../../core/db";
import { tx } from "../../../core/db/tx";
import type { ServiceCtx } from "../../../core/serviceCtx";

import type { AI_FEATURES, LEDGER_REASONS } from "../../../../drizzle/schema";

import { tokenRepo } from "./token.repo";
// #endregion

// #region Types
type AiFeature = (typeof AI_FEATURES)[number];
type LedgerReason = (typeof LEDGER_REASONS)[number];

export type ChargeArgs = {
  amount: number;
  feat_code: AiFeature;
  resn_code: LedgerReason;
  refe_type?: string;
  refe_idno?: number;
  meta_json?: unknown;
};

export type GrantArgs = {
  amount: number;
  resn_code: LedgerReason;
  refe_type?: string;
  refe_idno?: number;
  meta_json?: unknown;
};

export type ChargeResult =
  | { success: true; ldgr_idno: number }
  | { success: false };
// #endregion

// #region Helpers
function currentYearMont(): number {
  const d = new Date();
  return d.getFullYear() * 100 + (d.getMonth() + 1);
}
// #endregion

// #region Service
export const tokenService = {
  // #region getBalance
  async getBalance(ctx: ServiceCtx): Promise<{ bala_tokn: number }> {
    const db = getDb();
    const bala_tokn = await tokenRepo.getBalance({ db }, ctx.comp_idno);
    return { bala_tokn };
  },
  // #endregion

  // #region charge
  /**
   * 토큰 차감 + 원장 기록 (트랜잭션)
   *
   * 1. 원자적 UPDATE WHERE bala_tokn >= amount
   * 2. affectedRows=0 → { success: false } (잔액 부족)
   * 3. 성공 시 AI_TOKEN_LEDGER에 음수 delt_tokn 삽입
   *
   * 트랜잭션 보장: 원장 삽입 실패 시 차감도 롤백됨.
   */
  async charge(ctx: ServiceCtx, args: ChargeArgs): Promise<ChargeResult> {
    return tx(async (trx) => {
      const { success } = await tokenRepo.deductTokens(
        { db: trx },
        { comp_idno: ctx.comp_idno, amount: args.amount }
      );

      if (!success) return { success: false };

      const { ldgr_idno } = await tokenRepo.insertLedger(
        { db: trx },
        {
          comp_idno: ctx.comp_idno,
          actv_user: ctx.user_idno,
          resn_code: args.resn_code,
          feat_code: args.feat_code,
          delt_tokn: -args.amount,
          year_mont: currentYearMont(),
          refe_type: args.refe_type ?? null,
          refe_idno: args.refe_idno ?? null,
          meta_json: args.meta_json ?? null,
        }
      );

      return { success: true, ldgr_idno };
    });
  },
  // #endregion

  // #region grant
  /**
   * 토큰 지급/충전 + 원장 기록 (트랜잭션)
   *
   * 월정액 지급, 관리자 조정, 결제 충전 등에 사용.
   * INSERT ON DUPLICATE KEY UPDATE로 행이 없어도 안전하게 초기화.
   */
  async grant(ctx: ServiceCtx, args: GrantArgs): Promise<{ ldgr_idno: number }> {
    return tx(async (trx) => {
      await tokenRepo.addTokens(
        { db: trx },
        { comp_idno: ctx.comp_idno, amount: args.amount }
      );

      const { ldgr_idno } = await tokenRepo.insertLedger(
        { db: trx },
        {
          comp_idno: ctx.comp_idno,
          actv_user: null,
          resn_code: args.resn_code,
          feat_code: null,
          delt_tokn: args.amount,
          year_mont: currentYearMont(),
          refe_type: args.refe_type ?? null,
          refe_idno: args.refe_idno ?? null,
          meta_json: args.meta_json ?? null,
        }
      );

      return { ldgr_idno };
    });
  },
  // #endregion
} as const;
// #endregion
