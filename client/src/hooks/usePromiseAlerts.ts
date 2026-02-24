import { useEffect } from "react";

export function usePromiseAlerts(overdueCount: number, imminentCount: number) {
  useEffect(() => {
    if (overdueCount === 0 && imminentCount === 0) return;
    if (!("Notification" in window)) return;

    // 세션 당 한 번만 알림 (새로고침 시마다 중복 방지)
    const sessionKey = "promise-alerts-notified";
    if (sessionStorage.getItem(sessionKey)) return;

    const showNotifications = async () => {
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }
      if (permission !== "granted") return;

      sessionStorage.setItem(sessionKey, "1");

      if (overdueCount > 0) {
        new Notification("지연된 일정이 있습니다", {
          body: `${overdueCount}건의 일정이 지연되었습니다. 확인해주세요.`,
          tag: "overdue-alert",
        });
      }

      if (imminentCount > 0) {
        setTimeout(() => {
          new Notification("임박한 일정이 있습니다", {
            body: `${imminentCount}건의 일정이 12시간 이내에 예정되어 있습니다.`,
            tag: "imminent-alert",
          });
        }, overdueCount > 0 ? 1200 : 0);
      }
    };

    showNotifications();
  }, [overdueCount, imminentCount]);
}
