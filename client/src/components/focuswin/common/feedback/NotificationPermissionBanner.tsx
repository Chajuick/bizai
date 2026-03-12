// client/src/components/focuswin/common/feedback/NotificationPermissionBanner.tsx

import { Bell, BellOff, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNotificationPermission } from "@/hooks/focuswin/app/usePermissions";

const DISMISS_DEFAULT_KEY = "notification-banner-dismissed-default";
const DISMISS_DENIED_KEY = "notification-banner-dismissed-denied";

function readSessionFlag(key: string) {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeSessionFlag(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) sessionStorage.setItem(key, "1");
    else sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

type BannerShellProps = {
  icon: React.ReactNode;
  message: React.ReactNode;
  tone: "info" | "danger";
  action?: React.ReactNode;
  onClose?: () => void;
};

function BannerShell({ icon, message, tone, action, onClose }: BannerShellProps) {
  const toneStyle =
    tone === "danger"
      ? {
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.15)",
          iconColor: "#f87171",
          buttonBg: "rgba(239,68,68,0.10)",
          buttonBorder: "1px solid rgba(239,68,68,0.18)",
          buttonText: "#dc2626",
        }
      : {
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.20)",
          iconColor: "#818cf8",
          buttonBg: "rgba(99,102,241,0.14)",
          buttonBorder: "1px solid rgba(99,102,241,0.28)",
          buttonText: "#6366f1",
        };

  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{
        background: toneStyle.background,
        border: toneStyle.border,
        color: "var(--color-text-secondary, #71717a)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 pt-0.5" style={{ color: toneStyle.iconColor }}>
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm leading-6 break-keep">{message}</div>

          {action ? <div className="mt-3">{action}</div> : null}
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 rounded-lg p-1 transition hover:bg-black/5"
            style={{ color: "#71717a" }}
          >
            <X size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * 알림 권한 유도 배너
 *
 * - "default" 상태에서만 표시
 * - 사용자가 닫거나 "다음에" 클릭 시 세션 동안 숨김
 * - "알림 허용" 클릭 시 브라우저 권한 요청
 */
export default function NotificationPermissionBanner() {
  const { state, request } = useNotificationPermission();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(readSessionFlag(DISMISS_DEFAULT_KEY));
  }, []);

  useEffect(() => {
    if (state !== "default") {
      writeSessionFlag(DISMISS_DEFAULT_KEY, false);
      setDismissed(false);
    }
  }, [state]);

  const hidden = useMemo(() => state !== "default" || dismissed, [state, dismissed]);
  if (hidden) return null;

  const handleAllow = async () => {
    const result = await request();
    if (result !== "default") {
      writeSessionFlag(DISMISS_DEFAULT_KEY, true);
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    writeSessionFlag(DISMISS_DEFAULT_KEY, true);
    setDismissed(true);
  };

  return (
    <BannerShell
      tone="info"
      icon={<Bell size={16} />}
      message={
        <>
          일정 알림을 켜면 <strong className="font-semibold text-slate-700">임박 일정</strong>이나{" "}
          <strong className="font-semibold text-slate-700">지연 일정</strong>을 더 빨리 확인할 수 있어요.
        </>
      }
      action={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleAllow}
            className="w-full sm:w-auto px-3 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: "rgba(99,102,241,0.14)",
              color: "#6366f1",
              border: "1px solid rgba(99,102,241,0.28)",
            }}
          >
            알림 허용
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full sm:w-auto px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-500 hover:bg-white/70"
          >
            다음에
          </button>
        </div>
      }
      onClose={handleDismiss}
    />
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

  useEffect(() => {
    setDismissed(readSessionFlag(DISMISS_DENIED_KEY));
  }, []);

  useEffect(() => {
    if (state !== "denied") {
      writeSessionFlag(DISMISS_DENIED_KEY, false);
      setDismissed(false);
    }
  }, [state]);

  if (state !== "denied" || dismissed) return null;

  const handleDismiss = () => {
    writeSessionFlag(DISMISS_DENIED_KEY, true);
    setDismissed(true);
  };

  return (
    <BannerShell
      tone="danger"
      icon={<BellOff size={16} />}
      message={
        <>
          알림이 차단되어 있습니다. 브라우저 주소창의 <strong className="font-semibold text-slate-700">권한 아이콘</strong>에서
          알림을 <strong className="font-semibold text-slate-700">허용</strong>으로 변경해 주세요.
        </>
      }
      action={
        <div className="text-xs text-slate-500 leading-5 break-keep">
          이미 차단한 경우에는 브라우저 팝업으로 다시 요청할 수 없어서, 설정에서 직접 바꿔야 해요.
        </div>
      }
      onClose={handleDismiss}
    />
  );
}