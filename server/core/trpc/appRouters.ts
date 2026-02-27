// #region Imports
import { COOKIE_NAME } from "@shared/const";

import { getSessionCookieOptions } from "../cookies";
import { publicProcedure, router } from "./trpc";
import { systemRouter } from "../systemRouter";

// modules routers
import { clientRouter } from "../../modules/crm/client/client.router";
import { saleRouter } from "../../modules/crm/sale/sale.router";
import { scheduleRouter } from "../../modules/crm/schedule/schedule.router";
import { orderRouter } from "../../modules/crm/order/order.router";
import { shipmentRouter } from "../../modules/crm/shipment/shipment.router";
import { dashboardRouter } from "../../modules/crm/dashboard/dashboard.router";
import { fileRouter } from "../../modules/crm/file/file.router";
// #endregion

// #region appRouter (Root)
export const appRouter = router({
  // #region System
  system: systemRouter,
  // #endregion

  // #region Auth (core)
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  // #endregion

  // #region CRM domain
  crm: router({
    clients: clientRouter,
    salesLogs: saleRouter,
    schedule: scheduleRouter,
    order: orderRouter,
    shipment: shipmentRouter,
    dashboard: dashboardRouter,
    files: fileRouter,
  }),
  // #endregion
});

export type AppRouter = typeof appRouter;
// #endregion