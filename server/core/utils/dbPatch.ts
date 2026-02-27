// #region Nullable Patch Utility

/**
 * normalizeNullablePatch
 *
 * - undefined: patch에서 제외 (update 하지 않음)
 * - nullableKeys에 포함된 필드:
 *    - "" (빈문자) -> null 로 변환 (옵션)
 * - 그 외 필드:
 *    - 값 그대로 유지
 *
 * ⚠️ 주의:
 * - nullableKeys에 넣는 필드는 DB 컬럼이 실제로 NULL 허용이어야 함.
 */
export function normalizeNullablePatch<
  T extends Record<string, any>,
  K extends keyof T
>(
  patch: Partial<T>,
  nullableKeys: readonly K[],
  options?: { emptyStringToNull?: boolean }
): Partial<T> {
  // #region Options
  const emptyStringToNull = options?.emptyStringToNull ?? true;
  // #endregion

  // #region Convert keys safely
  const result: Partial<T> = {};
  const keys = Object.keys(patch) as (keyof T)[];
  // #endregion

  // #region Normalize
  for (const key of keys) {
    const value = patch[key];

    // undefined는 patch에서 제거
    if (value === undefined) continue;

    // nullable 대상이면 "" -> null (옵션)
    if (nullableKeys.includes(key as K)) {
      if (emptyStringToNull && value === "") {
        // TS는 T[K]가 null 허용인지 모르므로 좁게 캐스팅
        (result as any)[key] = null;
        continue;
      }
    }

    result[key] = value;
  }
  // #endregion

  return result;
}

// #endregion