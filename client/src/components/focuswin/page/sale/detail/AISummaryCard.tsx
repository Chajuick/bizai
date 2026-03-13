import { Brain, CalendarClock, CircleDollarSign, CheckCircle2, Check, Sparkles } from "lucide-react";

import { Card } from "@/components/focuswin/common/ui/card";
import type { AiCorePricing, AiCorePricingEntry } from "@/types/ai";

// #region Types

export type AiActionUI = {
  key: string;
  title: string;
  date: string | null;
  desc: string;
  action_owner: "self" | "client" | "shared";

  status: "created" | "pending" | "no-date";
  sche_idno?: number;
};

type Props = {
  aiSummary: string | null;
  aiActions: AiActionUI[];
  pricing: AiCorePricing;
  confidence?: number | null;
};

// #endregion

// #region Helpers

/**
 * 요약/일정/금액이 실제로 구조화되었는지 보여주는 작은 신호 목록
 * - 사용자가 "왜 신뢰 높음인지" 직관적으로 이해할 수 있게 함
 */
function extractedSignals(pricing: AiCorePricing, aiActions: AiActionUI[], aiSummary: string | null) {
  return [
    { key: "summary", label: "요약", ok: !!aiSummary?.trim() },
    { key: "action", label: "일정", ok: aiActions.length > 0 },
    {
      key: "price",
      label: "금액",
      ok: !!(pricing?.primary || pricing?.final || pricing?.alternatives?.length),
    },
  ];
}

/**
 * 추출 신뢰도 배지의 톤 정의
 * - 너무 "정답/오답"처럼 보이지 않게
 * - 전체 카드의 보라 톤과 자연스럽게 어울리도록 설계
 */
function confidenceTone(conf?: number | null) {
  if (conf == null) {
    return {
      label: "신뢰 정보 없음",
      text: "text-slate-500",
      bg: "bg-slate-50",
      ring: "ring-slate-200/80",
      icon: "text-slate-400",
    };
  }

  if (conf >= 0.75) {
    return {
      label: "AI 추출 신뢰 높음",
      text: "text-violet-700",
      bg: "bg-violet-50",
      ring: "ring-violet-200/80",
      icon: "text-violet-500",
    };
  }

  if (conf >= 0.4) {
    return {
      label: "AI 추출 신뢰 보통",
      text: "text-amber-700",
      bg: "bg-amber-50",
      ring: "ring-amber-200/80",
      icon: "text-amber-500",
    };
  }

  return {
    label: "AI 추출 신뢰 낮음",
    text: "text-rose-700",
    bg: "bg-rose-50",
    ring: "ring-rose-200/80",
    icon: "text-rose-500",
  };
}

function formatKST(date: string) {
  return new Date(date).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ownerLabel(owner: AiActionUI["action_owner"]) {
  if (owner === "self") return "자사 과제";
  if (owner === "client") return "거래처 과제";
  return "공동 과제";
}

function confidenceLabel(value: number) {
  if (value >= 0.85) return "90%+";
  if (value >= 0.7) return "70%+";
  if (value >= 0.5) return "50%+";
  return "낮음";
}

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

const TYPE_LABEL: Record<AiCorePricingEntry["type"], string> = {
  one_time: "일시불",
  monthly: "월 단위",
  yearly: "연 단위",
};

const VAT_LABEL: Record<AiCorePricingEntry["vat"], string> = {
  included: "VAT 포함",
  excluded: "VAT 별도",
  unknown: "",
};

function priceLine(e: AiCorePricingEntry): string {
  if (e.amount != null) {
    return (e.approximate ? "약 " : "") + formatKRW(e.amount) + (e.inferred ? " (추정)" : "");
  }

  if (e.min != null || e.max != null) {
    const lo = e.min != null ? formatKRW(e.min) : "?";
    const hi = e.max != null ? formatKRW(e.max) : "?";
    return `${lo} ~ ${hi}`;
  }

  return "";
}

// #endregion

// #region Component

export default function SaleDetailAISummaryCard({ aiSummary, aiActions, pricing, confidence }: Props) {
  if (!aiSummary && aiActions.length === 0 && !pricing) return null;

  const signals = extractedSignals(pricing, aiActions, aiSummary);

  return (
    <Card
      className="
        relative overflow-hidden rounded-[28px]
        bg-white p-6
        shadow-[0_12px_32px_rgba(15,23,42,0.06)]
        ring-1 ring-slate-200/80
      "
    >
      {/* #region Premium Background Layers */}
      {/* 상단 하이라이트 라인 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/70 to-transparent" />

      {/* 상단에서 아래로 흐르는 아주 약한 보라 워시 */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-50/45 via-white to-white" />

      {/* 코너 글로우 */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-200/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-fuchsia-200/10 blur-3xl" />
      {/* #endregion */}

      {/* #region Header */}
      <div className="relative">
        {/* 상단 타이틀 + AI 신뢰도 chip */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                grid h-11 w-11 place-items-center rounded-2xl
                bg-violet-50 text-violet-700
                ring-1 ring-violet-100
              "
            >
              <Brain size={18} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[17px] font-bold tracking-tight text-slate-900">AI 분석</p>
                {confidence != null && <ConfidenceBadge value={confidence} />}
              </div>

              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                미팅 핵심 요약과 후속 조치를 정리했어요
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* #endregion */}

      {/* #region Summary */}
      {aiSummary && (
        <div
          className="
            relative mt-5 rounded-3xl
            bg-white p-4
            ring-1 ring-slate-200/80
          "
        >
          {/* 패널 상단 미세 라인 */}
          <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/70 to-transparent" />

          {/* 구조화 신호 */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {signals
              .filter(s => s.ok)
              .map(s => (
                <span
                  key={s.key}
                  className="
                    inline-flex items-center gap-1 rounded-full
                    bg-white px-2.5 py-1
                    text-[11px] font-medium text-slate-600
                    ring-1 ring-slate-200/80
                  "
                >
                  <Check size={11} className="text-violet-500" />
                  {s.label} 인식
                </span>
              ))}
          </div>

          <p className="whitespace-pre-wrap text-[15px] leading-8 text-slate-800">{aiSummary}</p>
        </div>
      )}
      {/* #endregion */}

      {/* #region Pricing */}
      {pricing && (pricing.primary || pricing.final || pricing.alternatives.length > 0) && (
        <div className="relative mt-6">
          <div className="mb-3 flex items-center gap-2 px-1">
            <CircleDollarSign size={15} className="text-violet-600" />
            <p className="text-sm font-bold text-slate-900">금액 정보</p>
          </div>

          <div
            className="
              overflow-hidden rounded-3xl
              bg-white
              ring-1 ring-slate-200/80
            "
          >
            {/* 최종 합의가 */}
            {pricing.final && priceLine(pricing.final) && (
              <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 px-4 py-3.5">
                <div className="min-w-0 flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-700">최종 합의</span>
                </div>

                <div className="text-right">
                  <p className="text-base font-extrabold text-emerald-700">{priceLine(pricing.final)}</p>
                  <div className="mt-1 flex flex-wrap justify-end gap-1">
                    <Badge>{TYPE_LABEL[pricing.final.type]}</Badge>
                    {VAT_LABEL[pricing.final.vat] && <Badge>{VAT_LABEL[pricing.final.vat]}</Badge>}
                  </div>
                </div>
              </div>
            )}

            {/* 제안가 */}
            {pricing.primary && priceLine(pricing.primary) && (
              <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 px-4 py-3.5 last:border-b-0">
                <span className="mt-0.5 text-xs font-semibold text-slate-500">
                  {pricing.final ? "최초 제안" : "제안가"}
                </span>

                <div className="text-right">
                  <p className="text-base font-bold text-slate-800">{priceLine(pricing.primary)}</p>
                  <div className="mt-1 flex flex-wrap justify-end gap-1">
                    <Badge>{TYPE_LABEL[pricing.primary.type]}</Badge>
                    {VAT_LABEL[pricing.primary.vat] && <Badge>{VAT_LABEL[pricing.primary.vat]}</Badge>}
                  </div>
                </div>
              </div>
            )}

            {/* 대안가 목록 */}
            {pricing.alternatives.map((alt, i) => {
              const line = priceLine(alt);
              if (!line) return null;

              return (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 border-b border-slate-200/70 px-4 py-3.5 last:border-b-0"
                >
                  <span className="mt-0.5 text-xs font-semibold text-slate-400">
                    {alt.label || `대안가 ${i + 1}`}
                  </span>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-600">{line}</p>
                    <div className="mt-1 flex flex-wrap justify-end gap-1">
                      <Badge>{TYPE_LABEL[alt.type]}</Badge>
                      {VAT_LABEL[alt.vat] && <Badge>{VAT_LABEL[alt.vat]}</Badge>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* #endregion */}

      {/* #region Actions */}
      {aiActions.length > 0 && (
        <div className="relative mt-6">
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">후속 조치</p>
              <ActionCountChip count={aiActions.length} />
            </div>
          </div>

          <ul
            className="
              overflow-hidden rounded-3xl
              bg-white
              ring-1 ring-slate-200/80
            "
          >
            {aiActions.map((a, i) => {
              const dateLabel = a.date ? formatKST(a.date) : "날짜 미정";

              return (
                <li key={a.key} className="group border-b border-slate-200/70 last:border-b-0">
                  <div className="px-4 py-4 transition-colors group-hover:bg-slate-50/60">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-violet-700">
                          <span className="mr-2 text-violet-400">{String(i + 1).padStart(2, "0")}</span>
                          {a.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {dateLabel}
                          <span className="mx-1.5 text-slate-300">·</span>
                          <span className="text-violet-700">{ownerLabel(a.action_owner)}</span>
                        </p>
                      </div>
                    </div>

                    {a.desc && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {a.desc}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {/* #endregion */}
    </Card>
  );
}

// #endregion

// #region Internal UI Helpers

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="
        inline-flex items-center rounded-full
        bg-slate-50 px-2 py-0.5
        text-[10px] font-semibold text-slate-500
        ring-1 ring-slate-200/70
      "
    >
      {children}
    </span>
  );
}

/**
 * 추출 신뢰 배지
 * - AI 분석 타이틀 옆에 붙는 chip
 * - 토스 스타일처럼 작고 단정한 보조 정보로 표현
 */
function ConfidenceBadge({ value }: { value: number }) {
  const tone = confidenceTone(value);

  return (
    <span
      className={`
        inline-flex h-7 items-center gap-1.5 rounded-full
        px-2.5 text-[11px] font-semibold
        ring-1 ${tone.bg} ${tone.text} ${tone.ring}
      `}
    >
      <Sparkles size={12} className={tone.icon} />
      <span>{tone.label}</span>
      <span className="opacity-60">{confidenceLabel(value)}</span>
    </span>
  );
}

/**
 * 후속 조치 개수 chip
 * - "후속 조치" 제목 옆 보조 배지
 * - 강조는 하되 과하게 튀지 않게 보라 연톤 사용
 */
function ActionCountChip({ count }: { count: number }) {
  return (
    <span
      className="
        inline-flex h-7 items-center gap-1.5 rounded-full
        bg-violet-50 px-2.5
        text-[11px] font-semibold text-violet-700
        ring-1 ring-violet-200/80
      "
    >
      <CalendarClock size={12} />
      후속 {count}건
    </span>
  );
}

// #endregion