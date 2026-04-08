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

  // #region getCalendarEvents
  async getCalendarEvents(ctx: ServiceCtx, input: { year: number; month: number }) {
    const db = getDb();
    const { year, month } = input;
    const from = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const to   = new Date(year, month,     1, 0, 0, 0, 0);

    const { sales, schedules, orders, shipments, expenses } =
      await dashboardRepo.calendarEvents({ db }, { comp_idno: ctx.comp_idno, from, to });

    type CalEv = {
      type: "sale" | "schedule" | "order" | "shipment" | "expense";
      id: number; date: Date; title: string;
      amount?: number; stat?: string | null; clie_name?: string | null;
    };

    const events: CalEv[] = [
      ...sales.map(s => ({
        type: "sale" as const, id: s.sale_idno, date: s.vist_date!,
        title: (s.aiex_summ ?? String(s.orig_memo ?? "").slice(0, 40)) || "영업일지",
        clie_name: s.clie_name,
      })),
      ...schedules.map(s => ({
        type: "schedule" as const, id: s.sche_idno, date: s.sche_date,
        title: s.sche_name, stat: s.sche_stat,
        amount: s.sche_pric ? Number(s.sche_pric) : undefined,
        clie_name: s.clie_name,
      })),
      ...orders.map(o => ({
        type: "order" as const, id: o.orde_idno,
        date: o.ctrt_date ?? o.crea_date!,
        title: o.prod_serv, stat: o.orde_stat,
        amount: Number(o.orde_pric), clie_name: o.clie_name,
      })),
      ...shipments.map(s => ({
        type: "shipment" as const, id: s.ship_idno,
        date: s.ship_date ?? s.crea_date!,
        title: `납품 · ${s.clie_name ?? ""}`.trim(),
        stat: s.ship_stat, amount: Number(s.ship_pric), clie_name: s.clie_name,
      })),
      ...expenses.map(e => ({
        type: "expense" as const, id: e.expe_idno, date: e.expe_date,
        title: e.expe_name, amount: Number(e.expe_amnt), clie_name: e.clie_name,
      })),
    ];

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  },
  // #endregion

  // #region getRevenueTrend
  async getRevenueTrend(ctx: ServiceCtx) {
    const db = getDb();
    const now = new Date();

    const from = monthsBackStart(now, 5); // 최근 6개월(현재 포함)
    const months = monthLabelsLast6(now);

    const { revenueRows, purchaseRows } = await dashboardRepo.revenueTrend({ db }, { comp_idno: ctx.comp_idno, from });

    const revenueMap = new Map(revenueRows.map((r) => [r.ym, Number(r.total)]));
    const purchaseMap = new Map(purchaseRows.map((r) => [r.ym, Number(r.total)]));

    return months.map((ym) => ({
      month: ym.slice(5) + "월",
      revenue: revenueMap.get(ym) ?? 0,
      purchase: purchaseMap.get(ym) ?? 0,
    }));
  },
  // #endregion
} as const;