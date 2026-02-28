// server/core/logger.ts
// Pino 운영 로거 싱글톤
//
// 사용법:
//   import { logger } from "../core/logger";
//   logger.info({ requestId, userId }, "user signed in");
//
// 로컬 개발:  LOG_LEVEL=debug, pino-pretty로 포맷 (PRETTY_LOG=true)
// 운영:       JSON 출력, LOG_LEVEL=info (기본값)
//
// ⚠️  로그에 req 객체를 통째로 넣지 말 것.
//     반드시 logger.serializeReq(req) 또는 필요한 필드만 명시적으로 추출해서 전달.
//     예) logger.info({ requestId: req.__requestId, method: req.method }, "...")

// #region Imports
import pino from "pino";
import type { Request } from "express";
// #endregion

// #region Safe req serializer
/**
 * serializeReq
 * - Express req에서 로깅에 안전한 필드만 추출
 * - cookie/authorization 등 민감 헤더는 포함하지 않음
 */
export function serializeReq(req: Request) {
  return {
    requestId: req.__requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };
}
// #endregion

// #region Redact paths
// pino redact는 로그 호출 시 전달된 객체의 "정확한 경로"에만 적용됨.
// 구조가 다르면 미매칭 → 아래처럼 가능한 모든 위치를 열거해야 함.
const REDACT_PATHS = [
  // { req: expressReq } 형태
  "req.headers.authorization",
  "req.headers.cookie",
  // { headers: req.headers } 형태
  "headers.authorization",
  "headers.cookie",
  // { err: { headers: ... } } 형태 (1단계 중첩)
  "err.headers.authorization",
  "err.headers.cookie",
  // DB/도메인 객체 민감 필드
  "*.passwd_hash",
  "*.password",
  "*.secret",
  "*.accessToken",
  "*.refreshToken",
];
// #endregion

// #region Factory
function createLogger() {
  const level = process.env.LOG_LEVEL ?? "info";
  const pretty = process.env.PRETTY_LOG === "true" || process.env.NODE_ENV === "development";

  return pino({
    level,
    ...(pretty
      ? {
          transport: {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
          },
        }
      : {}),
    redact: {
      paths: REDACT_PATHS,
      censor: "[REDACTED]",
    },
    base: { env: process.env.NODE_ENV ?? "development" },
  });
}
// #endregion

// #region Singleton
export const logger = createLogger();
// #endregion
