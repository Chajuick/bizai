// server/core/db/insertId.ts

// #region Imports
import type { ResultSetHeader } from "mysql2";
// #endregion

// #region Types
type InsertResultLike =
  | ResultSetHeader
  | { insertId?: number | bigint | string | null }
  | [{ insertId?: number | bigint | string | null }]
  | unknown;
// #endregion

// #region Utils
function coerceToPositiveNumber(v: unknown): number | null {
  if (v == null) return null;

  if (typeof v === "number") {
    return Number.isFinite(v) && v > 0 ? v : null;
  }

  // ✅ BigInt literal(0n) 대신 BigInt(0) 사용 → ES2020 미만에서도 코드 자체는 OK
  // (단, 런타임이 BigInt를 지원해야 함. Node 10+면 보통 OK)
  if (typeof v === "bigint") {
    return v > BigInt(0) ? Number(v) : null;
  }

  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  return null;
}

/**
 * getInsertId
 * - drizzle(mysql2) insert 결과에서 insertId를 안전하게 추출
 * - 반환 형태가 [ResultSetHeader] 같이 올 때도 흡수
 */
export function getInsertId(res: InsertResultLike): number {
  const r0 = Array.isArray(res) ? res[0] : res;
  const maybe = (r0 as { insertId?: unknown } | null)?.insertId;

  const n = coerceToPositiveNumber(maybe);
  if (!n) throw new Error("[DB] Failed to resolve insertId.");

  return n;
}
// #endregion