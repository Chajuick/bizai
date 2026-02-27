import { describe, expect, it } from "vitest";
import { appRouter } from "./core/trpc/appRouters";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./core/trpc/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    user_idno: 1,
    open_idno: "sample-user",
    user_name: "Sample User",
    mail_idno: "sample@example.com",
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
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
});
