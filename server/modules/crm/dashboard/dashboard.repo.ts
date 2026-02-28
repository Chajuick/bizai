// server/modules/crm/dashboard/dashboard.repo.ts

// #region Imports
import { and, desc, eq, gte, lte, lt, sql } from "drizzle-orm";

import {
  CRM_SALE,
  CRM_SCHEDULE,
  CRM_ORDER,
  CRM_SHIPMENT,
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
            eq(CRM_SCHEDULE.stat_code, "scheduled"),
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
            sql`${CRM_ORDER.stat_code} IN ('proposal','negotiation','confirmed')`
          )
        ),
      // ✅ 월 매출 = 수금(paid) + paid_date 기준
      db
        .select({
          total: sql<string>`COALESCE(SUM(${CRM_SHIPMENT.ship_pric}), 0)`,
        })
        .from(CRM_SHIPMENT)
        .where(
          and(
            eq(CRM_SHIPMENT.comp_idno, params.comp_idno),
            eq(CRM_SHIPMENT.enab_yesn, true),
            eq(CRM_SHIPMENT.stat_code, "paid"),
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
            eq(CRM_SCHEDULE.stat_code, "scheduled"),
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
            eq(CRM_SCHEDULE.stat_code, "scheduled"),
            gte(CRM_SCHEDULE.sche_date, now),
            lte(CRM_SCHEDULE.sche_date, twelveHoursLater)
          )
        ),
    ]);

    return {
      logsThisMonth: Number(logsCount?.count ?? 0),
      upcomingSchedulesCount: Number(upcomingSchedules?.count ?? 0),

      activeOrdersCount: Number(activeOrders?.count ?? 0),
      activeOrdersTotal: Number(activeOrders?.total ?? 0),

      monthlyRevenue: Number(monthlyRevenue?.total ?? 0),

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
          eq(CRM_SCHEDULE.stat_code, "scheduled"),
          gte(CRM_SCHEDULE.sche_date, params.now)
        )
      )
      .orderBy(CRM_SCHEDULE.sche_date)
      .limit(params.limit);
  },
  // #endregion

  // #region revenueTrend
  async revenueTrend({ db }: RepoDeps, params: { comp_idno: number; from: Date }) {
    // 수주(ix_ord_comp_crea 사용)와 매출(ix_ship_comp_stat_paid 사용)은 독립 쿼리 → 병렬 실행
    const [orderRows, revenueRows] = await Promise.all([
      // 수주: 취소 제외, crea_date 기준 월 집계
      db
        .select({
          ym: sql<string>`DATE_FORMAT(${CRM_ORDER.crea_date}, '%Y-%m')`,
          total: sql<string>`COALESCE(SUM(${CRM_ORDER.orde_pric}), 0)`,
        })
        .from(CRM_ORDER)
        .where(
          and(
            eq(CRM_ORDER.comp_idno, params.comp_idno),
            eq(CRM_ORDER.enab_yesn, true),
            gte(CRM_ORDER.crea_date, params.from),
            sql`${CRM_ORDER.stat_code} != 'canceled'`
          )
        )
        .groupBy(sql`DATE_FORMAT(${CRM_ORDER.crea_date}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${CRM_ORDER.crea_date}, '%Y-%m')`),

      // 매출: paid_date 기준 월 집계
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
            eq(CRM_SHIPMENT.stat_code, "paid"),
            gte(CRM_SHIPMENT.paid_date, params.from)
          )
        )
        .groupBy(sql`DATE_FORMAT(${CRM_SHIPMENT.paid_date}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${CRM_SHIPMENT.paid_date}, '%Y-%m')`),
    ]);

    return { orderRows, revenueRows };
  },
  // #endregion
} as const;