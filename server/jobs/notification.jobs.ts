// server/jobs/notification.jobs.ts
// 알림 cron job: 일정 임박 + 수주 미진행

import { getDb } from "../core/db";
import { sendPush } from "../core/push";
import {
  CORE_PUSH_SUBSCRIPTION,
  CRM_SCHEDULE,
  CRM_ORDER,
} from "../../drizzle/schema";
import { and, eq, lt, gte, lte, inArray } from "drizzle-orm";

// #region helpers

function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

function daysAgo(d: number): Date {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
}

async function getUserSubscriptions(db: ReturnType<typeof getDb>, comp_idno: number, user_idno: number) {
  return db
    .select({
      endpoint: CORE_PUSH_SUBSCRIPTION.endpoint,
      p256dh:   CORE_PUSH_SUBSCRIPTION.p256dh,
      auth:     CORE_PUSH_SUBSCRIPTION.auth_key,
      subs_idno: CORE_PUSH_SUBSCRIPTION.subs_idno,
    })
    .from(CORE_PUSH_SUBSCRIPTION)
    .where(
      and(
        eq(CORE_PUSH_SUBSCRIPTION.comp_idno, comp_idno),
        eq(CORE_PUSH_SUBSCRIPTION.user_idno, user_idno)
      )
    );
}

async function removeStaleSubscription(db: ReturnType<typeof getDb>, endpoint: string) {
  await db
    .delete(CORE_PUSH_SUBSCRIPTION)
    .where(eq(CORE_PUSH_SUBSCRIPTION.endpoint, endpoint));
}

async function pushToUser(
  db: ReturnType<typeof getDb>,
  comp_idno: number,
  user_idno: number,
  payload: { title: string; body: string; url?: string }
) {
  const subs = await getUserSubscriptions(db, comp_idno, user_idno);
  for (const sub of subs) {
    try {
      await sendPush({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, payload);
    } catch {
      // 만료된 구독 자동 삭제
      await removeStaleSubscription(db, sub.endpoint).catch(() => {/* 무시 */});
    }
  }
}

// #endregion

// #region 일정 임박 알림 (24시간 이내)

let _scheduleNotifRunning = false;

export async function runScheduleReminderJob() {
  if (_scheduleNotifRunning) return;
  _scheduleNotifRunning = true;
  try {
    const db = getDb();
    const now = new Date();
    const in24h = hoursFromNow(24);

    // remd_sent=false, sche_stat=scheduled, sche_date between now and +24h
    const upcoming = await db
      .select({
        sche_idno:  CRM_SCHEDULE.sche_idno,
        comp_idno:  CRM_SCHEDULE.comp_idno,
        owne_idno:  CRM_SCHEDULE.owne_idno,
        sche_name:  CRM_SCHEDULE.sche_name,
        sche_date:  CRM_SCHEDULE.sche_date,
        clie_name:  CRM_SCHEDULE.clie_name,
      })
      .from(CRM_SCHEDULE)
      .where(
        and(
          eq(CRM_SCHEDULE.sche_stat, "scheduled"),
          eq(CRM_SCHEDULE.remd_sent, false),
          eq(CRM_SCHEDULE.enab_yesn, true),
          gte(CRM_SCHEDULE.sche_date, now),
          lte(CRM_SCHEDULE.sche_date, in24h),
        )
      );

    for (const row of upcoming) {
      const dateStr = row.sche_date.toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const diffMs = row.sche_date.getTime() - Date.now();
      const diffH = Math.round(diffMs / 3_600_000);
      const timeLabel = diffH <= 1 ? "1시간 이내" : `약 ${diffH}시간 후`;

      await pushToUser(db, row.comp_idno, row.owne_idno, {
        title: "📅 일정 임박",
        body: `${row.sche_name}${row.clie_name ? ` (${row.clie_name})` : ""} — ${dateStr} (${timeLabel})`,
        url: "/schedule",
      });

      // 알림 발송 완료 표시
      await db
        .update(CRM_SCHEDULE)
        .set({ remd_sent: true })
        .where(eq(CRM_SCHEDULE.sche_idno, row.sche_idno));
    }
  } catch (err) {
    console.error("[NotifJob] scheduleReminder error", err);
  } finally {
    _scheduleNotifRunning = false;
  }
}

// #endregion

// #region 수주 미진행 알림 (7일 이상 업데이트 없음)

let _orderStaleRunning = false;

export async function runOrderStaleJob() {
  if (_orderStaleRunning) return;
  _orderStaleRunning = true;
  try {
    const db = getDb();
    const sevenDaysAgo = daysAgo(7);

    // proposal/negotiation 상태이고 modi_date(또는 crea_date)이 7일 이상 지난 수주
    const stale = await db
      .select({
        orde_idno: CRM_ORDER.orde_idno,
        comp_idno: CRM_ORDER.comp_idno,
        owne_idno: CRM_ORDER.owne_idno,
        clie_name: CRM_ORDER.clie_name,
        prod_serv: CRM_ORDER.prod_serv,
        orde_stat: CRM_ORDER.orde_stat,
        modi_date: CRM_ORDER.modi_date,
        crea_date: CRM_ORDER.crea_date,
      })
      .from(CRM_ORDER)
      .where(
        and(
          inArray(CRM_ORDER.orde_stat, ["proposal", "negotiation"]),
          eq(CRM_ORDER.enab_yesn, true),
          // modi_date가 없거나 7일 이상 전
          lt(CRM_ORDER.crea_date, sevenDaysAgo),
        )
      );

    // modi_date 기준으로 필터링 (drizzle에서 OR nullable 처리)
    const filtered = stale.filter((r) => {
      const lastUpdate = r.modi_date ?? r.crea_date;
      return lastUpdate < sevenDaysAgo;
    });

    for (const row of filtered) {
      const statLabel = row.orde_stat === "proposal" ? "제안" : "협상";
      const lastUpdate = row.modi_date ?? row.crea_date;
      const daysStale = Math.floor((Date.now() - lastUpdate.getTime()) / 86_400_000);

      await pushToUser(db, row.comp_idno, row.owne_idno, {
        title: "📋 수주 진행 확인 필요",
        body: `${row.clie_name} — ${row.prod_serv} (${statLabel}) · ${daysStale}일째 업데이트 없음`,
        url: "/order",
      });
    }
  } catch (err) {
    console.error("[NotifJob] orderStale error", err);
  } finally {
    _orderStaleRunning = false;
  }
}

// #endregion
