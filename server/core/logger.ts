// server/core/logger.ts

// #region Imports
import pino from "pino";
import type { Request } from "express";
// #endregion

// #region Safe req serializer
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
const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "headers.authorization",
  "headers.cookie",
  "err.headers.authorization",
  "err.headers.cookie",
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

  const pretty =
    process.env.PRETTY_LOG === "true" ||
    process.env.NODE_ENV === "development";

  return pino({

    level,

    serializers: {
      err: pino.stdSerializers.err
    },

    ...(pretty
      ? {
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:HH:MM:ss",
              ignore: "pid,hostname"
            },
          },
        }
      : {}),

    redact: {
      paths: REDACT_PATHS,
      censor: "[REDACTED]",
    },

    base: {
      env: process.env.NODE_ENV ?? "development",
    },
  });
}
// #endregion

// #region Singleton
export const logger = createLogger();
// #endregion