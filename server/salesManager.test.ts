import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 9999,
    openId: "test-user-sales",
    email: "test@BizAI.com",
    name: "테스트 사용자",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const { ctx } = createAuthContext();
    const ctxWithCookie: TrpcContext = {
      ...ctx,
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctxWithCookie);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
  });
});

describe("auth.me", () => {
  it("returns authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).not.toBeNull();
    expect(user?.name).toBe("테스트 사용자");
  });

  it("returns null for unauthenticated user", async () => {
    const anonCtx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(anonCtx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});

describe("dashboard.stats", () => {
  it("returns dashboard stats for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.stats();
    expect(stats).toBeDefined();
    expect(typeof stats.logsThisMonth).toBe("number");
    expect(typeof stats.upcomingPromisesCount).toBe("number");
    expect(typeof stats.activeOrdersCount).toBe("number");
    expect(typeof stats.monthlyRevenue).toBe("number");
    expect(Array.isArray(stats.recentLogs)).toBe(true);
    expect(Array.isArray(stats.upcomingPromises)).toBe(true);
  });
});

describe("dashboard.revenueTrend", () => {
  it("returns revenue trend data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const trend = await caller.dashboard.revenueTrend();
    expect(Array.isArray(trend)).toBe(true);
  });
});

describe("clients router", () => {
  it("returns empty list for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const clients = await caller.clients.list({});
    expect(Array.isArray(clients)).toBe(true);
  });
});

describe("salesLogs router", () => {
  it("returns empty list for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const logs = await caller.salesLogs.list({});
    expect(Array.isArray(logs)).toBe(true);
  });
});

describe("promises router", () => {
  it("returns empty list for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const promises = await caller.promises.list(undefined);
    expect(Array.isArray(promises)).toBe(true);
  });
});

describe("orders router", () => {
  it("returns empty list for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const orders = await caller.orders.list(undefined);
    expect(Array.isArray(orders)).toBe(true);
  });
});

describe("deliveries router", () => {
  it("returns empty list for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const deliveries = await caller.deliveries.list(undefined);
    expect(Array.isArray(deliveries)).toBe(true);
  });
});
