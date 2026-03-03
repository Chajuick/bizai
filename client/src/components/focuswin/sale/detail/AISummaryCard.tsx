import {
  Brain,
  CalendarClock,
  CircleDollarSign,
  CheckCircle2,
} from "lucide-react";
import { Card } from "../../common/ui/card";
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
};

// #endregion

// #region Helpers

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
  if (owner === "client") return "고객사 과제";
  return "공동 과제";
}

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

export default function SaleDetailAISummaryCard({
  aiSummary,
  aiActions,
  pricing,
}: Props) {
  if (!aiSummary && aiActions.length === 0 && !pricing) return null;

  return (
    <Card
      className="
        relative overflow-hidden rounded-3xl
        bg-white p-6
        shadow-[0_14px_40px_rgba(15,23,42,0.08)]
        ring-1 ring-slate-200/70
      "
    >
      {/* #region Premium Background Layers */}
      {/* 상단 하이라이트 라인 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/60 to-transparent" />

      {/* 위->아래 은은 보라 워시 (촌스럽지 않게 아주 약하게) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-50/55 via-white to-white" />

      {/* 보라 글로우(아주 약한 코너 광) */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-200/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-fuchsia-200/12 blur-3xl" />

      {/* 미세 그레인(프리미엄 질감) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
        }}
      />
      {/* #endregion */}

      {/* #region Header */}
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="
              grid h-10 w-10 place-items-center rounded-2xl
              bg-gradient-to-b from-white to-violet-50/60
              text-violet-700
              ring-1 ring-violet-200/70
              shadow-[0_8px_18px_rgba(124,58,237,0.12)]
            "
          >
            <Brain size={18} />
          </div>

          <div>
            <p className="text-[15px] font-extrabold tracking-tight text-slate-900">
              AI 분석
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              미팅 핵심 요약과 후속 조치를 정리했어요
            </p>
          </div>
        </div>

        {aiActions.length > 0 && (
          <span
            className="
              mt-1 inline-flex items-center gap-2 rounded-full
              bg-white/70 px-3 py-1 text-xs font-semibold text-violet-700
              ring-1 ring-violet-200/70 backdrop-blur
              shadow-[0_8px_18px_rgba(2,6,23,0.06)]
            "
          >
            <CalendarClock size={14} />
            후속 {aiActions.length}건
          </span>
        )}
      </div>
      {/* #endregion */}

      {/* #region Summary */}
      {aiSummary && (
        <div
          className="
            relative mt-5 rounded-2xl
            bg-white/70 p-4
            ring-1 ring-slate-200/70 backdrop-blur
            shadow-[0_10px_22px_rgba(2,6,23,0.06)]
          "
        >
          {/* 패널 상단 미세 보라 라인 */}
          <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/70 to-transparent" />

          <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
            {aiSummary}
          </p>
        </div>
      )}
      {/* #endregion */}

      {/* #region Pricing */}
      {pricing && (pricing.primary || pricing.final || pricing.alternatives.length > 0) && (
        <div className="relative mt-6">
          <div className="mb-3 flex items-center gap-2">
            <CircleDollarSign size={15} className="text-violet-600" />
            <p className="text-sm font-bold text-slate-900">금액 정보</p>
          </div>

          <div
            className="
              overflow-hidden rounded-2xl
              bg-white/70 ring-1 ring-slate-200/70 backdrop-blur
              shadow-[0_10px_22px_rgba(2,6,23,0.06)]
            "
          >
            {/* 최종 합의가 (있을 때 최상단) */}
            {pricing.final && priceLine(pricing.final) && (
              <div className="flex items-start justify-between gap-3 border-b border-slate-200/60 px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-700">최종 합의</span>
                </div>
                <div className="text-right">
                  <p className="text-base font-extrabold text-emerald-700">
                    {priceLine(pricing.final)}
                  </p>
                  <div className="mt-0.5 flex justify-end gap-1 flex-wrap">
                    <Badge>{TYPE_LABEL[pricing.final.type]}</Badge>
                    {VAT_LABEL[pricing.final.vat] && <Badge>{VAT_LABEL[pricing.final.vat]}</Badge>}
                  </div>
                </div>
              </div>
            )}

            {/* 최초 제안가 */}
            {pricing.primary && priceLine(pricing.primary) && (
              <div className="flex items-start justify-between gap-3 border-b border-slate-200/60 px-4 py-3 last:border-b-0">
                <span className="text-xs font-semibold text-slate-500 mt-0.5">
                  {pricing.final ? "최초 제안" : "제안가"}
                </span>
                <div className="text-right">
                  <p className="text-base font-bold text-slate-800">
                    {priceLine(pricing.primary)}
                  </p>
                  <div className="mt-0.5 flex justify-end gap-1 flex-wrap">
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
                  className="flex items-start justify-between gap-3 border-b border-slate-200/60 px-4 py-3 last:border-b-0"
                >
                  <span className="text-xs font-semibold text-slate-400 mt-0.5">
                    {alt.label || `대안가 ${i + 1}`}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-600">{line}</p>
                    <div className="mt-0.5 flex justify-end gap-1 flex-wrap">
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
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-900">후속 조치</p>
          </div>

          <ul
            className="
              overflow-hidden rounded-2xl
              bg-white/70 ring-1 ring-slate-200/70 backdrop-blur
              shadow-[0_10px_22px_rgba(2,6,23,0.06)]
            "
          >
            {aiActions.map((a, i) => {
              const dateLabel = a.date ? formatKST(a.date) : "날짜 미정";

              return (
                <li key={a.key} className="group border-b border-slate-200/60 last:border-b-0">
                  <div
                    className="px-4 py-4 transition"
                  >
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 text-violet-700">
                          <span className="mr-2 text-violet-400">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {a.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {dateLabel}
                          <span className="mx-1.5 text-violet-900">· {ownerLabel(a.action_owner)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {a.desc && (
                      <p className="mt-3 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
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
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200/70">
      {children}
    </span>
  );
}

// #endregion

// #endregion