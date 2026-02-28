// server/core/db/tx.ts

// #region Imports
import type { DbClient } from "./client";
import { getDb } from "./client";
// #endregion

// #region Types
/**
 * TxClient
 * - 트랜잭션 내부 DB 타입 (schema 주입 동일, 의미 명확화 별칭)
 * - Drizzle 트랜잭션 callback 인자는 실제로 MySql2Database<schema>와 동일
 */
export type TxClient = DbClient;

/**
 * DbOrTx
 * - Repo에서 사용할 공통 타입
 */
export type DbOrTx = DbClient | TxClient;
// #endregion

// #region Helpers
/**
 * 이미 트랜잭션 클라이언트인지 덕타이핑으로 판별
 * Drizzle 트랜잭션 callback 인자는 rollback() 메서드를 가짐
 */
function isTxClient(db: DbOrTx): boolean {
  return typeof (db as unknown as Record<string, unknown>).rollback === "function";
}
// #endregion

// #region Transaction Helper
/**
 * tx()
 *
 * 트랜잭션 래퍼
 *
 * 사용 예:
 *   await tx(async (db) => { ... })
 *   await tx(db, async (trx) => { ... })
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
    return getDb().transaction((trx) => fn(trx as TxClient));
  }
  // #endregion

  // #region Case 2: tx(db, async (trx) => ...)
  const fn = maybeFn;
  if (!fn) throw new Error("tx(): callback is required");

  // 이미 트랜잭션 클라이언트라면 그대로 실행 (nested-safe)
  if (isTxClient(dbOrFn)) {
    return fn(dbOrFn);
  }

  return dbOrFn.transaction((trx) => fn(trx as TxClient));
  // #endregion
}
// #endregion