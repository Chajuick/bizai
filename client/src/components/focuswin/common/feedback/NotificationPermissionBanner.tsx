// client/src/components/focuswin/common/feedback/NotificationPermissionBanner.tsx

import { Bell, BellOff, X } from "lucide-react";
import { useState } from "react";
import { useNotificationPermission } from "@/hooks/focuswin/app/usePermissions";

/**
 * 알림 권한 유도 배너
 *
 * - "default" 상태에서만 표시 (아직 결정 안 됨)
 * - "granted" / "denied" / "unsupported": 렌더링 안 함
 * - 사용자가 닫기(X) 또는 "다음에" 클릭 시 세션 동안 숨김
 * - "알림 허용" 클릭 시 브라우저 권한 요청 발생
 */
export default function NotificationPermissionBanner() {
  const { state, request } = useNotificationPermission();
  const [dismissed, setDismissed] = useState(() =>
    !!sessionStorage.getItem("notification-banner-dismissed")
  );

  if (state !== "default" || dismissed) return null;

  const handleAllow = async () => {
    const result = await request();
    if (result !== "default") setDismissed(true);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("notification-banner-dismissed", "1");
    setDismissed(true);
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
      style={{
        background: "rgba(99,102,241,0.08)",
        border: "1px solid rgba(99,102,241,0.2)",
        color: "var(--color-text-secondary, #a1a1aa)",
      }}
    >
      <Bell size={16} style={{ color: "#818cf8", flexShrink: 0 }} />
      <span className="flex-1">
        일정 알림을 켜면 임박하거나 지연된 일정을 놓치지 않습니다.
      </span>
      <button
        type="button"
        onClick={handleAllow}
        className="px-3 py-1 rounded text-xs font-medium"
        style={{
          background: "rgba(99,102,241,0.2)",
          color: "#818cf8",
          border: "1px solid rgba(99,102,241,0.3)",
          whiteSpace: "nowrap",
        }}
      >
        알림 허용
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="닫기"
        style={{ color: "#71717a" }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

/**
 * 알림 권한 거부 안내 배너
 *
 * - "denied" 상태일 때만 표시
 * - 브라우저 설정에서 직접 변경해야 함을 안내
 */
export function NotificationDeniedHint() {
  const { state } = useNotificationPermission();
  const [dismissed, setDismissed] = useState(false);

  if (state !== "denied" || dismissed) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
      style={{
        background: "rgba(239,68,68,0.06)",
        border: "1px solid rgba(239,68,68,0.15)",
        color: "var(--color-text-secondary, #a1a1aa)",
      }}
    >
      <BellOff size={16} style={{ color: "#f87171", flexShrink: 0 }} />
      <span className="flex-1">
        알림이 차단되어 있습니다. 브라우저 주소창의 🔒 아이콘에서 알림을 허용으로 변경하세요.
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="닫기"
        style={{ color: "#71717a" }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
