// server/core/db/tx.ts

// #region Imports
import type { MySql2Database } from "drizzle-orm/mysql2";

import type { DbClient } from "./client";
import { getDb } from "./client";
// #endregion

// #region Types
/**
 * TxClient
 * - 트랜잭션 내부에서 사용하는 DB 타입
 * - DbClient와 동일하게 취급 가능
 */
export type TxClient = MySql2Database<any>;

/**
 * DbOrTx
 * - Repo에서 사용할 공통 타입
 */
export type DbOrTx = DbClient | TxClient;
// #endregion

// #region Transaction Helper
/**
 * tx()
 *
 * 정석 트랜잭션 래퍼
 *
 * 사용 예:
 *
 * await tx(async (db) => { ... })
 * await tx(db, async (trx) => { ... })
 *
 * 특징:
 * - 자동 commit / rollback
 * - 기존 트랜잭션이 있으면 재사용 (nested-safe)
 * - 서비스 레이어에서만 호출 권장
 */
export async function tx<T>(
  dbOrFn: DbClient | ((trx: TxClient) => Promise<T>),
  maybeFn?: (trx: TxClient) => Promise<T>
): Promise<T> {
  // #region Case 1: tx(async (trx) => ...)
  if (typeof dbOrFn === "function") {
    const fn = dbOrFn;
    const db = getDb();

    return db.transaction(async (trx) => {
      return fn(trx);
    });
  }
  // #endregion

  // #region Case 2: tx(db, async (trx) => ...)
  const db = dbOrFn;
  const fn = maybeFn;
  if (!fn) throw new Error("tx(): callback is required");

  // 이미 transaction client라면 그대로 실행 (nested-safe)
  if (typeof (db as any).rollback === "function") {
    return fn(db as TxClient);
  }

  return (db as DbClient).transaction(async (trx) => {
    return fn(trx);
  });
  // #endregion
}
// #endregion