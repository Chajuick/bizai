// src/pages/settings/SettingsBilling.tsx

// #region Imports
import { useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Check, CreditCard, Loader2, Users, XCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageShell from "@/components/focuswin/common/page/scaffold/page-shell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useWorkspaceSwitcher } from "@/hooks/focuswin/company/useWorkspaceSwitcher";
import { handleApiError } from "@/lib/handleApiError";
// #endregion

// #region Plan Meta + AI Baseline
// ─── 플랜별 마케팅 메타 ───────────────────────────────────────────────────────
// AI Usage Baseline (2026-03-04 기준)
//
// 모델
// LLM : llama-3.3-70b-versatile
// STT : whisper-large-v3-turbo
//
// 환율 기준
// 1 USD ≈ ₩1,440
//
// ─────────────────────────────────────────
// LLM 비용
//
// input  : $0.59 / 1M tokens  ≈ ₩850
// output : $0.79 / 1M tokens  ≈ ₩1,140
//
// 평균 CRM 분석 요청
// 약 5,000 tokens 사용 (입력 + 출력)
//
// ⇒ AI 분석 1회 비용
// 약 ₩5 ~ ₩10 수준
//
// ─────────────────────────────────────────
// STT 비용
//
// $0.04 / hour ≈ ₩58 / 시간
// 약 ₩1 / 분 수준
//
// 예시
// 음성 1분 녹음 + AI 분석
// ≈ 약 ₩6 ~ ₩12 수준
//
// ─────────────────────────────────────────
// 토큰 → 실제 사용량 환산 (대략)
//
// 10,000 tokens
// ≈ AI 분석 약 2회
//
// 200,000 tokens
// ≈ AI 분석 약 40회
//
// 1,000,000 tokens
// ≈ AI 분석 약 200회
//
// 10,000,000 tokens
// ≈ AI 분석 약 2000회
//
// ─────────────────────────────────────────
// 플랜별 예상 AI 비용 (최대 사용 기준)
//
// Free
// 10,000 tokens
// 예상 AI 비용 ≈ ₩5 ~ ₩15
//
// Pro
// 200,000 tokens
// 예상 AI 비용 ≈ ₩120 ~ ₩200
//
// Team
// 1,000,000 tokens
// 예상 AI 비용 ≈ ₩600 ~ ₩1,000
//
// Enterprise
// 10,000,000 tokens
// 예상 AI 비용 ≈ ₩6,000 ~ ₩10,000
//
// ※ 실제 사용량은 대부분 한도보다 훨씬 낮기 때문에
//   실제 평균 비용은 이보다 더 낮게 발생하는 경우가 많음
//
// ※ UI에서는 "토큰" 대신 이해하기 쉬운 단위로 표현
// ─────────────────────────────────────────────────────────────────────────────

const TOKENS_PER_ANALYSIS = 5_000;

const PLAN_META: Record<string, { badge?: string; highlight?: boolean; features: string[] }> = {
  // 10,000 tokens : 예상 AI 비용 ≈ ₩5 ~ ₩15
  free: {
    features: ["사용자 1명", "AI 분석 약 2회 / 월", "기본 CRM 기능"],
  },
  // 200,000 tokens : 예상 AI 비용 ≈ ₩120 ~ ₩200
  pro: {
    badge: "인기",
    highlight: true,
    features: ["사용자 1명", "AI 분석 약 40회 / 월", "음성 메모 전사(녹음→텍스트)"],
  },
  // 1,000,000 tokens : 예상 AI 비용 ≈ ₩600 ~ ₩1,000
  team: {
    features: ["사용자 5명", "AI 분석 약 200회 / 월", "팀 협업 기능"],
  },
  // 10,000,000 tokens : 예상 AI 비용 ≈ ₩6,000 ~ ₩10,000
  enterprise: {
    features: ["사용자 무제한", "AI 분석 대량 제공", "전용 지원"],
  },
};

const PLAN_LABEL: Record<string, string> = {
  active: "활성",
  trialing: "체험 중",
  canceled: "해지 예약됨",
  past_due: "연체",
  inactive: "비활성",
};
// #endregion

// #region Helpers
function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function toKRDate(d: Date | string | number | null | undefined): string {
  if (!d) return "-";
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("ko-KR");
}

function approxAnalysesPerMonth(tokenMonth: number): number {
  if (!tokenMonth || tokenMonth <= 0) return 0;
  return Math.max(1, Math.round(tokenMonth / TOKENS_PER_ANALYSIS));
}

function getMetaAnalysesText(metaFeatures: string[]): string | null {
  // "AI 분석 약 40회 / 월" 같은 문구를 찾아서 헤더에 재사용
  const hit = metaFeatures.find(f => f.includes("AI 분석") && f.includes("/ 월"));
  return hit ?? null;
}
// #endregion

// #region Summary Card
function SummaryCard() {
  const { data, isLoading, error } = trpc.billing.getSummary.useQuery();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
        <p className="text-sm text-red-600">구독 정보를 불러오지 못했습니다.</p>
      </div>
    );
  }

  const statusLabel = PLAN_LABEL[data.subs_stat] ?? data.subs_stat;
  const periodStr = `${toKRDate(data.star_date)} ~ ${toKRDate(data.ends_date)}`;
  const approxAnalyses = approxAnalysesPerMonth(data.token_month);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">현재 플랜</p>
          <p className="text-xl font-black text-slate-900 mt-0.5 truncate">{data.plan_name}</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Info size={12} className="text-slate-400" />
            토큰은 내부 단위이며, 화면에는 “AI 분석 회수”로 환산해 표시합니다.
          </p>
        </div>

        <Badge variant="outline" className="text-xs border-slate-200 text-slate-700 bg-slate-50">
          {statusLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
          <p className="text-xs text-slate-500 mb-1">사용자 수</p>
          <p className="text-lg font-bold text-slate-900">
            {data.member_count}
            <span className="text-slate-400 text-sm font-normal">/{data.seat_limit}</span>
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
          <p className="text-xs text-slate-500 mb-1">AI 분석 / 월</p>
          <p className="text-lg font-bold text-slate-900">{approxAnalyses}회</p>
          <p className="text-[10px] text-slate-400 mt-0.5">({formatTokens(data.token_month)} tokens)</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
          <p className="text-xs text-slate-500 mb-1">기간</p>
          <p className="text-sm font-semibold text-slate-900">{toKRDate(data.ends_date)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">만료일</p>
        </div>
      </div>

      <p className="text-xs text-slate-500">{periodStr}</p>
    </div>
  );
}
// #endregion

// #region Plan Cards
function PlanCards() {
  const { data: summary } = trpc.billing.getSummary.useQuery();
  const { data: plans, isLoading } = trpc.billing.listPlans.useQuery();
  const { companyRole } = useWorkspaceSwitcher();

  const utils = trpc.useUtils();
  const changePlan = trpc.billing.changePlanFake.useMutation();

  const [pending, setPending] = useState<string | null>(null);

  const isAdmin = companyRole === "owner" || companyRole === "admin";

  const handleChange = async (plan_code: string) => {
    if (!summary) return;
    if (plan_code === summary.plan_code) return;

    setPending(plan_code);
    try {
      await changePlan.mutateAsync({ plan_code: plan_code as "free" | "pro" | "team" | "enterprise" });
      await utils.billing.getSummary.invalidate();
      toast.success("플랜이 변경되었습니다.");
    } catch (e) {
      handleApiError(e);
    } finally {
      setPending(null);
    }
  };

  const planHint = useMemo(() => {
    if (!summary) return null;
    return "플랜 변경은 즉시 적용됩니다.";
  }, [summary]);

  if (isLoading) {
    return (
      <section className="space-y-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">플랜 선택</p>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-slate-400" />
        </div>
      </section>
    );
  }

  if (!plans?.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">플랜 선택</p>
        {planHint && <p className="text-[11px] text-slate-400">{planHint}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {plans.map(plan => {
          const meta = PLAN_META[plan.plan_code] ?? { features: [] };
          const isCurrent = summary?.plan_code === plan.plan_code;
          const isBusy = pending === plan.plan_code;

          const seatsText = plan.seat_limt >= 999_999 ? "무제한" : `${plan.seat_limt}석`;
          const approxAnalyses = plan.plan_code === "enterprise" ? "대량" : `${approxAnalysesPerMonth(plan.tokn_mont)}회/월`;

          const metaAnalysesText = getMetaAnalysesText(meta.features);

          return (
            <div
              key={plan.plan_idno}
              className={[
                "relative rounded-2xl border p-4 space-y-3 transition shadow-sm",
                meta.highlight ? "border-blue-300 bg-blue-50" : "border-slate-100 bg-white",
                isCurrent ? "ring-2 ring-blue-500" : "",
              ].join(" ")}
            >
              {meta.badge ? <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">{meta.badge}</span> : null}

              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-slate-900">{plan.plan_name}</p>
                  {isCurrent ? <span className="text-[11px] font-semibold text-blue-700">현재 사용 중</span> : null}
                </div>

                <div className="flex gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {seatsText}
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 size={11} /> {metaAnalysesText ? metaAnalysesText.replace("AI 분석 ", "") : approxAnalyses}
                  </span>
                </div>

                {/* 토큰은 보조 정보로만 */}
                <p className="text-[10px] text-slate-400 mt-1">제공량: {formatTokens(plan.tokn_mont)} tokens / 월 (내부 단위)</p>
              </div>

              <ul className="space-y-1">
                {meta.features.map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-slate-700">
                    <Check size={11} className="text-green-600 shrink-0 mt-[2px]" /> {f}
                  </li>
                ))}
              </ul>

              {isAdmin ? (
                <Button size="sm" variant={isCurrent ? "outline" : "default"} className="w-full" disabled={isCurrent || isBusy} onClick={() => handleChange(plan.plan_code)}>
                  {isBusy ? <Loader2 size={13} className="animate-spin mr-1" /> : null}
                  {isCurrent ? "현재 플랜" : "이 플랜으로 변경"}
                </Button>
              ) : (
                <div className={`w-full text-center text-xs py-1 font-medium ${isCurrent ? "text-blue-600" : "text-slate-400"}`}>{isCurrent ? "현재 플랜" : ""}</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
// #endregion

// #region Cancel Dialog (Cancel at period end)
function CancelSubscriptionDialog({ open, onClose, endsDate }: { open: boolean; onClose: () => void; endsDate: Date | string | number | null | undefined }) {
  const utils = trpc.useUtils();
  const cancelSub = trpc.billing.cancelSubscription.useMutation();
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await cancelSub.mutateAsync();
      await utils.billing.getSummary.invalidate();
      toast.success(res.message ?? "해지 예약이 완료되었습니다.");
      onClose();
    } catch (e) {
      handleApiError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            구독 해지 예약
          </DialogTitle>

          <DialogDescription className="space-y-2 pt-4">
            <p>
              해지를 예약하면 <b>결제 기간 종료일까지</b>는 그대로 사용하실 수 있습니다.
            </p>
            <p className="text-slate-600">
              종료일(<b>{toKRDate(endsDate)}</b>) 이후에는 <b>무료 플랜으로 자동 전환</b>됩니다.
            </p>
            <p className="text-slate-600">기록된 데이터는 그대로 유지되며, 언제든 다시 업그레이드할 수 있습니다.</p>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto" disabled={loading} onClick={onClose}>
            닫기
          </Button>
          <Button variant="destructive" className="w-full sm:w-auto" disabled={loading} onClick={handleCancel}>
            {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            해지 예약하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// #endregion

// #region Page
export default function SettingsBilling() {
  const { companyRole } = useWorkspaceSwitcher();
  const { data: summary } = trpc.billing.getSummary.useQuery();

  const [downgradeOpen, setDowngradeOpen] = useState(false);

  const isAdmin = companyRole === "owner" || companyRole === "admin";
  const showCancelButton = isAdmin && summary?.plan_code !== "free" && summary?.subs_stat === "active";

  return (
    <PageShell size="sm">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard size={20} className="text-slate-400" />
        <h1 className="text-lg font-black text-slate-900">플랜/결제</h1>
      </div>

      <div className="space-y-6">
        <SummaryCard />

        {/* 해지 예약됨 안내 (실 결제 연동 시에만 의미가 커짐) */}
        {summary?.subs_stat === "canceled" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <XCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">해지 예약됨</p>
              <p className="text-amber-700 mt-0.5">
                {summary.ends_date ? `${toKRDate(summary.ends_date)} 결제 기간 종료 후 무료 플랜으로 전환됩니다.` : "결제 기간 종료 후 무료 플랜으로 전환됩니다."}
              </p>
            </div>
          </div>
        )}

        <PlanCards />

        {/* “해지” 액션은 무료 전환으로 통일 */}
        {showCancelButton && (
          <div className="pt-2 border-t border-slate-100">
            <button onClick={() => setDowngradeOpen(true)} className="text-xs text-slate-400 hover:text-red-500 transition underline underline-offset-2">
              무료 플랜으로 전환
            </button>
          </div>
        )}

        <p className="text-xs text-slate-400 text-center">실제 결제 연동 전 체험판입니다. 플랜 변경은 즉시 적용됩니다.</p>
      </div>

      <CancelSubscriptionDialog open={downgradeOpen} onClose={() => setDowngradeOpen(false)} endsDate={summary?.ends_date} />
    </PageShell>
  );
}
// #endregion
