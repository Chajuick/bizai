import { describe, expect, it } from "vitest";
import { appRouter } from "./core/trpc/appRouters";
import type { TrpcContext } from "./core/trpc/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    user_idno: 9999,
    open_idno: "test-user-sales",
    user_name: "테스트 사용자",
    mail_idno: "test@BizAI.com",
    passwd_hash: null,
    logi_mthd: "email",
    user_auth: "user",
    last_sign: new Date(),
    crea_date: new Date(),
    modi_date: null,
    role: "user",
  };

  const ctx: TrpcContext = {
    user,
    comp_idno: null,
    company_role: null,
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
    expect(user?.user_name).toBe("테스트 사용자");
  });

  it("returns null for unauthenticated user", async () => {
    const anonCtx: TrpcContext = {
      user: null,
      comp_idno: null,
      company_role: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(anonCtx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});
