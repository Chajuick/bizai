// src/hooks/focuswin/schedule/useScheduleAlerts.ts

// #region Imports
import { useEffect } from "react";
import type { EnhancedSchedule } from "@/types/schedule";
// #endregion

// #region Types
type Args = {
  list: EnhancedSchedule[];
  overdueCount: number;
  imminentCount: number;
};
// #endregion

// #region Helpers
function kstYmd(d: Date) {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10); // YYYY-MM-DD
}

function isWithinThisWeekKst(target: Date, now: Date) {
  const nowKst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const day = nowKst.getUTCDay(); // 0=일..6=토 (KST 보정된 Date)
  const diffToMon = (day + 6) % 7; // 월=0

  const mon = new Date(
    Date.UTC(nowKst.getUTCFullYear(), nowKst.getUTCMonth(), nowKst.getUTCDate() - diffToMon)
  );
  const sun = new Date(Date.UTC(mon.getUTCFullYear(), mon.getUTCMonth(), mon.getUTCDate() + 6));

  const tKst = new Date(target.getTime() + 9 * 60 * 60 * 1000);
  const t = new Date(Date.UTC(tKst.getUTCFullYear(), tKst.getUTCMonth(), tKst.getUTCDate()));

  return t.getTime() >= mon.getTime() && t.getTime() <= sun.getTime();
}

function isNextWeekKst(target: Date, now: Date) {
  const nowKst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const day = nowKst.getUTCDay();
  const diffToMon = (day + 6) % 7;

  const thisMon = new Date(
    Date.UTC(nowKst.getUTCFullYear(), nowKst.getUTCMonth(), nowKst.getUTCDate() - diffToMon)
  );
  const nextMon = new Date(Date.UTC(thisMon.getUTCFullYear(), thisMon.getUTCMonth(), thisMon.getUTCDate() + 7));
  const nextSun = new Date(Date.UTC(nextMon.getUTCFullYear(), nextMon.getUTCMonth(), nextMon.getUTCDate() + 6));

  const tKst = new Date(target.getTime() + 9 * 60 * 60 * 1000);
  const t = new Date(Date.UTC(tKst.getUTCFullYear(), tKst.getUTCMonth(), tKst.getUTCDate()));

  return t.getTime() >= nextMon.getTime() && t.getTime() <= nextSun.getTime();
}
// #endregion

export function useScheduleAlerts({ list, overdueCount, imminentCount }: Args) {
  useEffect(() => {
    if (!("Notification" in window)) return;

    // 이미 허용된 경우에만 알림 발송 — "default"에서 조용히 요청하지 않음
    // (UX 없이 브라우저 팝업 띄우는 것은 권장되지 않음 — NotificationPermissionBanner 참조)
    if (Notification.permission !== "granted") return;

    const now = new Date();

    // #region 기본 알림 (세션 1회: 임박/지연)
    if (overdueCount > 0 || imminentCount > 0) {
      const sessionKey = "schedule-alerts-notified-basic";
      if (!sessionStorage.getItem(sessionKey)) {
        const runBasic = async () => {
          const permission = Notification.permission;
          if (permission !== "granted") return;

          sessionStorage.setItem(sessionKey, "1");

          if (overdueCount > 0) {
            new Notification("지연된 일정이 있습니다", {
              body: `${overdueCount}건의 일정이 지연되었습니다. 확인해주세요.`,
              tag: "overdue-alert",
            });
          }

          if (imminentCount > 0) {
            setTimeout(
              () => {
                new Notification("임박한 일정이 있습니다", {
                  body: `${imminentCount}건의 일정이 12시간 이내에 예정되어 있습니다.`,
                  tag: "imminent-alert",
                });
              },
              overdueCount > 0 ? 1200 : 0
            );
          }
        };

        runBasic();
      }
    }
    // #endregion

    // #region 정책 리마인드 (날짜별 1회 / 모든 scheduled 일정 기준)
    const scheduled = list.filter((p) => p.stat_code === "scheduled");
    if (scheduled.length === 0) return;

    const hasThisWeek = scheduled.some((p) => isWithinThisWeekKst(new Date(p.sche_date), now));
    const hasNextWeek = scheduled.some((p) => isNextWeekKst(new Date(p.sche_date), now));

    const today = kstYmd(now);
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const dow = kstNow.getUTCDay(); // 0=일 1=월 2=화 ... 5=금

    const isTue = dow === 2;
    const isFri = dow === 5;

    const remindKey = (k: string) => `schedule-remind-${k}-${today}`;

    const runPolicy = (title: string, body: string, key: string) => {
      if (sessionStorage.getItem(key)) return;
      // 이미 granted 확인은 useEffect 최상단에서 처리됨
      sessionStorage.setItem(key, "1");
      new Notification(title, { body, tag: key });
    };

    // 이번 주 일정이면 금요일 1회
    if (isFri && hasThisWeek) {
      runPolicy(
        "이번 주 일정 리마인드",
        "이번 주 일정이 남아있어요. 금요일에 한 번 정리하고 마무리해보세요.",
        remindKey("fri")
      );
    }

    // 다음 주 초면 화요일 1회
    if (isTue && hasNextWeek) {
      runPolicy(
        "다음 주 일정 리마인드",
        "다음 주 일정이 있어요. 화요일에 한 번 준비사항을 체크해보세요.",
        remindKey("tue")
      );
    }

    // #endregion
  }, [list, overdueCount, imminentCount]);
}