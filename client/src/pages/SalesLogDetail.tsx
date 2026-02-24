import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft,
  Brain,
  Calendar,
  MapPin,
  User,
  Building2,
  Loader2,
  Trash2,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-slate-100 bg-white p-4",
        "shadow-[0_12px_32px_rgba(15,23,42,0.05)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
  tone = "blue",
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  tone?: "blue" | "sky" | "amber" | "violet";
}) {
  const styles =
    tone === "violet"
      ? { bg: "bg-violet-50", bd: "border-violet-100", fg: "text-violet-700" }
      : tone === "sky"
      ? { bg: "bg-sky-50", bd: "border-sky-100", fg: "text-sky-700" }
      : tone === "amber"
      ? { bg: "bg-amber-50", bd: "border-amber-100", fg: "text-amber-700" }
      : { bg: "bg-blue-50", bd: "border-blue-100", fg: "text-blue-700" };

  return (
    <div className="flex items-start gap-3">
      <div
        className={[
          "w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0",
          styles.bg,
          styles.bd,
        ].join(" ")}
      >
        <Icon size={16} className={styles.fg} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="text-sm font-bold text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function Chip({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "violet";
}) {
  const cls =
    tone === "violet"
      ? "bg-violet-50 border-violet-100 text-violet-700"
      : "bg-slate-50 border-slate-200 text-slate-600";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        cls,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

// ✅ 상단 배너 (분석중/완료/실패)
function TopBanner({
  state,
  message,
  onDismiss,
}: {
  state: "idle" | "pending" | "success" | "error";
  message?: string;
  onDismiss?: () => void;
}) {
  if (state === "idle") return null;

  if (state === "pending") {
    return (
      <div className="mb-3 rounded-3xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
          <Loader2 size={16} className="animate-spin" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900">AI 분석 중…</p>
          <p className="text-xs text-slate-600 mt-0.5">
            핵심 정보/다음 액션을 추출하고 있어요. 잠시만 기다려주세요.
          </p>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="mb-3 rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-3 flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <CheckCircle2 size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-900">AI 분석 완료</p>
          <p className="text-xs text-slate-600 mt-0.5">{message || "분석이 완료되었습니다."}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="w-9 h-9 rounded-2xl border border-emerald-100 bg-white/60 hover:bg-white transition flex items-center justify-center text-emerald-700"
            aria-label="배너 닫기"
          >
            <XCircle size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mb-3 rounded-3xl border border-red-100 bg-red-50 px-4 py-3 flex items-start gap-3">
      <div className="w-9 h-9 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
        <XCircle size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-slate-900">AI 분석 실패</p>
        <p className="text-xs text-slate-600 mt-0.5">{message || "잠시 후 다시 시도해주세요."}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="w-9 h-9 rounded-2xl border border-red-100 bg-white/60 hover:bg-white transition flex items-center justify-center text-red-700"
          aria-label="배너 닫기"
        >
          <XCircle size={16} />
        </button>
      )}
    </div>
  );
}

export default function SalesLogDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const logId = Number(id);

  const { data: log, isLoading, refetch } = trpc.salesLogs.get.useQuery({ id: logId });
  const analyzeMutation = trpc.salesLogs.analyze.useMutation();
  const deleteMutation = trpc.salesLogs.delete.useMutation();
  const utils = trpc.useUtils();

  // ✅ 배너 상태는 mutation 상태로 자동 결정 (별도 state 필요 없음)
  const bannerState: "idle" | "pending" | "success" | "error" = useMemo(() => {
    if (analyzeMutation.isPending) return "pending";
    if (analyzeMutation.isSuccess) return "success";
    if (analyzeMutation.isError) return "error";
    return "idle";
  }, [
    analyzeMutation.isPending,
    analyzeMutation.isSuccess,
    analyzeMutation.isError,
  ]);

  const bannerMessage = useMemo(() => {
    // analyzeMutation.data가 있으면 거기서 메시지 생성
    const d: any = analyzeMutation.data;
    if (!d) return undefined;
    return `일정 ${d.promisesCreated ?? 0}개가 자동 등록되었습니다.`;
  }, [analyzeMutation.data]);

  const handleAnalyze = async () => {
    try {
      const result = await analyzeMutation.mutateAsync({ id: logId });
      toast.success(`AI 분석 완료! 일정 ${result.promisesCreated}개가 자동 등록되었습니다.`);
      await refetch();
      utils.promises.list.invalidate();
      utils.dashboard.stats.invalidate();
    } catch {
      toast.error("AI 분석에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("영업일지를 삭제하시겠습니까?")) return;
    await deleteMutation.mutateAsync({ id: logId });
    utils.salesLogs.list.invalidate();
    utils.dashboard.stats.invalidate();
    toast.success("삭제되었습니다.");
    navigate("/sales-logs");
  };

  // ✅ 키워드 클릭 → 검색 페이지로 이동
  const goKeywordSearch = (kw: string) => {
    const q = encodeURIComponent(kw);
    navigate(`/sales-logs?search=${q}`);
  };

  if (isLoading)
    return (
      <div className="p-4 lg:p-6 max-w-2xl mx-auto">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-slate-100 bg-white p-4 animate-pulse"
              style={{ boxShadow: "0 12px 32px rgba(15,23,42,0.05)" }}
            >
              <div className="h-4 w-40 bg-slate-100 rounded mb-3" />
              <div className="h-3 w-full bg-slate-100 rounded mb-2" />
              <div className="h-3 w-2/3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );

  if (!log)
    return (
      <div className="p-4 lg:p-6 max-w-2xl mx-auto text-center py-16">
        <p className="text-slate-600">영업일지를 찾을 수 없습니다.</p>
        <Button variant="outline" className="mt-4 rounded-2xl" onClick={() => navigate("/sales-logs")}>
          목록으로
        </Button>
      </div>
    );

  const extracted = (log.aiExtracted ?? {}) as any;

  const title = log.clientName || "영업일지";
  const visitedLabel = new Date(log.visitedAt).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      {/* Sticky top bar */}
      <div
        className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 border-b"
        style={{
          background: "rgba(255,255,255,0.86)",
          borderColor: "rgba(15,23,42,0.08)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate("/sales-logs")}
              className="p-2 rounded-xl hover:bg-slate-50 transition text-slate-700"
              aria-label="뒤로"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="min-w-0">
              <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
                LOG DETAIL
              </p>
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-base sm:text-lg font-black text-slate-900 truncate">
                  {title}
                </h1>
                {log.isProcessed ? <Chip tone="violet">AI 완료</Chip> : <Chip>미분석</Chip>}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{visitedLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!log.isProcessed && (
              <button
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending}
                className={[
                  "inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-bold text-white transition",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
                style={{
                  background: "linear-gradient(135deg, rgba(139,92,246,1), rgba(37,99,235,1))",
                  boxShadow: "0 10px 24px rgba(99,102,241,0.18)",
                }}
              >
                {analyzeMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                AI 분석
              </button>
            )}

            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className={[
                "w-10 h-10 rounded-2xl border flex items-center justify-center transition",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "border-red-200 text-red-600 hover:bg-red-50",
              ].join(" ")}
              aria-label="삭제"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Banner (분석중/완료/실패) */}
      <div className="mt-4">
        <TopBanner
          state={bannerState}
          message={bannerMessage}
          onDismiss={
            bannerState === "success" || bannerState === "error"
              ? () => analyzeMutation.reset()
              : undefined
          }
        />
      </div>

      {/* Meta */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {log.clientName && (
            <MetaItem icon={Building2} label="고객사" value={log.clientName} tone="blue" />
          )}
          {log.contactPerson && (
            <MetaItem icon={User} label="담당자" value={log.contactPerson} tone="sky" />
          )}
          <MetaItem icon={Calendar} label="방문일시" value={visitedLabel} tone="amber" />
          {log.location && (
            <MetaItem icon={MapPin} label="장소" value={log.location} tone="violet" />
          )}
        </div>
      </Card>

      {/* AI Summary */}
      {log.aiSummary && (
        <div className="mt-4">
          <Card className="border-violet-100 bg-gradient-to-b from-violet-50/60 to-white">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center">
                  <Brain size={16} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">AI 요약</p>
                  <p className="text-xs text-slate-500">핵심 내용과 다음 액션을 정리했어요</p>
                </div>
              </div>

              {extracted?.amount ? (
                <span className="text-sm font-black text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-2xl">
                  {Number(extracted.amount).toLocaleString()}원
                </span>
              ) : null}
            </div>

            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
              {log.aiSummary}
            </p>

            {Array.isArray(extracted?.nextActions) && extracted.nextActions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-violet-100">
                <p className="text-xs font-extrabold tracking-[0.16em] text-violet-700 uppercase mb-2">
                  NEXT ACTIONS
                </p>
                <ul className="space-y-2">
                  {extracted.nextActions.map((action: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="w-6 text-right text-xs font-black text-violet-700 pt-0.5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ✅ 키워드 클릭 -> 검색으로 이동 */}
            {Array.isArray(extracted?.keywords) && extracted.keywords.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {extracted.keywords.map((kw: string) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => goKeywordSearch(kw)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-violet-100 text-violet-700 hover:bg-violet-50 transition"
                    title={`"${kw}"로 영업일지 검색`}
                  >
                    #{kw}
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Raw */}
      <div className="mt-4">
        <Card>
          <p className="text-sm font-black text-slate-900 mb-2">원문</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-600">
            {log.rawContent}
          </p>
        </Card>
      </div>

      {/* Transcript */}
      {log.transcribedText && log.transcribedText !== log.rawContent && (
        <div className="mt-4">
          <Card className="border-sky-100 bg-gradient-to-b from-sky-50/60 to-white">
            <p className="text-sm font-black text-slate-900 mb-2">음성 전사</p>
            <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
              {log.transcribedText}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}