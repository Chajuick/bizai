// server/core/trpc.ts

// #region Imports
import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import type { TrpcContext } from "./context";
import { AppError } from "./appError";
import { logger } from "../logger";
// #endregion

// #region Types
export type AuthedContext = TrpcContext & {
  user: NonNullable<TrpcContext["user"]>;
};

export type ProtectedContext = AuthedContext & {
  comp_idno: number;
};
// #endregion

// #region Helpers
const DEFAULT_ERROR_MESSAGE = "처리 중 오류가 발생했습니다.";

function sanitizeErrorMessage(params: {
  error: TRPCError;
  appErr: AppError | null;
}): string {
  const { error, appErr } = params;

  // 서버가 명시적으로 만든 사용자용 에러는 그대로 노출
  if (appErr) {
    return appErr.message;
  }

  // 인증/권한 에러는 이미 안전한 상수 메시지를 쓰고 있으니 허용
  if (
    error.code === "UNAUTHORIZED" ||
    error.code === "FORBIDDEN" ||
    error.code === "BAD_REQUEST" ||
    error.code === "NOT_FOUND" ||
    error.code === "CONFLICT"
  ) {
    const msg = error.message?.trim();
    return msg ? msg : DEFAULT_ERROR_MESSAGE;
  }

  // 그 외 INTERNAL/infra/DB/tRPC 내부 에러는 전부 기본 문구
  return DEFAULT_ERROR_MESSAGE;
}
// #endregion

// #region tRPC Init
const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error, ctx }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      const cause = error.cause;
      logger.error(
        {
          path: shape.data?.path,
          message: error.message,
          cause: cause instanceof Error ? cause.message : cause,
          issues: (cause as { issues?: unknown })?.issues ?? null,
        },
        "[tRPC] INTERNAL_SERVER_ERROR",
      );
    }

    const appErr = error.cause instanceof AppError ? error.cause : null;
    const safeMessage = sanitizeErrorMessage({ error, appErr });

    return {
      ...shape,
      message: safeMessage,
      data: {
        ...shape.data,
        requestId: ctx?.requestId ?? null,
        ...(error.code === "BAD_REQUEST" &&
        error.cause instanceof Error &&
        !(error.cause instanceof AppError)
          ? { validationErrors: (error.cause as { issues?: unknown }).issues ?? null }
          : {}),
        appCode: appErr?.appCode ?? null,
        displayType: appErr?.displayType ?? "toast",
        retryable: appErr?.retryable ?? false,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
// #endregion

// #region Middlewares
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

const requireSystemAdmin = t.middleware(({ ctx, next }) => {
  const actx = ctx as AuthedContext;

  if (actx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  }

  return next({ ctx: actx });
});

const requireCompanyAdmin = t.middleware(({ ctx, next }) => {
  const pctx = ctx as ProtectedContext;

  const isCompanyAdmin =
    pctx.comp_role === "owner" || pctx.comp_role === "admin";

  if (!isCompanyAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  }

  return next({ ctx: pctx });
});
// #endregion

// #region Procedures
export const authedProcedure = t.procedure.use(requireUser);
export const protectedProcedure = t.procedure.use(requireUser).use(requireCompany);
export const systemAdminProcedure = t.procedure.use(requireUser).use(requireSystemAdmin);
export const companyAdminProcedure = t.procedure
  .use(requireUser)
  .use(requireCompany)
  .use(requireCompanyAdmin);
// #endregion