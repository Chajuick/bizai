// server/core/svcCtx.ts

// #region Imports
import type { ProtectedContext } from "./trpc";
import type { ServiceCtx } from "./serviceCtx";
// #endregion

// #region Helpers
/**
 * svcCtxFromTrpc
 * - tRPC ctx(ProtectedContext) → ServiceCtx 변환의 "공식 루트"
 *
 * 정석:
 * - router에서는 protectedProcedure 이후에만 호출한다.
 * - 따라서 comp_idno/user가 이미 보장된 상태다.
 */
export function svcCtxFromTrpc(ctx: ProtectedContext): ServiceCtx {
  return {
    comp_idno: ctx.comp_idno,
    user_idno: ctx.user.user_idno,
    user_role: ctx.user.role,
    company_role: ctx.company_role ?? null,
  };
}
// #endregion