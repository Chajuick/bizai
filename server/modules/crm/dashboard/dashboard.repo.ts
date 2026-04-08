// server/modules/crm/dashboard/dashboard.repo.ts

// #region Imports
import { and, desc, eq, gte, lte, lt, sql } from "drizzle-orm";

import {
  CRM_SALE,
  CRM_SCHEDULE,
  CRM_ORDER,
  CRM_SHIPMENT,
  CRM_EXPENSE,
} from "../../../../drizzle/schema";
import type { DbOrTx } from "../../../core/db/tx";
// #endregion

// #region Types
type RepoDeps = { db: DbOrTx };
// #endregion

// #region Date Helpers
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date) {
  // 다음달 1일 - 1ms
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}

/**
 * KST 오늘 자정 (서버가 UTC로 돌더라도 KST 기준 overdue 계산)
 * - "오늘 00:00 KST 이전"인 scheduled를 overdue로 집계하기 위함
 */
function kstTodayMidnight(now: Date) {
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const kst = new Date(now.getTime() + KST_OFFSET_MS);

  // YYYY-MM-DD
  const yyyy = kst.getUTCFullYear();
  const mm = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(kst.getUTCDate()).padStart(2, "0");

  // KST midnight를 UTC 시간으로 환산해서 Date 생성
  // "KST 00:00" = "UTC -9h"
  const utcMidnight = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
  return new Date(utcMidnight.getTime() - KST_OFFSET_MS);
}
// #endregion

export const dashboardRepo = {
  // #region statsAggregates
  async statsAggregates(
    { db }: RepoDeps,
    params: { comp_idno: number; now: Date }
  ) {
    const now = params.now;

    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const kstMidnight = kstTodayMidnight(now);
    const twelveHoursLater = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    const [
      [logsCount],
      [upcomingSchedules],
      [activeOrders],
      [monthlyRevenue],
      [overdueSchedules],
      [imminentSchedules],
      [invoicedShipments],
    ] = await Promise.all([
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(CRM_SALE)
        .where(
          and(
            eq(CRM_SALE.comp_idno, params.comp_idno),
            eq(CRM_SALE.enab_yesn, true),
            gte(CRM_SALE.vist_date, monthStart),
            lt(CRM_SALE.vist_date, monthEnd)
          )
        ),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(CRM_SCHEDULE)
        .where(
          and(
            eq(CRM_SCHEDULE.comp_idno, params.comp_idno),
            eq(CRM_SCHEDULE.enab_yesn, true),
            eq(CRM_SCHEDULE.sche_stat, "scheduled"),
            gte(CRM_SCHEDULE.sche_date, now)
          )
        ),
      db
        .select({
          count: sql<number>`COUNT(*)`,
          total: sql<string>`COALESCE(SUM(${CRM_ORDER.orde_pric}), 0)`,
        })
        .from(CRM_ORDER)
        .where(
          and(
            eq(CRM_ORDER.comp_idno, params.comp_idno),
            eq(CRM_ORDER.enab_yesn, true),
            sql`${CRM_ORDER.orde_stat} IN ('proposal','negotiation','confirmed')`
          )
        ),
      //  월 매출 = 수금(paid) + paid_date 기준
      db
        .select({
          total: sql<string>`COALESCE(SUM(${CRM_SHIPMENT.ship_pric}), 0)`,
        })
        .from(CRM_SHIPMENT)
        .where(
          and(
            eq(CRM_SHIPMENT.comp_idno, params.comp_idno),
            eq(CRM_SHIPMENT.enab_yesn, true),
            eq(CRM_SHIPMENT.ship_stat, "paid"),
            gte(CRM_SHIPMENT.paid_date, monthStart),
            lt(CRM_SHIPMENT.paid_date, monthEnd)
          )
        ),
      // overdue: KST 오늘 자정 이전의 scheduled
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(CRM_SCHEDULE)
        .where(
          and(
            eq(CRM_SCHEDULE.comp_idno, params.comp_idno),
            eq(CRM_SCHEDULE.enab_yesn, true),
            eq(CRM_SCHEDULE.sche_stat, "scheduled"),
            lt(CRM_SCHEDULE.sche_date, kstMidnight)
          )
        ),
      // imminent: 12시간 이내
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(CRM_SCHEDULE)
        .where(
          and(
            eq(CRM_SCHEDULE.comp_idno, params.comp_idno),
            eq(CRM_SCHEDULE.enab_yesn, true),
            eq(CRM_SCHEDULE.sche_stat, "scheduled"),
            gte(CRM_SCHEDULE.sche_date, now),
            lte(CRM_SCHEDULE.sche_date, twelveHoursLater)
          )
        ),
      // 청구 미수금: invoiced 상태 납품 합계
      db
        .select({
          total: sql<string>`COALESCE(SUM(${CRM_SHIPMENT.ship_pric}), 0)`,
        })
        .from(CRM_SHIPMENT)
        .where(
          and(
            eq(CRM_SHIPMENT.comp_idno, params.comp_idno),
            eq(CRM_SHIPMENT.enab_yesn, true),
            eq(CRM_SHIPMENT.ship_stat, "invoiced")
          )
        ),
    ]);

    return {
      logsThisMonth: Number(logsCount?.count ?? 0),
      upcomingSchedulesCount: Number(upcomingSchedules?.count ?? 0),

      activeOrdersCount: Number(activeOrders?.count ?? 0),
      activeOrdersTotal: Number(activeOrders?.total ?? 0),

      monthlyRevenue: Number(monthlyRevenue?.total ?? 0),
      totalInvoiced: Number(invoicedShipments?.total ?? 0),

      overdueCount: Number(overdueSchedules?.count ?? 0),
      imminentCount: Number(imminentSchedules?.count ?? 0),
    };
  },
  // #endregion

  // #region recentSales
  async recentSales({ db }: RepoDeps, params: { comp_idno: number; limit: number }) {
    return db
      .select()
      .from(CRM_SALE)
      .where(and(eq(CRM_SALE.comp_idno, params.comp_idno), eq(CRM_SALE.enab_yesn, true)))
      .orderBy(desc(CRM_SALE.vist_date))
      .limit(params.limit);
  },
  // #endregion

  // #region upcomingSchedules
  async upcomingSchedules({ db }: RepoDeps, params: { comp_idno: number; now: Date; limit: number }) {
    return db
      .select()
      .from(CRM_SCHEDULE)
      .where(
        and(
          eq(CRM_SCHEDULE.comp_idno, params.comp_idno),
          eq(CRM_SCHEDULE.enab_yesn, true),
          eq(CRM_SCHEDULE.sche_stat, "scheduled"),
          gte(CRM_SCHEDULE.sche_date, params.now)
        )
      )
      .orderBy(CRM_SCHEDULE.sche_date)
      .limit(params.limit);
  },
  // #endregion

  // #region calendarEvents
  async calendarEvents(
    { db }: RepoDeps,
    params: { comp_idno: number; from: Date; to: Date }
  ) {
    const { comp_idno, from, to } = params;

    const [sales, schedules, orders, shipments, expenses] = await Promise.all([
      db.select({
        sale_idno: CRM_SALE.sale_idno,
        vist_date: CRM_SALE.vist_date,
        clie_name: CRM_SALE.clie_name,
        aiex_summ: CRM_SALE.aiex_summ,
        orig_memo: CRM_SALE.orig_memo,
      }).from(CRM_SALE).where(
        and(eq(CRM_SALE.comp_idno, comp_idno), eq(CRM_SALE.enab_yesn, true),
          gte(CRM_SALE.vist_date, from), lt(CRM_SALE.vist_date, to))
      ),
      db.select({
        sche_idno: CRM_SCHEDULE.sche_idno,
        sche_date: CRM_SCHEDULE.sche_date,
        sche_name: CRM_SCHEDULE.sche_name,
        sche_stat: CRM_SCHEDULE.sche_stat,
        clie_name: CRM_SCHEDULE.clie_name,
        sche_pric: CRM_SCHEDULE.sche_pric,
      }).from(CRM_SCHEDULE).where(
        and(eq(CRM_SCHEDULE.comp_idno, comp_idno), eq(CRM_SCHEDULE.enab_yesn, true),
          gte(CRM_SCHEDULE.sche_date, from), lt(CRM_SCHEDULE.sche_date, to))
      ),
      db.select({
        orde_idno: CRM_ORDER.orde_idno,
        ctrt_date: CRM_ORDER.ctrt_date,
        crea_date: CRM_ORDER.crea_date,
        prod_serv: CRM_ORDER.prod_serv,
        orde_stat: CRM_ORDER.orde_stat,
        orde_pric: CRM_ORDER.orde_pric,
        clie_name: CRM_ORDER.clie_name,
      }).from(CRM_ORDER).where(
        and(eq(CRM_ORDER.comp_idno, comp_idno), eq(CRM_ORDER.enab_yesn, true),
          sql`${CRM_ORDER.orde_stat} != 'canceled'`,
          gte(sql`COALESCE(${CRM_ORDER.ctrt_date}, ${CRM_ORDER.crea_date})`, from),
          lt(sql`COALESCE(${CRM_ORDER.ctrt_date}, ${CRM_ORDER.crea_date})`, to))
      ),
      db.select({
        ship_idno: CRM_SHIPMENT.ship_idno,
        ship_date: CRM_SHIPMENT.ship_date,
        crea_date: CRM_SHIPMENT.crea_date,
        ship_stat: CRM_SHIPMENT.ship_stat,
        ship_pric: CRM_SHIPMENT.ship_pric,
        clie_name: CRM_SHIPMENT.clie_name,
      }).from(CRM_SHIPMENT).where(
        and(eq(CRM_SHIPMENT.comp_idno, comp_idno), eq(CRM_SHIPMENT.enab_yesn, true),
          gte(sql`COALESCE(${CRM_SHIPMENT.ship_date}, ${CRM_SHIPMENT.crea_date})`, from),
          lt(sql`COALESCE(${CRM_SHIPMENT.ship_date}, ${CRM_SHIPMENT.crea_date})`, to))
      ),
      db.select({
        expe_idno: CRM_EXPENSE.expe_idno,
        expe_date: CRM_EXPENSE.expe_date,
        expe_name: CRM_EXPENSE.expe_name,
        expe_amnt: CRM_EXPENSE.expe_amnt,
        clie_name: CRM_EXPENSE.clie_name,
      }).from(CRM_EXPENSE).where(
        and(eq(CRM_EXPENSE.comp_idno, comp_idno), eq(CRM_EXPENSE.enab_yesn, true),
          gte(CRM_EXPENSE.expe_date, from), lt(CRM_EXPENSE.expe_date, to))
      ),
    ]);

    return { sales, schedules, orders, shipments, expenses };
  },
  // #endregion

  // #region revenueTrend
  async revenueTrend({ db }: RepoDeps, params: { comp_idno: number; from: Date }) {
    const [revenueRows, purchaseRows] = await Promise.all([
      // 매출: 수금 완료(paid) 기준, paid_date 월 집계
      db
        .select({
          ym: sql<string>`DATE_FORMAT(${CRM_SHIPMENT.paid_date}, '%Y-%m')`,
          total: sql<string>`COALESCE(SUM(${CRM_SHIPMENT.ship_pric}), 0)`,
        })
        .from(CRM_SHIPMENT)
        .where(
          and(
            eq(CRM_SHIPMENT.comp_idno, params.comp_idno),
            eq(CRM_SHIPMENT.enab_yesn, true),
            eq(CRM_SHIPMENT.ship_stat, "paid"),
            gte(CRM_SHIPMENT.paid_date, params.from)
          )
        )
        .groupBy(sql`DATE_FORMAT(${CRM_SHIPMENT.paid_date}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${CRM_SHIPMENT.paid_date}, '%Y-%m')`),

      // 매입: 지출 합계, expe_date 월 집계
      db
        .select({
          ym: sql<string>`DATE_FORMAT(${CRM_EXPENSE.expe_date}, '%Y-%m')`,
          total: sql<string>`COALESCE(SUM(${CRM_EXPENSE.expe_amnt}), 0)`,
        })
        .from(CRM_EXPENSE)
        .where(
          and(
            eq(CRM_EXPENSE.comp_idno, params.comp_idno),
            eq(CRM_EXPENSE.enab_yesn, true),
            gte(CRM_EXPENSE.expe_date, params.from)
          )
        )
        .groupBy(sql`DATE_FORMAT(${CRM_EXPENSE.expe_date}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${CRM_EXPENSE.expe_date}, '%Y-%m')`),
    ]);

    return { revenueRows, purchaseRows };
  },
  // #endregion
} as const;