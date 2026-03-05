// server/modules/crm/dashboard/dashboard.dto.ts

// #region Imports
import { z } from "zod";
import { IsoDateTime } from "../shared/dto";
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

  // 최근 영업일지 (클라이언트 표시용 최소 필드)
  recentSales: z.array(z.object({
    sale_idno: z.number().int(),
    clie_name: z.string().nullable(),
    orig_memo: z.string(),
    vist_date: IsoDateTime,
  })),

  // 예정 일정 (클라이언트 표시용 최소 필드)
  upcomingSchedules: z.array(z.object({
    sche_idno: z.number().int(),
    sche_name: z.string(),
    sche_date: IsoDateTime,
    clie_name: z.string().nullable(),
  })),
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