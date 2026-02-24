import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";
import { sdk } from "./sdk";
import { getSessionCookieOptions } from "./cookies";
import { upsertUser } from "../db";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Audio upload endpoint for voice recording
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 16 * 1024 * 1024 } });

  // 로컬 오디오 임시 저장 폴더
  const audioUploadDir = path.join(process.cwd(), "uploads", "audio");
  if (!fs.existsSync(audioUploadDir)) fs.mkdirSync(audioUploadDir, { recursive: true });
  app.use("/api/audio-files", express.static(audioUploadDir));

  app.post("/api/upload-audio", upload.single("audio"), async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file" });
      const suffix = Math.random().toString(36).slice(2, 8);
      const key = `audio/${Date.now()}-${suffix}.webm`;

      // Forge 스토리지 시도 → 실패하면 로컬 저장
      try {
        const { url } = await storagePut(key, req.file.buffer, "audio/webm");
        res.json({ url, key });
      } catch {
        const filename = `${Date.now()}-${suffix}.webm`;
        fs.writeFileSync(path.join(audioUploadDir, filename), req.file.buffer);
        const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
        const host = req.headers.host;
        const localUrl = `${proto}://${host}/api/audio-files/${filename}`;
        res.json({ url: localUrl, key: filename });
      }
    } catch (err) {
      console.error("[upload-audio]", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // ─── 개발 전용 로그인 우회 (프로덕션에서는 비활성화) ─────────────────────────
  if (process.env.NODE_ENV !== "production") {
    app.get("/api/dev/login", async (req: any, res: any) => {
      try {
        const devOpenId = "dev-local-user";
        const devName = "개발자 (로컬)";
        await upsertUser({
          openId: devOpenId,
          name: devName,
          email: "dev@localhost",
          loginMethod: "dev",
          lastSignedIn: new Date(),
        });
        const sessionToken = await sdk.createSessionToken(devOpenId, {
          name: devName,
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        res.redirect(302, "/");
      } catch (err) {
        console.error("[dev/login]", err);
        res.status(500).json({ error: "Dev login failed", detail: String(err) });
      }
    });
    console.log("[Dev] 로컬 로그인 활성화: http://localhost:3000/api/dev/login");
  }

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
