// server/core/oauth.ts
// Auth routes: Google OAuth 2.0 + 이메일/비밀번호 자체 인증

// #region Imports
import { randomBytes } from "crypto";
import { COOKIE_NAME, SEVEN_DAYS_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { parse as parseCookies } from "cookie";
import rateLimit from "express-rate-limit";
import { z } from "zod/v4";

import { getSessionCookieOptions } from "./cookies";
import { signSession } from "./sdk";
import { userRepo } from "./auth/user.repo";
import { bootstrapService } from "../modules/org/bootstrap/bootstrap.service";
import { ENV } from "./env/env";
import { logger } from "./logger";
// #endregion

// #region Rate Limiters
/**
 * 로그인: IP당 15분에 10회
 * - 브루트포스 공격 방어
 * - 실패 시 429 + Retry-After 헤더
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

/**
 * 회원가입: IP당 1시간에 5회
 * - 계정 스팸 방지
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Please try again later." },
});

/**
 * Google OAuth 시작: IP당 15분에 20회
 * - 리다이렉트 남용 방지
 */
const googleOAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many OAuth requests. Please try again later." },
});
// #endregion

// #region Helpers
function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function setSessionCookie(res: Response, req: Request, token: string): void {
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SEVEN_DAYS_MS });
}
// #endregion

// #region OAuth State (CSRF protection)
const OAUTH_STATE_COOKIE = "oauth_state";
const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10분

function generateState(): string {
  return randomBytes(32).toString("hex");
}

/**
 * state 쿠키 설정
 * - sameSite: "lax" — Google 리다이렉트(top-level GET)에서 전송됨
 * - path를 callback으로 제한 → 다른 경로에서 노출 최소화
 */
function setStateCookie(res: Response, req: Request, state: string): void {
  const base = getSessionCookieOptions(req);
  res.cookie(OAUTH_STATE_COOKIE, state, {
    ...base,
    sameSite: "lax",
    path: "/api/auth/google/callback",
    maxAge: OAUTH_STATE_MAX_AGE_MS,
  });
}

function clearStateCookie(res: Response, req: Request): void {
  const base = getSessionCookieOptions(req);
  res.clearCookie(OAUTH_STATE_COOKIE, {
    ...base,
    sameSite: "lax",
    path: "/api/auth/google/callback",
  });
}

function getStateCookieValue(req: Request): string | undefined {
  const cookies = parseCookies(req.headers.cookie ?? "");
  return cookies[OAUTH_STATE_COOKIE];
}
// #endregion

// #region Google OAuth helpers
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: ENV.googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state, // CSRF 방어
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

function buildRedirectUri(req: Request): string {
  const protocol = req.protocol;
  const host = req.get("host") ?? "localhost:3000";
  return `${protocol}://${host}/api/auth/google/callback`;
}

type GoogleTokenResponse = {
  access_token: string;
  id_token?: string;
};

type GoogleUserInfo = {
  id: string;
  email: string;
  name: string | null;
  picture?: string;
};

async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google token exchange failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<GoogleTokenResponse>;
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Google user info: ${res.status}`);
  }

  return res.json() as Promise<GoogleUserInfo>;
}
// #endregion

// #region Validation schemas
const RegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
// #endregion

// #region Routes
export function registerOAuthRoutes(app: Express) {
  // #region Google OAuth — initiate
  app.get("/api/auth/google", googleOAuthLimiter, (req: Request, res: Response) => {
    if (!ENV.googleClientId || !ENV.googleClientSecret) {
      res.status(503).json({ error: "Google OAuth is not configured" });
      return;
    }
    const state = generateState();
    const redirectUri = buildRedirectUri(req);
    setStateCookie(res, req, state);
    res.redirect(302, buildGoogleAuthUrl(redirectUri, state));
  });
  // #endregion

  // #region Google OAuth — callback
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const stateFromQuery = getQueryParam(req, "state");
    const stateFromCookie = getStateCookieValue(req);

    // CSRF 검증: state가 없거나 일치하지 않으면 즉시 거부
    if (!stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
      clearStateCookie(res, req);
      res.status(400).json({ error: "Invalid OAuth state. Possible CSRF attack." });
      return;
    }

    // state 검증 완료 → 쿠키 즉시 삭제 (재사용 방지)
    clearStateCookie(res, req);

    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    try {
      const redirectUri = buildRedirectUri(req);
      const tokens = await exchangeGoogleCode(code, redirectUri);
      const googleUser = await fetchGoogleUserInfo(tokens.access_token);

      if (!googleUser.id || !googleUser.email) {
        res.status(400).json({ error: "Invalid Google user info" });
        return;
      }

      await userRepo.upsertByOAuth({
        open_idno: googleUser.id,
        user_name: googleUser.name ?? null,
        mail_idno: googleUser.email,
        logi_mthd: "google",
      });

      const user = await userRepo.findByOpenId(googleUser.id);
      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      // 워크스페이스 자동 생성 (멱등)
      await bootstrapService.bootstrapForUser({
        user_idno: user.user_idno,
        user_name: user.user_name ?? null,
        mail_idno: user.mail_idno ?? null,
      });

      const sessionToken = await signSession(
        { userId: user.user_idno, name: user.user_name ?? "" },
        { expiresInMs: SEVEN_DAYS_MS }
      );

      setSessionCookie(res, req, sessionToken);
      res.redirect(302, "/");
    } catch (error) {
      logger.error({ err: error, requestId: req.__requestId }, "auth: google callback failed");
      res.status(500).json({ error: "Google OAuth callback failed" });
    }
  });
  // #endregion

  // #region Email/Password — register
  app.post("/api/auth/register", registerLimiter, async (req: Request, res: Response) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
      return;
    }

    const { email, password, name } = parsed.data;

    try {
      // 중복 이메일 확인
      const existing = await userRepo.findByEmail(email);
      if (existing) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }

      const passwd_hash = await bcrypt.hash(password, 12);

      await userRepo.createByEmail({
        open_idno: email,
        user_name: name ?? null,
        mail_idno: email,
        passwd_hash,
        logi_mthd: "email",
      });

      const user = await userRepo.findByEmail(email);
      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      // 워크스페이스 자동 생성 (멱등)
      await bootstrapService.bootstrapForUser({
        user_idno: user.user_idno,
        user_name: user.user_name ?? null,
        mail_idno: user.mail_idno ?? null,
      });

      const sessionToken = await signSession(
        { userId: user.user_idno, name: user.user_name ?? "" },
        { expiresInMs: SEVEN_DAYS_MS }
      );

      setSessionCookie(res, req, sessionToken);
      res.json({ success: true });
    } catch (error) {
      logger.error({ err: error, requestId: req.__requestId }, "auth: register failed");
      res.status(500).json({ error: "Registration failed" });
    }
  });
  // #endregion

  // #region Email/Password — login
  app.post("/api/auth/login", loginLimiter, async (req: Request, res: Response) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const { email, password } = parsed.data;

    try {
      const user = await userRepo.findByEmail(email);
      if (!user || !user.passwd_hash) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwd_hash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      await userRepo.upsertById(user.user_idno, { last_sign: new Date() });

      // 워크스페이스 자동 생성 (멱등 — 기존 유저 로그인 시에도 회사 없으면 생성)
      await bootstrapService.bootstrapForUser({
        user_idno: user.user_idno,
        user_name: user.user_name ?? null,
        mail_idno: user.mail_idno ?? null,
      });

      const sessionToken = await signSession(
        { userId: user.user_idno, name: user.user_name ?? "" },
        { expiresInMs: SEVEN_DAYS_MS }
      );

      setSessionCookie(res, req, sessionToken);
      res.json({ success: true });
    } catch (error) {
      logger.error({ err: error, requestId: req.__requestId }, "auth: login failed");
      res.status(500).json({ error: "Login failed" });
    }
  });
  // #endregion

  // #region Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions });
    res.json({ success: true });
  });
  // #endregion
}
// #endregion
