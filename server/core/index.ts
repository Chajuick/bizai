// server/core/index.ts

// #region Imports
import crypto from "crypto";
import express from "express";
import http from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { ENV } from "./env/env";
import { logger } from "./logger";
import { appRouter } from "./trpc/appRouters";
import { createContext } from "./trpc/context";
import { registerOAuthRoutes } from "./oauth";
import { serveStatic, setupVite } from "./vite";
// #endregion

// #region Boot
async function main() {
    // #region App
    const app = express();
    app.disable("x-powered-by");

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
    const port = Number(process.env.PORT ?? 3000);
    server.listen(port, () => {
        logger.info({ port }, "server listening");
    });
    // #endregion
}

main().catch((e) => {
    logger.fatal({ err: e }, "server boot failed");
    process.exit(1);
});
// #endregion