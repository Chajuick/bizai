import { cn } from "@/lib/utils";

export type StatCard = {
  kicker: string;
  label: string;
  value: string;
  /** 선택: 값 옆에 붙는 소형 배지 (예: "+2건") */
  badge?: string;
  /** 선택: 값 색상 강조 */
  tone?: "warning" | "danger" | "success";
};

/**
 * 공용 통계 카드 그리드 — 공통으로 사용
 * 단일 컨테이너 + 내부 divider 방식으로 compact하게 표시
 */
export default function StatCards({
  cards,
  className,
}: {
  cards: StatCard[];
  className?: string;
}) {
  return (
    <div className={cn("flex rounded-xl border border-slate-100 bg-white overflow-hidden", className)}>
      {cards.map((card, i) => (
        <div
          key={card.kicker}
          className={cn(
            "flex-1 px-3 py-2",
            i > 0 && "border-l border-slate-100"
          )}
        >
          <p className="text-[10px] font-semibold text-slate-400">
            {card.kicker}
          </p>
          <div className="mt-0.5 flex items-baseline gap-1">
            <p className={cn(
              "text-sm font-black leading-none",
              card.tone === "warning" ? "text-orange-500" :
              card.tone === "danger"  ? "text-red-500" :
              card.tone === "success" ? "text-emerald-600" :
              "text-slate-900"
            )}>{card.value}</p>
            {card.badge && (
              <span className="text-[10px] font-bold text-blue-500">{card.badge}</span>
            )}
          </div>
          {card.label ? (
            <p className="mt-0.5 text-[10px] font-medium text-slate-400 leading-none">
              {card.label}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
