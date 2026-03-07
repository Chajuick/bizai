// server/core/index.ts

// #region Imports
import crypto from "crypto";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { ENV } from "./env/env";
import { logger } from "./logger";
import { appRouter } from "./trpc/appRouters";
import { createContext } from "./trpc/context";
import { registerOAuthRoutes } from "./oauth";
import { serveStatic, setupVite } from "./vite";
import { runBillingSweepJobs, runStaleJobRecovery, runOrphanFileCleanup, runAiJobWorker } from "../jobs/billing.jobs";
// #endregion

// #region Boot
async function main() {
    // #region App
    const app = express();
    app.disable("x-powered-by");

    // #region Security Headers (Helmet)
    // 개발 환경: Vite HMR websocket/inline script 충돌 방지로 CSP 비활성화
    // 프로덕션: 전체 보안 헤더 적용
    if (ENV.isProduction) {
        app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    connectSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "blob:"],
                    styleSrc: ["'self'", "'unsafe-inline'"],  // shadcn/ui inline style
                },
            },
            hsts: { maxAge: 31536000, includeSubDomains: true },
        }));
    } else {
        // 개발: CSP 제외, 나머지 보안 헤더만 적용
        app.use(helmet({ contentSecurityPolicy: false }));
    }
    // #endregion

    // #region CORS
    // 프로덕션: CLIENT_URL 기준 엄격한 origin 제한
    // 개발: 동일 Express에서 Vite HMR 서빙이므로 사실상 same-origin; 브라우저 확장 등 대비해 열어둠
    const corsOptions: cors.CorsOptions = {
        origin: ENV.isProduction
            ? (ENV.clientUrl || false)  // CLIENT_URL 미설정 시 cross-origin 완전 차단
            : true,                      // 개발: 모든 origin 허용
        credentials: true,               // 쿠키(JWT 세션) 전송 허용
        methods: ["GET", "POST", "OPTIONS"],
    };
    app.use(cors(corsOptions));
    // #endregion

    // requestId 미들웨어 — 모든 요청에 UUID 주입 (로그 correlation)
    app.use((req, _res, next) => {
        req.__requestId = crypto.randomUUID();
        next();
    });

    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true }));
    // #endregion

    // #region HTTP Server
    const server = http.createServer(app);
    // #endregion

    // #region OAuth Routes (Express)
    registerOAuthRoutes(app);
    // #endregion

    // #region AI Rate Limiting (SEC-5)
    // AI 분석 엔드포인트: 토큰 소진 공격 방지 — 회사(x-comp-id) 기준 분당 10회
    const aiRateLimiter = rateLimit({
        windowMs: 60 * 1000,
        limit: 10,
        keyGenerator: (req) => {
            const compId = req.headers["x-comp-id"];
            return (typeof compId === "string" && compId) ? `comp:${compId}` : (req.ip ?? "unknown");
        },
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: "AI 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
    });
    app.use("/api/trpc/crm.sale.analyze", aiRateLimiter);
    app.use("/api/trpc/crm.sale.transcribe", aiRateLimiter);
    app.use("/api/trpc/crm.files.transcribeFile", aiRateLimiter);
    // #endregion

    // #region tRPC
    app.use(
        "/api/trpc",
        createExpressMiddleware({
            router: appRouter,
            createContext,
        })
    );
    // #endregion

    // #region Front (dev/prod)
    if (!ENV.isProduction) {
        await setupVite(app, server);
    } else {
        serveStatic(app);
    }
    // #endregion

    // #region Listen
    const port = ENV.port;
    server.listen(port, () => {
        logger.info({ port }, "server listening");
    });
    // #endregion

    // #region Background Jobs
    setInterval(runBillingSweepJobs, 10 * 60 * 1000);   // 10분마다: 만료 구독 free 전환
    setInterval(runStaleJobRecovery, 5 * 60 * 1000);     // 5분마다: stale AI job 복구
    setInterval(runOrphanFileCleanup, 60 * 60 * 1000);  // 1시간마다: 고아 파일 정리
    setInterval(runAiJobWorker, 5_000);                   //  5초마다: AI 분석 큐 워커
    // #endregion
}

main().catch((e) => {
    logger.fatal({ err: e }, "server boot failed");
    process.exit(1);
});
// #endregion