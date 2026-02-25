import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function SalesLogNewBanner({
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
          <p className="text-sm font-black text-slate-900">저장 & AI 분석 중…</p>
          <p className="text-xs text-slate-600 mt-0.5">일정/금액/다음 액션을 추출하고 있어요.</p>
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
          <p className="text-xs text-slate-600 mt-0.5">{message || "완료되었습니다."}</p>
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
        <p className="text-xs text-slate-600 mt-0.5">{message || "나중에 다시 시도해주세요."}</p>
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