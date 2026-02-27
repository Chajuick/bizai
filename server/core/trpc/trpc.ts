// server/core/trpc.ts

// #region Imports
import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import type { TrpcContext } from "./context";
// #endregion

// #region Types
/**
 * AuthedContext
 * - 로그인(user)만 보장
 * - comp_idno는 null일 수 있다 (예: 시스템 전역 라우트/초기 가입 플로우 등)
 */
export type AuthedContext = TrpcContext & {
  user: NonNullable<TrpcContext["user"]>;
};

/**
 * ProtectedContext
 * - 로그인(user) + 회사(comp_idno)까지 보장
 * - CRM 도메인 대부분은 이 컨텍스트를 사용한다.
 */
export type ProtectedContext = AuthedContext & {
  comp_idno: number;
};
// #endregion

// #region tRPC Init
const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
// #endregion

// #region Middlewares
/**
 * requireUser
 * - 로그인 필수
 * - ctx를 AuthedContext로 좁혀서 downstream에서 user null 충돌 제거
 */
const requireUser = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  const nextCtx: AuthedContext = {
    ...ctx,
    user: ctx.user,
  };

  return next({ ctx: nextCtx });
});

/**
 * requireCompany
 * - 회사 컨텍스트(comp_idno) 필수
 * - ctx를 ProtectedContext로 좁혀서 downstream에서 comp_idno null 충돌 제거
 */
const requireCompany = t.middleware(({ ctx, next }) => {
  const actx = ctx as AuthedContext;

  if (actx.comp_idno == null) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Company context not found." });
  }

  const nextCtx: ProtectedContext = {
    ...actx,
    comp_idno: actx.comp_idno,
  };

  return next({ ctx: nextCtx });
});

/**
 * requireSystemAdmin
 * - 시스템(전역) 관리자: ctx.user.role === "admin"
 */
const requireSystemAdmin = t.middleware(({ ctx, next }) => {
  const actx = ctx as AuthedContext;

  if (actx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  }

  return next({ ctx: actx });
});

/**
 * requireCompanyAdmin
 * - 회사(테넌트) 관리자: ctx.company_role in ["owner","admin"]
 * - 회사 role은 context에서 멤버십으로 확정해둔다.
 */
const requireCompanyAdmin = t.middleware(({ ctx, next }) => {
  const pctx = ctx as ProtectedContext;

  const isCompanyAdmin = pctx.company_role === "owner" || pctx.company_role === "admin";
  if (!isCompanyAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  }

  return next({ ctx: pctx });
});
// #endregion

// #region Procedures
/**
 * authedProcedure
 * - 로그인만 보장
 * - comp_idno가 아직 없는 플로우(예: 회사 초대 수락/회사 생성/전역 관리 등)에 사용 가능
 */
export const authedProcedure = t.procedure.use(requireUser);

/**
 * protectedProcedure
 * - 로그인 + 회사(comp_idno)까지 보장
 * - CRM 대부분의 도메인 router는 이걸 쓰는 게 정석
 */
export const protectedProcedure = t.procedure.use(requireUser).use(requireCompany);

/**
 * systemAdminProcedure
 * - 로그인 + 시스템 admin(user_auth 기반)을 보장
 */
export const systemAdminProcedure = t.procedure.use(requireUser).use(requireSystemAdmin);

/**
 * companyAdminProcedure
 * - 로그인 + 회사 컨텍스트 + 회사 admin(role_code 기반)을 보장
 */
export const companyAdminProcedure = t.procedure.use(requireUser).use(requireCompany).use(requireCompanyAdmin);
// #endregion