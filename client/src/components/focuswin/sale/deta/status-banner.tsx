import React from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export type BannerState = "idle" | "pending" | "success" | "error";

export default function StatusBanner({
  state,
  title,
  message,
  onDismiss,
}: {
  state: BannerState;
  title?: string;
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
          <p className="text-sm font-black text-slate-900">{title ?? "처리 중…"}</p>
          <p className="text-xs text-slate-600 mt-0.5">
            {message ?? "잠시만 기다려주세요."}
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
          <p className="text-sm font-black text-slate-900">{title ?? "완료"}</p>
          <p className="text-xs text-slate-600 mt-0.5">{message ?? "완료되었습니다."}</p>
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
        <p className="text-sm font-black text-slate-900">{title ?? "실패"}</p>
        <p className="text-xs text-slate-600 mt-0.5">
          {message ?? "잠시 후 다시 시도해주세요."}
        </p>
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