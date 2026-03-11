// src/pages/settings/SettingsBilling.tsx

// #region Imports
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Check,
  CreditCard,
  Loader2,
  Users,
  XCircle,
  Info,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PageShell from "@/components/focuswin/common/page/scaffold/page-shell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useWorkspaceSwitcher } from "@/hooks/focuswin/company/useWorkspaceSwitcher";
import { handleApiError } from "@/lib/handleApiError";
// #endregion

// #region Plan Meta + AI Baseline
const TOKENS_PER_ANALYSIS = 5_000;

const PLAN_META: Record<
  string,
  { badge?: string; highlight?: boolean; features: string[] }
> = {
  free: {
    features: ["사용자 1명", "AI 분석 약 2회 / 월", "기본 CRM 기능"],
  },
  pro: {
    badge: "인기",
    highlight: true,
    features: [
      "사용자 1명",
      "AI 분석 약 40회 / 월",
      "음성 메모 전사(녹음→텍스트)",
    ],
  },
  team: {
    features: ["사용자 5명", "AI 분석 약 200회 / 월", "팀 협업 기능"],
  },
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

function toKRDate(
  d: Date | string | number | null | undefined,
): string {
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
  const hit = metaFeatures.find(
    (f) => f.includes("AI 분석") && f.includes("/ 월"),
  );
  return hit ?? null;
}
// #endregion

// #region Summary Card
function SummaryCard() {
  const { data, isLoading, error } = trpc.billing.getSummary.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white p-6">
        <Loader2 size={20} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
        <p className="text-sm text-red-600">
          구독 정보를 불러오지 못했습니다.
        </p>
      </div>
    );
  }

  const statusLabel = PLAN_LABEL[data.subs_stat] ?? data.subs_stat;
  const periodStr = `${toKRDate(data.star_date)} ~ ${toKRDate(data.ends_date)}`;
  const approxAnalyses = approxAnalysesPerMonth(data.token_month);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            현재 플랜
          </p>
          <p className="mt-0.5 truncate text-xl font-black text-slate-900">
            {data.plan_name}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <Info size={12} className="text-slate-400" />
            토큰은 내부 단위이며, 화면에는 “AI 분석 회수”로 환산해
            표시합니다.
          </p>
        </div>

        <Badge
          variant="outline"
          className="border-slate-200 bg-slate-50 text-xs text-slate-700"
        >
          {statusLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
          <p className="mb-1 text-xs text-slate-500">사용자 수</p>
          <p className="text-lg font-bold text-slate-900">
            {data.member_count}
            <span className="text-sm font-normal text-slate-400">
              /{data.seat_limit}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
          <p className="mb-1 text-xs text-slate-500">AI 분석 / 월</p>
          <p className="text-lg font-bold text-slate-900">
            {approxAnalyses}회
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            ({formatTokens(data.token_month)} tokens)
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
          <p className="mb-1 text-xs text-slate-500">기간</p>
          <p className="text-sm font-semibold text-slate-900">
            {toKRDate(data.ends_date)}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">만료일</p>
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

  const handleChange = async (
    plan_code: "free" | "pro" | "team" | "enterprise",
  ) => {
    if (!summary) return;
    if (plan_code === summary.plan_code && summary.subs_stat !== "canceled") {
      return;
    }

    setPending(plan_code);
    try {
      await changePlan.mutateAsync({ plan_code });
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
    return summary.subs_stat === "canceled"
      ? "해지 예약 상태에서도 다른 플랜 선택 시 즉시 활성 상태로 복구됩니다."
      : "플랜 변경은 즉시 적용됩니다.";
  }, [summary]);

  if (isLoading) {
    return (
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          플랜 선택
        </p>
        <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white p-6">
          <Loader2 size={20} className="animate-spin text-slate-400" />
        </div>
      </section>
    );
  }

  if (!plans?.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          플랜 선택
        </p>
        {planHint && <p className="text-[11px] text-slate-400">{planHint}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {plans.map((plan) => {
          const meta = PLAN_META[plan.plan_code] ?? { features: [] };
          const isCurrent = summary?.plan_code === plan.plan_code;
          const isBusy = pending === plan.plan_code;
          const isCanceledCurrent =
            isCurrent && summary?.subs_stat === "canceled";

          const seatsText =
            plan.seat_limt >= 999_999 ? "무제한" : `${plan.seat_limt}석`;
          const approxAnalyses =
            plan.plan_code === "enterprise"
              ? "대량"
              : `${approxAnalysesPerMonth(plan.tokn_mont)}회/월`;

          const metaAnalysesText = getMetaAnalysesText(meta.features);

          let buttonLabel = "이 플랜으로 변경";
          if (isCurrent && !isCanceledCurrent) buttonLabel = "현재 플랜";
          if (isCanceledCurrent) buttonLabel = "이 플랜 유지하기";

          return (
            <div
              key={plan.plan_idno}
              className={[
                "relative rounded-2xl border p-4 shadow-sm transition",
                meta.highlight
                  ? "border-blue-300 bg-blue-50"
                  : "border-slate-100 bg-white",
                isCurrent ? "ring-2 ring-blue-500" : "",
              ].join(" ")}
            >
              {meta.badge ? (
                <span className="absolute right-3 top-3 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {meta.badge}
                </span>
              ) : null}

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-black text-slate-900">
                      {plan.plan_name}
                    </p>
                    {isCurrent ? (
                      <span
                        className={`text-[11px] font-semibold ${
                          isCanceledCurrent
                            ? "text-amber-700"
                            : "text-blue-700"
                        }`}
                      >
                        {isCanceledCurrent ? "해지 예약됨" : "현재 사용 중"}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 flex gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {seatsText}
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 size={11} />{" "}
                      {metaAnalysesText
                        ? metaAnalysesText.replace("AI 분석 ", "")
                        : approxAnalyses}
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] text-slate-400">
                    제공량: {formatTokens(plan.tokn_mont)} tokens / 월 (내부
                    단위)
                  </p>
                </div>

                <ul className="space-y-1">
                  {meta.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-1.5 text-xs text-slate-700"
                    >
                      <Check
                        size={11}
                        className="mt-[2px] shrink-0 text-green-600"
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                {isAdmin ? (
                  <Button
                    size="sm"
                    variant={isCurrent && !isCanceledCurrent ? "outline" : "default"}
                    className="w-full"
                    disabled={(isCurrent && !isCanceledCurrent) || isBusy}
                    onClick={() =>
                      handleChange(
                        plan.plan_code as
                          | "free"
                          | "pro"
                          | "team"
                          | "enterprise",
                      )
                    }
                  >
                    {isBusy ? (
                      <Loader2 size={13} className="mr-1 animate-spin" />
                    ) : null}
                    {buttonLabel}
                  </Button>
                ) : (
                  <div
                    className={`w-full py-1 text-center text-xs font-medium ${
                      isCurrent ? "text-blue-600" : "text-slate-400"
                    }`}
                  >
                    {isCurrent ? "현재 플랜" : ""}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
// #endregion

// #region Cancel Dialog
function CancelSubscriptionDialog({
  open,
  onClose,
  endsDate,
}: {
  open: boolean;
  onClose: () => void;
  endsDate: Date | string | number | null | undefined;
}) {
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
              해지를 예약하면 <b>결제 기간 종료일까지</b>는 그대로 사용하실
              수 있습니다.
            </p>
            <p className="text-slate-600">
              종료일(<b>{toKRDate(endsDate)}</b>) 이후에는{" "}
              <b>무료 플랜으로 자동 전환</b>됩니다.
            </p>
            <p className="text-slate-600">
              기록된 데이터는 그대로 유지되며, 언제든 다시 업그레이드할 수
              있습니다.
            </p>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={loading}
            onClick={onClose}
          >
            닫기
          </Button>
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            disabled={loading}
            onClick={handleCancel}
          >
            {loading ? (
              <Loader2 size={14} className="mr-1 animate-spin" />
            ) : null}
            해지 예약하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// #endregion

// #region Resume Card
function CanceledSubscriptionNotice({
  endsDate,
  isAdmin,
}: {
  endsDate: Date | string | number | null | undefined;
  isAdmin: boolean;
}) {
  const utils = trpc.useUtils();
  const resumeSub = trpc.billing.resumeSubscription.useMutation();

  const handleResume = async () => {
    try {
      const res = await resumeSub.mutateAsync();
      await utils.billing.getSummary.invalidate();
      toast.success(res.message ?? "해지 예약이 취소되었습니다.");
    } catch (e) {
      handleApiError(e);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <XCircle size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">해지 예약됨</p>
            <p className="mt-0.5 text-amber-700">
              {endsDate
                ? `${toKRDate(
                    endsDate,
                  )} 결제 기간 종료 후 무료 플랜으로 전환됩니다.`
                : "결제 기간 종료 후 무료 플랜으로 전환됩니다."}
            </p>
          </div>
        </div>

        {isAdmin ? (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-amber-300 bg-white text-amber-800 hover:bg-amber-100 hover:text-amber-900"
            disabled={resumeSub.isPending}
            onClick={handleResume}
          >
            {resumeSub.isPending ? (
              <Loader2 size={14} className="mr-1 animate-spin" />
            ) : (
              <RotateCcw size={14} className="mr-1" />
            )}
            해지 예약 취소
          </Button>
        ) : null}
      </div>
    </div>
  );
}
// #endregion

// #region Page
export default function SettingsBilling() {
  const { companyRole } = useWorkspaceSwitcher();
  const { data: summary } = trpc.billing.getSummary.useQuery();

  const [downgradeOpen, setDowngradeOpen] = useState(false);

  const isAdmin = companyRole === "owner" || companyRole === "admin";
  const showCancelButton =
    isAdmin &&
    summary?.plan_code !== "free" &&
    summary?.subs_stat === "active";

  return (
    <PageShell size="sm">
      <div className="mb-6 flex items-center gap-2">
        <CreditCard size={20} className="text-slate-400" />
        <h1 className="text-lg font-black text-slate-900">플랜/결제</h1>
      </div>

      <div className="space-y-6">
        <SummaryCard />

        {summary?.subs_stat === "canceled" && (
          <CanceledSubscriptionNotice
            endsDate={summary?.ends_date}
            isAdmin={isAdmin}
          />
        )}

        <PlanCards />

        {showCancelButton && (
          <div className="border-t border-slate-100 pt-2">
            <button
              onClick={() => setDowngradeOpen(true)}
              className="text-xs text-slate-400 underline underline-offset-2 transition hover:text-red-500"
            >
              무료 플랜으로 전환 예약
            </button>
          </div>
        )}

        <p className="text-center text-xs text-slate-400">
          실제 결제 연동 전 체험판입니다. 플랜 변경은 즉시 적용됩니다.
        </p>
      </div>

      <CancelSubscriptionDialog
        open={downgradeOpen}
        onClose={() => setDowngradeOpen(false)}
        endsDate={summary?.ends_date}
      />
    </PageShell>
  );
}
// #endregion