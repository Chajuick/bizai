// client/src/components/focuswin/common/feedback/TokenWarningBanner.tsx

import { X, Zap } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * AI 토큰 잔액 경고 배너
 *
 * - warning: 80% 이상 소진 → 주황 배너
 * - exceeded: 100% 소진 → 빨간 배너
 * - ok: 렌더링 안 함
 * - /settings/billing 페이지에서는 숨김 (중복 표시 방지)
 * - 세션 동안 닫기 가능 (경고 레벨별로 독립 관리)
 */
export default function TokenWarningBanner() {
  const [location, navigate] = useLocation();
  const { data } = trpc.billing.getUsageSummary.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5분 캐시 — 레이아웃 공통 배너이므로 빈번한 fetch 방지
  });

  const warningLevel = data?.warning_level ?? "ok";

  const [dismissedKey, setDismissedKey] = useState<string | null>(() => {
    return sessionStorage.getItem("token-warning-dismissed");
  });

  // billing 페이지에서는 표시 안 함
  if (location === "/settings/billing") return null;
  if (warningLevel === "ok") return null;

  // 현재 경고 레벨 기준으로 닫기 여부 판단
  // (예: warning에서 닫았어도 exceeded가 되면 다시 표시)
  if (dismissedKey === warningLevel) return null;

  const isExceeded = warningLevel === "exceeded";

  const handleDismiss = () => {
    sessionStorage.setItem("token-warning-dismissed", warningLevel);
    setDismissedKey(warningLevel);
  };

  const bgStyle = isExceeded
    ? { background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }
    : { background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.22)" };

  const iconColor = isExceeded ? "#f87171" : "#f59e0b";
  const textColor = isExceeded ? "#b91c1c" : "#92400e";
  const btnBg = isExceeded ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)";
  const btnColor = isExceeded ? "#ef4444" : "#d97706";

  const message = isExceeded
    ? "AI 토큰이 모두 소진되었습니다. AI 분석을 사용하려면 플랜을 업그레이드하세요."
    : `AI 토큰의 80% 이상을 사용했습니다. 잔여량이 부족하면 플랜을 업그레이드하세요.`;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 text-sm"
      style={bgStyle}
    >
      <Zap size={15} style={{ color: iconColor, flexShrink: 0 }} />
      <span className="flex-1 text-xs" style={{ color: textColor }}>
        {message}
      </span>
      <button
        type="button"
        onClick={() => navigate("/settings/billing")}
        className="px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition"
        style={{ background: btnBg, color: btnColor }}
      >
        플랜 보기
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="닫기"
        className="transition"
        style={{ color: "#9ca3af" }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
