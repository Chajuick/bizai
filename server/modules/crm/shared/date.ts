// server/modules/crm/shared/date.ts

// #region parseDateOrThrow
/**
 * ISO/date string → Date. 유효하지 않으면 Error throw.
 * Service에서 필수 날짜 필드(create)에 사용.
 */
export function parseDateOrThrow(v: string): Date {
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) throw new Error(`[crm/date] Invalid date string: "${v}"`);
  return d;
}
// #endregion

// #region parseDateOrNull
/**
 * undefined → undefined (필드 미전달 = 수정 안 함)
 * null      → null       (명시적 날짜 지우기)
 * string    → Date
 * Service update patch의 nullable date 컬럼에 사용.
 */
export function parseDateOrNull(v: string | null | undefined): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  return parseDateOrThrow(v);
}
// #endregion

// #region parseDateOrUndefined
/**
 * undefined/falsy → undefined
 * string          → Date
 * Service create의 optional date 컬럼(기본값 없음)에 사용.
 */
export function parseDateOrUndefined(v: string | undefined): Date | undefined {
  if (!v) return undefined;
  return parseDateOrThrow(v);
}
// #endregion
