// server/modules/crm/shared/decimal.ts
// DB decimal 컬럼은 항상 string으로 저장 (부동소수 오차 방지 정책)

// #region toDecimalStr
/**
 * number → "0.00" 형식 decimal string.
 * create payload의 필수 decimal 컬럼에 사용.
 */
export function toDecimalStr(v: number): string {
  return v.toFixed(2);
}
// #endregion

// #region toDecimalStrOrNull
/**
 * undefined → undefined (필드 미전달 = 수정 안 함)
 * null      → null       (명시적 값 지우기)
 * number    → "0.00" 형식 decimal string
 * update patch의 nullable decimal 컬럼에 사용.
 */
export function toDecimalStrOrNull(v: number | null | undefined): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  return toDecimalStr(v);
}
// #endregion
