// server/core/db/index.ts

// #region Re-exports
export { getDb, getPool } from "./client";
export type { DbClient } from "./client";

export { getInsertId } from "./insertId";
// #endregion