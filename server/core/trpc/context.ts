// server/core/context.ts

// #region Imports
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

import type { User } from "../../../drizzle/schema";
import { CORE_COMPANY_USER } from "../../../drizzle/schema";

import { sdk } from "../sdk";
import { getDb } from "../db/index";
import { logger } from "../logger";
// #endregion

// #region Types
/**
 * AppRole
 * - 시스템(전역) 권한: CORE_USER.user_auth 기반
 */
export type AppRole = "admin" | "user";

/**
 * CompanyRole
 * - 회사 멤버십 권한: CORE_COMPANY_USER.role_code 기반
 */
export type CompanyRole = "owner" | "admin" | "member";

/**
 * ContextUser
 * - DB User + 앱 표준 role 제공
 * - 앞으로는 ctx.user.role을 공식으로 사용
 */
export type ContextUser = User & {
  role: AppRole;
};

/**
 * TrpcContext
 * - public: user/comp nullable
 * - authed/protected/admin: middleware에서 NonNullable로 좁혀줌
 */
export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];

  /** 요청 상관 ID — Express requestIdMiddleware에서 주입 */
  requestId: string;

  user: ContextUser | null;

  /**
   * 테넌트 키
   * - public에서는 null 가능
   * - protectedProcedure에서 반드시 number로 보장
   */
  comp_idno: number | null;

  /**
   * 회사 멤버십 권한(확장 정보)
   * - authedProcedure에서는 optional
   * - protected/companyAdmin에서는 존재하는 것이 자연스럽지만,
   *   fail-safe를 위해 optional 유지
   */
  company_role?: CompanyRole | null;
};
// #endregion

// #region Role Mapping Helpers
/**
 * mapUserAuthToRole
 * - DB의 user_auth(레거시/문자열)를 앱 role로 매핑
 * - "정석"은 이 값을 core에서 표준화해서 ctx.user.role로 제공하는 것.
 */
function mapUserAuthToRole(user_auth: string | null | undefined): AppRole {
  const v = (user_auth ?? "").toLowerCase();
  if (v === "admin") return "admin";
  return "user";
}

/**
 * normalizeCompanyRole
 * - CORE_COMPANY_USER.role_code 값을 CompanyRole로 정규화
 */
function normalizeCompanyRole(raw: string | null | undefined): CompanyRole | null {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v === "owner") return "owner";
  if (v === "admin") return "admin";
  if (v === "member") return "member";
  return null;
}
// #endregion

// #region Factory
export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const requestId = opts.req.__requestId;

  // #region Vars
  let user: ContextUser | null = null;
  let comp_idno: number | null = null;
  let company_role: CompanyRole | null = null;
  // #endregion

  try {
    // #region 1) Authenticate (optional)
    const authed = await sdk.authenticateRequest(opts.req);

    if (authed) {
      user = {
        ...authed,
        role: mapUserAuthToRole((authed as { user_auth?: string | null }).user_auth),
      };
    }
    // #endregion

    // #region 2) Resolve company by membership (policy: 1 user -> 1 company)
    if (user) {
      const db = getDb();

      const [membership] = await db
        .select({
          comp_idno: CORE_COMPANY_USER.comp_idno,
          role_code: CORE_COMPANY_USER.role_code,
          status_code: CORE_COMPANY_USER.status_code,
        })
        .from(CORE_COMPANY_USER)
        .where(and(eq(CORE_COMPANY_USER.user_idno, user.user_idno), eq(CORE_COMPANY_USER.status_code, "active")))
        .limit(1);

      comp_idno = membership?.comp_idno ?? null;
      company_role = normalizeCompanyRole(membership?.role_code);
    }
    // #endregion
  } catch (err) {
    // #region 에러 분기
    // JWT 검증 실패/세션 없음 → 정상 폴백 (public context)
    // DB 장애/예상치 못한 에러 → 500 전파 (은닉 금지)
    const isAuthError =
      err instanceof Error &&
      (err.message.includes("ForbiddenError") ||
        err.message.includes("Invalid session") ||
        err.message.includes("User not found") ||
        err.name === "JWTExpired" ||
        err.name === "JWSInvalid" ||
        err.name === "JWTInvalid");

    if (isAuthError) {
      logger.debug({ requestId, err: (err as Error).message }, "auth token rejected — public context");
      user = null;
      comp_idno = null;
      company_role = null;
    } else {
      logger.error({ requestId, err }, "createContext unexpected error — propagating 500");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        cause: err,
      });
    }
    // #endregion
  }

  return {
    req: opts.req,
    res: opts.res,
    requestId,
    user,
    comp_idno,
    company_role,
  };
}
// #endregion