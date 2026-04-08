// client/src/components/focuswin/page/sale/detail/AIReviewCard.tsx
// AI 분석 결과 검토 카드 — needs_review 상태에서 표시

import { Brain, CalendarClock, CircleDollarSign, Check, Sparkles, ChevronRight } from "lucide-react";
import { Card } from "@/components/focuswin/common/ui/card";
import { cn } from "@/lib/utils";
import type { AiCorePricing, AiCorePricingEntry } from "@/types/ai";
import type { AiActionUI } from "./AISummaryCard";

// #region Types

type Props = {
  aiSummary: string | null;
  aiActions: AiActionUI[];
  pricing: AiCorePricing;
  confidence?: number | null;
  // review state
  checkedKeys: Set<string>;
  onToggleKey: (key: string) => void;
  applyPricing: boolean;
  onTogglePricing: () => void;
  onApply: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
};

// #endregion

// #region Pricing Helpers

function formatKRW(n: number): string {
  if (n >= 100_000_000) {
    const v = n / 100_000_000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}억원`;
  }
  if (n >= 10_000) {
    const v = Math.round(n / 10_000);
    return `${v.toLocaleString()}만원`;
  }
  return `${n.toLocaleString()}원`;
}

function getPriceDisplay(pricing: AiCorePricing): { line: string; entry: AiCorePricingEntry } | null {
  const entry = pricing?.final ?? pricing?.primary ?? null;
  if (!entry) return null;
  const amount = entry.amount ?? entry.min ?? null;
  if (amount == null) return null;
  const approx = entry.approximate ? "약 " : "";
  return { line: approx + formatKRW(amount), entry };
}

function formatKST(date: string) {
  return new Date(date).toLocaleString("ko-KR", {
    month: "long", day: "numeric", weekday: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function ownerLabel(owner: AiActionUI["action_owner"]) {
  if (owner === "self") return "자사 과제";
  if (owner === "client") return "거래처 과제";
  return "공동 과제";
}

// #endregion

// #region Component

export default function AIReviewCard({
  aiSummary, aiActions, pricing, confidence,
  checkedKeys, onToggleKey, applyPricing, onTogglePricing,
  onApply, onSkip, isSubmitting,
}: Props) {
  const priceInfo = getPriceDisplay(pricing);
  const schedulableActions = aiActions.filter(a => a.date);
  const checkedCount = schedulableActions.filter(a => checkedKeys.has(a.key)).length;

  return (
    <Card className="relative overflow-hidden rounded-[28px] bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)] ring-1 ring-amber-200/60">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/40 via-white to-white" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-200/15 blur-3xl" />

      {/* Header */}
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
            <Brain size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[17px] font-bold tracking-tight text-slate-900">AI 분석 결과</p>
              <span className="inline-flex h-6 items-center gap-1 rounded-full bg-amber-100 px-2.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200/80">
                <Sparkles size={10} />
                검토 대기
              </span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
              결과를 확인하고 반영할 항목을 선택하세요
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      {aiSummary && (
        <div className="relative mt-5 rounded-3xl bg-white p-4 ring-1 ring-slate-200/80">
          <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/60 to-transparent" />
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">AI 요약</p>
          <p className="whitespace-pre-wrap text-[14px] leading-7 text-slate-800">{aiSummary}</p>
        </div>
      )}

      {/* Pricing toggle */}
      {priceInfo && (
        <div className="relative mt-5">
          <p className="mb-2 flex items-center gap-1.5 px-1 text-sm font-bold text-slate-900">
            <CircleDollarSign size={15} className="text-amber-500" />
            금액 반영
          </p>
          <button
            type="button"
            onClick={onTogglePricing}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 transition-all",
              applyPricing
                ? "border-emerald-200 bg-emerald-50 ring-1 ring-emerald-200/60"
                : "border-slate-200 bg-white hover:bg-slate-50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
                applyPricing ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white"
              )}>
                {applyPricing && <Check size={11} className="text-white" />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{priceInfo.line}</p>
                <p className="text-[11px] text-slate-400">수주 금액에 반영</p>
              </div>
            </div>
            {priceInfo.entry.vat !== "unknown" && (
              <span className="text-[10px] font-semibold text-slate-400">
                {priceInfo.entry.vat === "excluded" ? "VAT 별도" : "VAT 포함"}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Appointments */}
      {schedulableActions.length > 0 && (
        <div className="relative mt-5">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
              <CalendarClock size={15} className="text-amber-500" />
              일정 등록
            </p>
            <span className="text-[11px] font-semibold text-slate-400">
              {checkedCount}/{schedulableActions.length}건 선택됨
            </span>
          </div>

          <ul className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/80">
            {schedulableActions.map((a, i) => {
              const checked = checkedKeys.has(a.key);
              return (
                <li key={a.key} className="border-b border-slate-200/70 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onToggleKey(a.key)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors",
                      checked ? "bg-violet-50/60 hover:bg-violet-50" : "hover:bg-slate-50/60"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      checked ? "border-violet-500 bg-violet-500" : "border-slate-300 bg-white"
                    )}>
                      {checked && <Check size={11} className="text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "truncate text-sm font-semibold",
                        checked ? "text-violet-700" : "text-slate-700"
                      )}>
                        <span className="mr-2 text-xs text-slate-400">{String(i + 1).padStart(2, "0")}</span>
                        {a.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {a.date ? formatKST(a.date) : "날짜 미정"}
                        <span className="mx-1.5 text-slate-300">·</span>
                        {ownerLabel(a.action_owner)}
                      </p>
                      {a.desc && (
                        <p className="mt-1 text-[12px] leading-relaxed text-slate-500 line-clamp-2">{a.desc}</p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* no-date actions */}
          {aiActions.filter(a => !a.date).length > 0 && (
            <p className="mt-2 px-1 text-[11px] text-slate-400">
              * 날짜 미정 항목 {aiActions.filter(a => !a.date).length}건은 일정 등록에서 제외됩니다.
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="relative mt-6 flex items-center gap-2">
        <button
          type="button"
          onClick={onApply}
          disabled={isSubmitting}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-all",
            "bg-violet-600 text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)] hover:bg-violet-700",
            isSubmitting && "opacity-60"
          )}
        >
          <Check size={15} />
          {checkedCount > 0 || applyPricing ? `${checkedCount}건 일정 등록${applyPricing && priceInfo ? " + 금액 반영" : ""}` : "검토 완료"}
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={isSubmitting}
          className="flex items-center gap-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all"
        >
          건너뛰기
          <ChevronRight size={13} />
        </button>
      </div>
    </Card>
  );
}

// #endregion
