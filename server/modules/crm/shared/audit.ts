// server/modules/crm/shared/audit.ts

// #region Imports
import type { ServiceCtx } from "../../../core/serviceCtx";
// #endregion

// #region Types
/**
 * CreateAuditFields
 * - auditCols() 스펙 기반
 */
export type CreateAuditFields = {
  crea_idno: number;
};

/**
 * UpdateAuditFields
 * - auditCols() 스펙 기반
 */
export type UpdateAuditFields = {
  modi_idno: number;
};
// #endregion

// #region Helpers
/**
 * withCreateAudit
 * - insert payload에 생성 감사 컬럼을 추가
 *
 * 규칙:
 * - crea_date는 DB defaultNow()로 채워지므로 앱에서 넣지 않는다.
 * - modi_*는 create에서 넣지 않는다(정석).
 */
export function withCreateAudit<T extends object>(ctx: ServiceCtx, payload: T): T & CreateAuditFields {
  return {
    ...payload,
    crea_idno: ctx.user_idno,
  };
}

/**
 * withUpdateAudit
 * - update payload에 수정 감사 컬럼을 추가
 *
 * 규칙:
 * - modi_date는 DB onUpdateNow()로 채워지므로 앱에서 넣지 않는다.
 */
export function withUpdateAudit<T extends object>(ctx: ServiceCtx, patch: T): T & UpdateAuditFields {
  return {
    ...patch,
    modi_idno: ctx.user_idno,
  };
}
// #endregion