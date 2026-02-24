import { protectedProcedure, router } from "../_core/trpc";
import { getDashboardStats, getRevenueTrend } from "../db";

export const dashboardRouter = router({
  stats: protectedProcedure.query(({ ctx }) => getDashboardStats(ctx.user.id)),
  revenueTrend: protectedProcedure.query(({ ctx }) => getRevenueTrend(ctx.user.id)),
});
