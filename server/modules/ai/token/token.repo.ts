// server/modules/ai/token/token.repo.ts

// #region Imports
import { and, eq, gte, sql } from "drizzle-orm";

import { getInsertId } from "../../../core/db";
import type { DbOrTx } from "../../../core/db/tx";

import {
  AI_TOKEN_BALANCE,
  AI_TOKEN_LEDGER,
} from "../../../../drizzle/schema";
import type { InsertAiTokenLedger } from "../../../../drizzle/schema";
// #endregion

// #region Types
type TokenRepoDeps = { db: DbOrTx };

/**
 * InsertLedgerArgs
 * - ldgr_idno: autoincrement, 생략
 * - crea_date: defaultNow(), 생략
 */
export type InsertLedgerArgs = Omit<InsertAiTokenLedger, "ldgr_idno" | "crea_date">;

type RawDmlResult = { affectedRows: number };
// #endregion

// #region Repo
export const tokenRepo = {
  // #region getBalance
  async getBalance(deps: TokenRepoDeps, comp_idno: number): Promise<number> {
    const { db } = deps;

    const rows = await db
      .select({ bala_tokn: AI_TOKEN_BALANCE.bala_tokn })
      .from(AI_TOKEN_BALANCE)
      .where(eq(AI_TOKEN_BALANCE.comp_idno, comp_idno));

    return rows[0]?.bala_tokn ?? 0;
  },
  // #endregion

  // #region deductTokens
  /**
   * 원자적 토큰 차감
   *
   * UPDATE AI_TOKEN_BALANCE
   *   SET bala_tokn = bala_tokn - {amount}
   *   WHERE comp_idno = ? AND bala_tokn >= {amount}
   *
   * MySQL 행 수준 잠금으로 동시 요청이 양쪽 모두 성공하는 race condition 차단.
   * affectedRows === 1 → 성공 / affectedRows === 0 → 잔액 부족
   */
  async deductTokens(
    deps: TokenRepoDeps,
    args: { comp_idno: number; amount: number }
  ): Promise<{ success: boolean }> {
    const { db } = deps;
    const { comp_idno, amount } = args;

    const result = await db
      .update(AI_TOKEN_BALANCE)
      .set({ bala_tokn: sql`${AI_TOKEN_BALANCE.bala_tokn} - ${amount}` })
      .where(
        and(
          eq(AI_TOKEN_BALANCE.comp_idno, comp_idno),
          gte(AI_TOKEN_BALANCE.bala_tokn, amount)
        )
      );

    // Drizzle mysql2 DML returns [ResultSetHeader, FieldPacket[]]
    const raw = result as unknown;
    const header = Array.isArray(raw) ? raw[0] : raw;
    return { success: (header as RawDmlResult).affectedRows === 1 };
  },
  // #endregion

  // #region addTokens
  /**
   * 토큰 충전/지급 (UPSERT)
   *
   * 행이 없으면 INSERT, 있으면 bala_tokn += amount
   * 월정액 지급·관리자 조정·결제 충전 모두 이 함수로 처리.
   */
  async addTokens(
    deps: TokenRepoDeps,
    args: { comp_idno: number; amount: number }
  ): Promise<void> {
    const { db } = deps;
    const { comp_idno, amount } = args;

    await db
      .insert(AI_TOKEN_BALANCE)
      .values({ comp_idno, bala_tokn: amount })
      .onDuplicateKeyUpdate({
        set: { bala_tokn: sql`${AI_TOKEN_BALANCE.bala_tokn} + ${amount}` },
      });
  },
  // #endregion

  // #region insertLedger
  /**
   * 원장 항목 추가
   *
   * delt_tokn: 차감이면 음수(-), 충전이면 양수(+)
   */
  async insertLedger(
    deps: TokenRepoDeps,
    entry: InsertLedgerArgs
  ): Promise<{ ldgr_idno: number }> {
    const { db } = deps;

    const result = await db.insert(AI_TOKEN_LEDGER).values(entry);

    return { ldgr_idno: getInsertId(result) };
  },
  // #endregion
} as const;
// #endregion
