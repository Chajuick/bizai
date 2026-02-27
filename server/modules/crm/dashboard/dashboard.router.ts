// server/modules/crm/dashboard/dashboard.router.ts

// #region Imports
import { protectedProcedure, router } from "../../../core/trpc";
import { svcCtxFromTrpc } from "../../../core/svcCtx";

import { DashboardStatsOutput, RevenueTrendOutput } from "./dashboard.dto";
import { dashboardService } from "./dashboard.service";
// #endregion

// #region Router
export const dashboardRouter = router({
  // #region stats
  stats: protectedProcedure
    .output(DashboardStatsOutput)
    .query(({ ctx }) => dashboardService.getStats(svcCtxFromTrpc(ctx))),
  // #endregion

  // #region revenueTrend
  revenueTrend: protectedProcedure
    .output(RevenueTrendOutput)
    .query(({ ctx }) => dashboardService.getRevenueTrend(svcCtxFromTrpc(ctx))),
  // #endregion
});
// #endregion