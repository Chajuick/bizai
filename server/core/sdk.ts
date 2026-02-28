// server/core/sdk.ts
// SessionManager: JWT 세션 서명/검증 + 요청 인증

// #region Imports
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import { userRepo } from "./auth/user.repo";
import { ENV } from "./env/env";
import { logger } from "./logger";
// #endregion

// #region Types
export type SessionPayload = {
  userId: number;
  name: string;
};
// #endregion

// #region Helpers
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  if (!cookieHeader) return new Map();
  return new Map(Object.entries(parseCookieHeader(cookieHeader)));
}

function getSessionSecret(): Uint8Array {
  return new TextEncoder().encode(ENV.cookieSecret);
}
// #endregion

// #region Session
export async function signSession(
  payload: SessionPayload,
  options: { expiresInMs?: number } = {}
): Promise<string> {
  const issuedAt = Date.now();
  const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);

  return new SignJWT({ userId: payload.userId, name: payload.name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(getSessionSecret());
}

export async function verifySession(
  cookieValue: string | undefined | null
): Promise<{ userId: number; name: string } | null> {
  if (!cookieValue) {
    logger.debug("auth: missing session cookie");
    return null;
  }

  try {
    const { payload } = await jwtVerify(cookieValue, getSessionSecret(), {
      algorithms: ["HS256"],
    });
    const { userId, name } = payload as Record<string, unknown>;

    if (typeof userId !== "number" || !isNonEmptyString(name)) {
      logger.warn("auth: session payload missing required fields");
      return null;
    }

    return { userId, name };
  } catch (error) {
    logger.debug({ err: String(error) }, "auth: session verification failed");
    return null;
  }
}
// #endregion

// #region Request Authentication
export async function authenticateRequest(req: Request): Promise<User> {
  const cookies = parseCookies(req.headers.cookie);
  const sessionCookie = cookies.get(COOKIE_NAME);
  const session = await verifySession(sessionCookie);

  if (!session) {
    throw ForbiddenError("Invalid session cookie");
  }

  const user = await userRepo.findById(session.userId);

  if (!user) {
    throw ForbiddenError("User not found");
  }

  // 마지막 로그인 시간 갱신 — fire-and-forget (응답 지연 없음)
  void userRepo.upsertById(user.user_idno, { last_sign: new Date() });

  return user;
}
// #endregion

// #region SDK (하위 호환 export)
// context.ts 등에서 sdk.authenticateRequest(req) 형태로 호출하는 코드와 호환
export const sdk = {
  authenticateRequest,
  signSession,
  verifySession,
};
// #endregion
