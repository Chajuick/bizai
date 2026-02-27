// server/modules/crm/dashboard/dashboard.service.ts

// #region Imports
import type { ServiceCtx } from "../../../core/serviceCtx";
import { getDb } from "../../../core/db";

import { dashboardRepo } from "./dashboard.repo";
// #endregion

// #region Helpers
function monthsBackStart(now: Date, monthsBack: number) {
  // 예: 5 => 최근 6개월(현재 포함) 시작 월의 1일 00:00
  const d = new Date(now);
  d.setMonth(d.getMonth() - monthsBack);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthLabelsLast6(now: Date) {
  const labels: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    labels.push(`${y}-${m}`);
  }
  return labels;
}
// #endregion

export const dashboardService = {
  // #region getStats
  async getStats(ctx: ServiceCtx) {
    const db = getDb();
    const now = new Date();

    const [aggs, recentSales, upcomingSchedules] = await Promise.all([
      dashboardRepo.statsAggregates({ db }, { comp_idno: ctx.comp_idno, now }),
      dashboardRepo.recentSales({ db }, { comp_idno: ctx.comp_idno, limit: 5 }),
      dashboardRepo.upcomingSchedules({ db }, { comp_idno: ctx.comp_idno, now, limit: 5 }),
    ]);

    return {
      ...aggs,
      recentSales,
      upcomingSchedules,
    };
  },
  // #endregion

  // #region getRevenueTrend
  async getRevenueTrend(ctx: ServiceCtx) {
    const db = getDb();
    const now = new Date();

    const from = monthsBackStart(now, 5); // 최근 6개월(현재 포함)
    const months = monthLabelsLast6(now);

    const { orderRows, revenueRows } = await dashboardRepo.revenueTrend({ db }, { comp_idno: ctx.comp_idno, from });

    const orderMap = new Map(orderRows.map((r) => [r.ym, Number(r.total)]));
    const revenueMap = new Map(revenueRows.map((r) => [r.ym, Number(r.total)]));

    return months.map((ym) => ({
      month: ym.slice(5) + "월",
      order: orderMap.get(ym) ?? 0,
      revenue: revenueMap.get(ym) ?? 0,
    }));
  },
  // #endregion
} as const;