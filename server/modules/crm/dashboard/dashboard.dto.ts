// server/modules/crm/dashboard/dashboard.dto.ts

// #region Imports
import { z } from "zod";
// #endregion

// #region Outputs
export const DashboardStatsOutput = z.object({
  logsThisMonth: z.number().int().nonnegative(),

  upcomingSchedulesCount: z.number().int().nonnegative(),

  activeOrdersCount: z.number().int().nonnegative(),
  activeOrdersTotal: z.number().nonnegative(),

  monthlyRevenue: z.number().nonnegative(),

  overdueCount: z.number().int().nonnegative(),
  imminentCount: z.number().int().nonnegative(),

  recentSales: z.array(z.any()),
  upcomingSchedules: z.array(z.any()),
});

export type DashboardStatsOutput = z.infer<typeof DashboardStatsOutput>;

export const RevenueTrendItemOutput = z.object({
  month: z.string(), // "MM월"
  order: z.number().nonnegative(), // 수주 합계(확정/진행 포함, 취소 제외)
  revenue: z.number().nonnegative(), // 수금 합계(paid_date 기준)
});

export const RevenueTrendOutput = z.array(RevenueTrendItemOutput);
export type RevenueTrendOutput = z.infer<typeof RevenueTrendOutput>;
// #endregion