// server/core/db/client.ts

// #region Imports
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import * as schema from "../../../drizzle/schema";
// #endregion

// #region Types
/**
 * DbClient
 * - drizzle(mysql2) DB 타입 (schema 주입)
 * - repo/service에서 db as any를 제거하기 위한 핵심
 */
export type DbClient = MySql2Database<typeof schema>;
// #endregion

// #region Singleton
let _db: DbClient | null = null;
let _pool: mysql.Pool | null = null;
// #endregion

// #region Factory
/**
 * getDb
 *
 * - 단일 DB 인스턴스 싱글톤
 * - 인프라 레벨에서만 제공 (domain 로직 금지)
 * - schema를 주입해 타입 안정성을 강하게 가져간다.
 */
export function getDb(): DbClient {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("[DB] DATABASE_URL is not configured.");

  // mysql2 pool 권장 (연결 안정성/성능)
  _pool = mysql.createPool(url);

  _db = drizzle(_pool, {
    schema,
    mode: "default",
  });

  return _db;
}

/**
 * getPool
 * - 필요 시 raw mysql2 pool 접근용(옵션)
 * - 웬만하면 drizzle만 쓰는 걸 권장
 */
export function getPool(): mysql.Pool {
  if (!_pool) {
    // getDb()를 먼저 호출하게 유도
    getDb();
  }
  if (!_pool) throw new Error("[DB] Pool is not initialized.");
  return _pool;
}
// #endregion