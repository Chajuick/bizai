import { BarChart3, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageShell from "@/components/focuswin/common/page-shell";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function UsageBar({ value, max, color = "bg-blue-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function SettingsUsage() {
  const { data, isLoading, error } = trpc.billing.getUsageSummary.useQuery();
  const [, navigate] = useLocation();

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

  const { total_limit, total_used, remaining, usage_by_feat, reset_date, warning_level, plan_name } = data;
  const pct = total_limit > 0 ? Math.min(100, (total_used / total_limit) * 100) : 0;

  const barColor =
    warning_level === "exceeded" ? "bg-red-500"
    : warning_level === "warning" ? "bg-amber-500"
    : "bg-blue-500";

  const feats = [
    { label: "STT (음성 변환)", value: usage_by_feat.stt, color: "bg-purple-400" },
    { label: "LLM (AI 분석)", value: usage_by_feat.llm, color: "bg-blue-400" },
    { label: "Chat", value: usage_by_feat.chat, color: "bg-teal-400" },
  ];

  return (
    <PageShell size="sm">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 size={20} className="text-slate-400" />
        <h1 className="text-lg font-bold text-slate-900">사용량</h1>
      </div>

      <div className="space-y-6">
        {/* 전체 요약 */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">현재 플랜</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{plan_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">리셋</p>
              <p className="text-xs font-medium text-slate-600">
                {new Date(reset_date).toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between mb-1.5">
              <p className="text-sm font-medium text-slate-700">
                {formatTokens(total_used)} <span className="text-slate-400 font-normal">/ {formatTokens(total_limit)} 토큰</span>
              </p>
              <p className={`text-xs font-bold ${
                warning_level === "exceeded" ? "text-red-600"
                : warning_level === "warning" ? "text-amber-600"
                : "text-slate-400"
              }`}>
                {pct.toFixed(1)}%
              </p>
            </div>
            <UsageBar value={total_used} max={total_limit} color={barColor} />
            {warning_level !== "ok" && (
              <p className={`text-xs mt-1.5 ${warning_level === "exceeded" ? "text-red-600" : "text-amber-600"}`}>
                {warning_level === "exceeded"
                  ? "AI 사용량이 소진되었습니다. 플랜을 업그레이드하세요."
                  : "AI 사용량의 80%를 초과했습니다."}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="text-center">
              <p className="text-xs text-slate-400">사용</p>
              <p className="text-base font-bold text-slate-900">{formatTokens(total_used)}</p>
            </div>
            <div className="text-center border-x border-slate-100">
              <p className="text-xs text-slate-400">한도</p>
              <p className="text-base font-bold text-slate-900">{formatTokens(total_limit)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">남은 토큰</p>
              <p className="text-base font-bold text-slate-900">{formatTokens(remaining)}</p>
            </div>
          </div>
        </div>

        {/* 기능별 사용량 */}
        <section className="space-y-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">기능별 사용량</p>
          <div className="rounded-2xl border border-slate-100 bg-white divide-y divide-slate-50">
            {feats.map((f) => (
              <div key={f.label} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{f.label}</span>
                  <span className="font-medium text-slate-900">{formatTokens(f.value)}</span>
                </div>
                <UsageBar value={f.value} max={total_limit} color={f.color} />
              </div>
            ))}
          </div>
        </section>

        {/* 업그레이드 버튼 (warning/exceeded) */}
        {warning_level !== "ok" && (
          <Button
            className="w-full"
            onClick={() => navigate("/settings/billing")}
          >
            <Zap size={14} className="mr-1.5" />
            플랜 업그레이드
          </Button>
        )}

        <p className="text-xs text-slate-400 text-center">
          사용량은 매월 결제 기간 시작 시 초기화됩니다.
        </p>
      </div>
    </PageShell>
  );
}
