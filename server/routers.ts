import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { clientsRouter } from "./routers/clients";
import { salesLogsRouter } from "./routers/salesLogs";
import { promisesRouter } from "./routers/promises";
import { ordersRouter } from "./routers/orders";
import { deliveriesRouter } from "./routers/deliveries";
import { dashboardRouter } from "./routers/dashboard";
import { uploadRouter } from "./routers/upload";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  clients: clientsRouter,
  salesLogs: salesLogsRouter,
  promises: promisesRouter,
  orders: ordersRouter,
  deliveries: deliveriesRouter,
  dashboard: dashboardRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;
