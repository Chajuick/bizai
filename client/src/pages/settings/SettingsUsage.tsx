import { BarChart3, Loader2, Zap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageShell from "@/components/focuswin/common/page/scaffold/page-shell";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { TOKENS_PER_ANALYSIS } from "@shared/const";

// #region Helpers
function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function toKRDate(d: Date | string | number): string {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("ko-KR");
}

function approxAnalyses(tokens: number): number {
  if (!tokens || tokens <= 0) return 0;
  return Math.max(0, Math.floor(tokens / TOKENS_PER_ANALYSIS));
}
// #endregion

// #region UI Parts
function UsageBar({
  value,
  max,
  color = "bg-blue-500",
  ariaLabel,
}: {
  value: number;
  max: number;
  color?: string;
  ariaLabel?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden" aria-label={ariaLabel} title={`${pct.toFixed(1)}%`}>
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
// #endregion

export default function SettingsUsage() {
  const { data, isLoading, error } = trpc.billing.getUsageSummary.useQuery();
  const [, navigate] = useLocation();

  // #region Loading / Error
  if (isLoading) {
    return (
      <PageShell size="sm">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={20} className="text-slate-400" />
          <h1 className="text-lg font-bold text-slate-900">사용량</h1>
        </div>
        <div className="flex items-center justify-center py-10">
          <Loader2 size={20} className="animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  if (error || !data) {
    return (
      <PageShell size="sm">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={20} className="text-slate-400" />
          <h1 className="text-lg font-bold text-slate-900">사용량</h1>
        </div>
        <p className="text-sm text-red-500">사용량 정보를 불러오지 못했습니다.</p>
      </PageShell>
    );
  }
  // #endregion

  const { total_limit, total_used, remaining, usage_by_feat, reset_date, warning_level, plan_name } = data;

  const pct = total_limit > 0 ? Math.min(100, (total_used / total_limit) * 100) : 0;
  const barColor =
    warning_level === "exceeded" ? "bg-red-500"
    : warning_level === "warning" ? "bg-amber-500"
    : "bg-blue-500";

  const remainingAnalyses = approxAnalyses(remaining);

  const feats = [
    { label: "음성 → 텍스트", desc: "녹음 전사(STT)", value: usage_by_feat.stt, color: "bg-purple-400" },
    { label: "AI 분석", desc: "요약/추출/추천", value: usage_by_feat.llm, color: "bg-blue-400" },
    { label: "채팅", desc: "대화형 도움", value: usage_by_feat.chat, color: "bg-teal-400" },
  ];

  const featMax = Math.max(1, total_used); // ✅ 기능별은 전체 사용량 대비 비중이 직관적

  return (
    <PageShell size="sm">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 size={20} className="text-slate-400" />
        <h1 className="text-lg font-bold text-slate-900">사용량</h1>
      </div>

      <div className="space-y-6">
        {/* #region 전체 요약 */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">현재 플랜</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{plan_name}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Info size={12} className="text-slate-400" />
                남은 사용량: <span className="font-semibold text-slate-700">AI 분석 약 {remainingAnalyses}회</span> (대략)
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-400">다음 초기화</p>
              <p className="text-xs font-medium text-slate-600">{toKRDate(reset_date)}</p>
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between mb-1.5">
              <p className="text-sm font-medium text-slate-700">
                {formatTokens(total_used)}{" "}
                <span className="text-slate-400 font-normal">/ {formatTokens(total_limit)} 토큰</span>
              </p>

              <p className={`text-xs font-bold ${
                warning_level === "exceeded" ? "text-red-600"
                : warning_level === "warning" ? "text-amber-600"
                : "text-slate-400"
              }`}>
                {pct.toFixed(1)}%
              </p>
            </div>

            <UsageBar value={total_used} max={total_limit} color={barColor} ariaLabel="전체 사용량" />

            {warning_level !== "ok" && (
              <div className={`mt-2 text-xs ${warning_level === "exceeded" ? "text-red-600" : "text-amber-600"} flex items-center justify-between gap-3`}>
                <span>
                  {warning_level === "exceeded" ? "사용량이 소진되었습니다." : "사용량이 80%를 초과했습니다."}
                </span>
                <button
                  className="underline underline-offset-2 font-semibold"
                  onClick={() => navigate("/settings/billing")}
                >
                  플랜 보기
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="text-center">
              <p className="text-xs text-slate-400">사용</p>
              <p className="text-base font-bold text-slate-900">{formatTokens(total_used)}</p>
            </div>

            <div className="text-center border-x border-slate-100">
              <p className="text-xs text-slate-400">남음</p>
              <p className="text-base font-black text-slate-900">{formatTokens(remaining)}</p>
            </div>

            <div className="text-center">
              <p className="text-xs text-slate-400">한도</p>
              <p className="text-base font-bold text-slate-900">{formatTokens(total_limit)}</p>
            </div>
          </div>
        </div>
        {/* #endregion */}

        {/* #region 기능별 사용량 */}
        <section className="space-y-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">기능별 사용량</p>

          <div className="rounded-2xl border border-slate-100 bg-white divide-y divide-slate-50">
            {feats.map((f) => (
              <div key={f.label} className="px-4 py-3 space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-slate-800">{f.label}</div>
                    <div className="text-[11px] text-slate-400">{f.desc}</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{formatTokens(f.value)}</div>
                </div>

                {/* ✅ 기능별은 "전체 사용량 대비 비중"으로 표시 */}
                <UsageBar value={f.value} max={featMax} color={f.color} ariaLabel={`${f.label} 사용량`} />
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400">
            기능별 막대는 “이번 기간 전체 사용량” 대비 비중입니다.
          </p>
        </section>
        {/* #endregion */}

        {/* #region CTA */}
        <Button className="w-full" variant={warning_level === "ok" ? "outline" : "default"} onClick={() => navigate("/settings/billing")}>
          <Zap size={14} className="mr-1.5" />
          {warning_level === "ok" ? "플랜 보기" : "플랜 업그레이드"}
        </Button>

        <p className="text-xs text-slate-400 text-center">
          사용량은 결제 기간 기준으로 초기화됩니다.
        </p>
        {/* #endregion */}
      </div>
    </PageShell>
  );
}