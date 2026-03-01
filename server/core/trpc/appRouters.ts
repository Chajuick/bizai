// #region Imports
import { COOKIE_NAME } from "@shared/const";

import { getSessionCookieOptions } from "../cookies";
import { publicProcedure, router } from "./trpc";
import { systemRouter } from "../systemRouter";

// module routers
import { clientRouter } from "../../modules/crm/client/client.router";
import { saleRouter } from "../../modules/crm/sale/sale.router";
import { scheduleRouter } from "../../modules/crm/schedule/schedule.router";
import { orderRouter } from "../../modules/crm/order/order.router";
import { shipmentRouter } from "../../modules/crm/shipment/shipment.router";
import { dashboardRouter } from "../../modules/crm/dashboard/dashboard.router";
import { fileRouter } from "../../modules/crm/file/file.router";
import { companyRouter } from "../../modules/org/company/company.router";
import { billingRouter } from "../../modules/billing/billing.router";
// #endregion

// #region appRouter (Root — single source of truth)
//
// Canonical tree:
//   system   → infrastructure procedures (health, notify, etc.)
//   auth     → session management (me, logout)
//   crm.*    → all CRM domain routers
//
export const appRouter = router({
  // #region System
  system: systemRouter,
  // #endregion

  // #region Company (org-level: membership, invite)
  company: companyRouter,
  // #endregion

  // #region Billing
  billing: billingRouter,
  // #endregion

  // #region Auth
  auth: router({
    /** Returns the authenticated user from the session, or null when logged out. */
    me: publicProcedure.query((opts) => opts.ctx.user),
    /** Clears the session cookie and invalidates the session. */
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  // #endregion

  // #region CRM
  crm: router({
    client: clientRouter,
    sale: saleRouter,
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
