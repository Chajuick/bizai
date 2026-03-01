import { useState } from "react";
import { AlertTriangle, BarChart3, Check, CreditCard, Loader2, Users, XCircle } from "lucide-react";
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
import PageShell from "@/components/focuswin/common/page-shell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useWorkspaceSwitcher } from "@/hooks/focuswin/company/useWorkspaceSwitcher";

// ─── 플랜별 마케팅 메타 ───────────────────────────────────────────────────────
const PLAN_META: Record<string, { badge?: string; highlight?: boolean; features: string[] }> = {
  free: {
    features: ["좌석 1개", "월 10,000 토큰", "기본 CRM"],
  },
  pro: {
    badge: "인기",
    highlight: true,
    features: ["좌석 1개", "월 200,000 토큰", "AI 분석", "음성 전사"],
  },
  team: {
    features: ["좌석 5개", "월 1,000,000 토큰", "팀 협업", "우선 지원"],
  },
  enterprise: {
    badge: "최고",
    features: ["무제한 좌석", "월 10,000,000 토큰", "전용 지원", "커스텀 계약"],
  },
};

const PLAN_LABEL: Record<string, string> = {
  active: "활성",
  trialing: "체험 중",
  canceled: "취소됨",
  past_due: "연체",
  inactive: "비활성",
};

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// ─── 현재 구독 카드 ───────────────────────────────────────────────────────────
function SummaryCard() {
  const { data, isLoading, error } = trpc.billing.getSummary.useQuery();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 flex items-center justify-center">
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

  const periodStr = `${new Date(data.star_date).toLocaleDateString("ko-KR")} ~ ${new Date(data.ends_date).toLocaleDateString("ko-KR")}`;

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">현재 플랜</p>
          <p className="text-xl font-black text-blue-900 mt-0.5">{data.plan_name}</p>
        </div>
        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-white">
          {PLAN_LABEL[data.subs_stat] ?? data.subs_stat}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">좌석</p>
          <p className="text-lg font-bold text-slate-900">
            {data.member_count}<span className="text-slate-400 text-sm font-normal">/{data.seat_limit}</span>
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">월 토큰</p>
          <p className="text-lg font-bold text-slate-900">{formatTokens(data.token_month)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">남은 좌석</p>
          <p className="text-lg font-bold text-slate-900">{data.remaining_seats}</p>
        </div>
      </div>

      <p className="text-xs text-blue-600">{periodStr}</p>
    </div>
  );
}

// ─── 플랜 카드 리스트 ─────────────────────────────────────────────────────────
function PlanCards() {
  const { data: summary } = trpc.billing.getSummary.useQuery();
  const { data: plans, isLoading } = trpc.billing.listPlans.useQuery();
  const { companyRole } = useWorkspaceSwitcher();
  const utils = trpc.useUtils();
  const changePlan = trpc.billing.changePlanFake.useMutation();
  const [pending, setPending] = useState<string | null>(null);

  const isAdmin = companyRole === "owner" || companyRole === "admin";

  const handleChange = async (plan_code: string) => {
    if (plan_code === summary?.plan_code) return;
    setPending(plan_code);
    try {
      await changePlan.mutateAsync({ plan_code: plan_code as "free" | "pro" | "team" | "enterprise" });
      await utils.billing.getSummary.invalidate();
      toast.success("플랜이 변경되었습니다.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "플랜 변경에 실패했습니다.";
      toast.error(msg);
    } finally {
      setPending(null);
    }
  };

  if (isLoading) return null;
  if (!plans?.length) return null;

  return (
    <section className="space-y-3">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">플랜 선택</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {plans.map((plan) => {
          const meta = PLAN_META[plan.plan_code] ?? { features: [] };
          const isCurrent = summary?.plan_code === plan.plan_code;
          const isLoading = pending === plan.plan_code;

          return (
            <div
              key={plan.plan_idno}
              className={`relative rounded-2xl border p-4 space-y-3 transition ${
                meta.highlight
                  ? "border-blue-300 bg-blue-50"
                  : "border-slate-100 bg-white"
              } ${isCurrent ? "ring-2 ring-blue-500" : ""}`}
            >
              {meta.badge && (
                <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white">
                  {meta.badge}
                </span>
              )}

              <div>
                <p className="font-bold text-slate-900">{plan.plan_name}</p>
                <div className="flex gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {plan.seat_limt >= 999_999 ? "무제한" : `${plan.seat_limt}석`}
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 size={11} /> {formatTokens(plan.tokn_mont)}/월
                  </span>
                </div>
              </div>

              <ul className="space-y-1">
                {meta.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Check size={11} className="text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              {isAdmin ? (
                <Button
                  size="sm"
                  variant={isCurrent ? "outline" : "default"}
                  className="w-full"
                  disabled={isCurrent || isLoading}
                  onClick={() => handleChange(plan.plan_code)}
                >
                  {isLoading ? (
                    <Loader2 size={13} className="animate-spin mr-1" />
                  ) : null}
                  {isCurrent ? "현재 플랜" : "이 플랜으로 변경"}
                </Button>
              ) : (
                <div className={`w-full text-center text-xs py-1 font-medium ${isCurrent ? "text-blue-600" : "text-slate-400"}`}>
                  {isCurrent ? "현재 플랜" : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── 해지 다이얼로그 ──────────────────────────────────────────────────────────
function CancelDialog({
  open,
  onClose,
  endsDate,
}: {
  open: boolean;
  onClose: () => void;
  endsDate: Date | null;
}) {
  const utils = trpc.useUtils();
  const cancelSub = trpc.billing.cancelSubscription.useMutation();
  const changePlan = trpc.billing.changePlanFake.useMutation();
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      await cancelSub.mutateAsync();
      await utils.billing.getSummary.invalidate();
      toast.success("플랜이 해지 예약되었습니다.");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "해지에 실패했습니다.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDowngradeFree = async () => {
    setLoading(true);
    try {
      await changePlan.mutateAsync({ plan_code: "free" });
      await utils.billing.getSummary.invalidate();
      toast.success("무료 플랜으로 전환되었습니다.");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "플랜 변경에 실패했습니다.";
      toast.error(msg);
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
            플랜 해지
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-1">
            <p>플랜을 해지하면 AI 분석과 자동 일정 기능이 제한됩니다.</p>
            {endsDate && (
              <p className="text-slate-600">
                현재 결제 기간 종료일{" "}
                <span className="font-semibold text-slate-800">
                  {new Date(endsDate).toLocaleDateString("ko-KR")}
                </span>
                까지는 계속 사용하실 수 있습니다.
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={loading}
            onClick={handleDowngradeFree}
          >
            {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            해지 대신 무료로 전환
          </Button>
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            disabled={loading}
            onClick={handleCancel}
          >
            {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            해지 확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 페이지 ───────────────────────────────────────────────────────────────────
export default function SettingsBilling() {
  const { companyRole } = useWorkspaceSwitcher();
  const { data: summary } = trpc.billing.getSummary.useQuery();
  const [cancelOpen, setCancelOpen] = useState(false);

  const isAdmin = companyRole === "owner" || companyRole === "admin";
  const showCancelButton =
    isAdmin &&
    summary?.subs_stat === "active" &&
    summary?.plan_code !== "free";

  return (
    <PageShell size="sm">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard size={20} className="text-slate-400" />
        <h1 className="text-lg font-bold text-slate-900">플랜/결제</h1>
      </div>

      <div className="space-y-6">
        <SummaryCard />

        {/* 해지 예약됨 안내 */}
        {summary?.subs_stat === "canceled" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <XCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">해지 예약됨</p>
              <p className="text-amber-700 mt-0.5">
                {summary.ends_date
                  ? `${new Date(summary.ends_date).toLocaleDateString("ko-KR")} 결제 기간 종료 후 무료 플랜으로 전환됩니다.`
                  : "결제 기간 종료 후 무료 플랜으로 전환됩니다."}
              </p>
            </div>
          </div>
        )}

        <PlanCards />

        {/* 해지 버튼 */}
        {showCancelButton && (
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setCancelOpen(true)}
              className="text-xs text-slate-400 hover:text-red-500 transition underline underline-offset-2"
            >
              플랜 해지
            </button>
          </div>
        )}

        <p className="text-xs text-slate-400 text-center">
          실제 결제 연동 전 체험판입니다. 플랜 변경은 즉시 적용됩니다.
        </p>
      </div>

      <CancelDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        endsDate={summary?.ends_date ? new Date(summary.ends_date) : null}
      />
    </PageShell>
  );
}
