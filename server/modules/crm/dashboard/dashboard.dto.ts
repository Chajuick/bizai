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
  totalInvoiced: z.number().nonnegative(),

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
  month: z.string(),    // "MM월"
  revenue: z.number().nonnegative(), // 매출: 수금 완료(paid_date 기준)
  purchase: z.number().nonnegative(), // 매입: 지출 합계(expe_date 기준)
});

export const RevenueTrendOutput = z.array(RevenueTrendItemOutput);
export type RevenueTrendOutput = z.infer<typeof RevenueTrendOutput>;

// #region CalendarEvents
export const CalendarInput = z.object({
  year:  z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

export const CalendarEventOutput = z.object({
  type:      z.enum(["sale", "schedule", "order", "shipment", "expense"]),
  id:        z.number().int(),
  date:      IsoDateTime,
  title:     z.string(),
  amount:    z.number().optional(),
  stat:      z.string().nullable().optional(),
  clie_name: z.string().nullable().optional(),
});

export const CalendarEventsOutput = z.array(CalendarEventOutput);
export type CalendarEvent = z.infer<typeof CalendarEventOutput>;
// #endregion

// #endregion