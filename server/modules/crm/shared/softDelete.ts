// server/modules/crm/shared/softDelete.ts

// #region Imports
import { eq } from "drizzle-orm";
// #endregion

// #region Helpers
/**
 * notDeleted
 * - dele_yesn 컬럼을 가진 테이블에 대한 공통 필터
 * - drizzle의 타입 제약이 강하므로 any 허용 (재사용성 우선)
 */
export function notDeleted<T extends { dele_yesn: any }>(t: T) {
  return eq((t as any).dele_yesn, 0);
}
// #endregion