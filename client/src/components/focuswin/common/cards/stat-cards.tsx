import { cn } from "@/lib/utils";

export type StatCard = {
  kicker: string;
  label: string;
  value: string;
  /** 선택: 값 옆에 붙는 소형 배지 (예: "+2건") */
  badge?: string;
};

/**
 * 공용 통계 카드 그리드 — 수주/납품 헤더에서 공통으로 사용
 * cards 배열 크기에 따라 2열 또는 3열 자동 설정
 */
export default function StatCards({
  cards,
  className,
}: {
  cards: StatCard[];
  className?: string;
}) {
  const cols =
    cards.length === 1
      ? "grid-cols-1"
      : cards.length === 3
      ? "grid-cols-3"
      : "grid-cols-2";

  return (
    <div className={cn("grid gap-2", cols, className)}>
      {cards.map((card) => (
        <div
          key={card.kicker}
          className="rounded-2xl border border-slate-100 bg-white px-3 py-2.5"
        >
          <p className="text-[10px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
            {card.kicker}
          </p>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <p className="text-base font-black text-slate-900">{card.value}</p>
            {card.badge && (
              <span className="text-[11px] font-bold text-blue-500">
                {card.badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
            {card.label}
          </p>
        </div>
      ))}
    </div>
  );
}
