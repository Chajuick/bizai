// server/core/index.ts

// #region Imports
import express from "express";
import http from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { ENV } from "./env/env";
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
        console.log(`[server] listening on http://localhost:${port}`);
    });
    // #endregion
}

main().catch((e) => {
    console.error("[server] boot failed", e);
    process.exit(1);
});
// #endregion