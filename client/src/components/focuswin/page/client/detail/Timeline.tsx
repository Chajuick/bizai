// client/src/components/focuswin/page/client/detail/Timeline.tsx

import { useMemo, useState } from "react";
import { Link } from "wouter";
import { BookOpen, Calendar, ShoppingCart, Package, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKRW } from "@/lib/format";
import type { useClientDetailVM } from "@/hooks/focuswin/client/useClientDetailVM";

// #region Types
type VM = ReturnType<typeof useClientDetailVM>;

type EventType = "sale" | "schedule" | "order" | "shipment" | "expense";

type TimelineEvent =
  | { type: "sale";     date: Date; id: number; summary: string }
  | { type: "schedule"; date: Date; id: number; name: string;   stat: string }
  | { type: "order";    date: Date; id: number; title: string;  amount: number; stat: string }
  | { type: "shipment"; date: Date; id: number; amount: number; stat: string }
  | { type: "expense";  date: Date; id: number; name: string;   amount: number; paym: string };
// #endregion

// #region Config
const TYPE_CONFIG: Record<EventType, { label: string; icon: React.ReactNode; dot: string; bg: string }> = {
  sale:     { label: "영업",   icon: <BookOpen  size={12} />, dot: "bg-blue-500",    bg: "bg-blue-50   text-blue-700"   },
  schedule: { label: "일정",   icon: <Calendar  size={12} />, dot: "bg-violet-500",  bg: "bg-violet-50 text-violet-700" },
  order:    { label: "수주",   icon: <ShoppingCart size={12} />, dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700" },
  shipment: { label: "납품",   icon: <Package   size={12} />, dot: "bg-orange-500",  bg: "bg-orange-50 text-orange-700" },
  expense:  { label: "지출",   icon: <Receipt   size={12} />, dot: "bg-rose-500",    bg: "bg-rose-50   text-rose-700"   },
};

const STAT_LABELS: Record<string, string> = {
  // 수주
  proposal:    "견적",
  negotiation: "협상",
  confirmed:   "확정",
  // 납품
  pending:     "준비",
  delivered:   "출하",
  invoiced:    "청구",
  paid:        "수금",
  // 일정
  scheduled:   "예정",
  completed:   "완료",
  canceled:    "취소",
  overdue:     "지연",
};
// #endregion

// #region Helpers
function fmtDate(d: Date) {
  return d.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }).replace(". ", ".").replace(".", "").replace(". ", ".");
}

function fmtDateFull(d: Date) {
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}
// #endregion

// #region Main Component
export default function ClientTimeline({ vm }: { vm: VM }) {
  const clieType = vm.client?.clie_type ?? "sales";
  const [filter, setFilter] = useState<EventType | "all">("all");

  // 허용 타입 (거래처 유형에 따라)
  const allowedTypes = useMemo((): EventType[] => {
    if (clieType === "sales")    return ["sale", "schedule", "order", "shipment"];
    if (clieType === "purchase") return ["sale", "schedule", "expense"];
    return ["sale", "schedule", "order", "shipment", "expense"];
  }, [clieType]);

  // 이벤트 병합
  const allEvents = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    for (const s of vm.logs) {
      if (s.vist_date) events.push({ type: "sale", date: new Date(s.vist_date), id: s.sale_idno, summary: s.aiex_summ || (s.orig_memo ? String(s.orig_memo).slice(0, 80) : "내용 없음") });
    }
    for (const s of vm.schedules) {
      if (s.sche_date) events.push({ type: "schedule", date: new Date(s.sche_date), id: s.sche_idno, name: s.sche_name, stat: s.sche_stat });
    }
    for (const o of vm.orders) {
      const d = o.ctrt_date ?? o.crea_date;
      if (d) events.push({ type: "order", date: new Date(d), id: o.orde_idno, title: o.prod_serv, amount: Number(o.orde_pric), stat: o.orde_stat });
    }
    for (const s of vm.shipments) {
      const d = s.ship_date ?? s.crea_date;
      if (d) events.push({ type: "shipment", date: new Date(d), id: s.ship_idno, amount: Number(s.ship_pric), stat: s.ship_stat });
    }
    for (const e of vm.expenses) {
      if (e.expe_date) events.push({ type: "expense", date: new Date(e.expe_date), id: e.expe_idno, name: e.expe_name, amount: Number(e.expe_amnt), paym: e.paym_meth });
    }

    return events
      .filter(e => allowedTypes.includes(e.type))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [vm.logs, vm.schedules, vm.orders, vm.shipments, vm.expenses, allowedTypes]);

  const filtered = useMemo(() =>
    filter === "all" ? allEvents : allEvents.filter(e => e.type === filter),
    [allEvents, filter]
  );

  const isLoading = vm.logsLoading || vm.schedulesLoading || vm.ordersLoading || vm.shipmentsLoading || vm.expensesLoading;

  // 타입별 카운트
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allEvents.length };
    for (const e of allEvents) c[e.type] = (c[e.type] ?? 0) + 1;
    return c;
  }, [allEvents]);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4" style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}>
      {/* 헤더 */}
      <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase mb-1">TIMELINE</p>
      <p className="text-sm font-black text-slate-900 mb-3">활동 히스토리</p>

      {/* 필터 탭 */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <FilterChip active={filter === "all"} count={counts.all} label="전체" onClick={() => setFilter("all")} />
        {allowedTypes.map(t => (
          <FilterChip
            key={t}
            active={filter === t}
            count={counts[t] ?? 0}
            label={TYPE_CONFIG[t].label}
            onClick={() => setFilter(t)}
            colorClass={TYPE_CONFIG[t].bg}
          />
        ))}
      </div>

      <div>
      {isLoading ? (
        <div className="space-y-3 pl-2 pt-1">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-3 bg-slate-100 rounded mt-0.5 shrink-0" />
              <div className="flex-1 h-3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="h-full flex items-center justify-center text-sm text-slate-400">활동 기록이 없어요.</div>
      ) : (
        <div className="relative">
          {/* 세로 선 */}
          <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-slate-100" />

          <div className="space-y-0">
            {filtered.map((event, i) => (
              <TimelineRow key={`${event.type}-${event.id}`} event={event} isLast={i === filtered.length - 1} />
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
// #endregion

// #region FilterChip
function FilterChip({ active, count, label, onClick, colorClass }: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
  colorClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors",
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      )}
    >
      {label}
      <span className={cn(
        "text-[10px] font-bold px-1 py-0.5 rounded-full leading-none",
        active ? "bg-white/20 text-white" : colorClass ?? "bg-slate-200 text-slate-500"
      )}>
        {count}
      </span>
    </button>
  );
}
// #endregion

// #region TimelineRow
function TimelineRow({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const cfg = TYPE_CONFIG[event.type];

  const content = (() => {
    switch (event.type) {
      case "sale":
        return (
          <Link href={`/sale-list/${event.id}`} className="group flex-1 min-w-0 flex items-center gap-2 hover:opacity-80">
            <span className="text-xs text-slate-700 line-clamp-1 flex-1">{event.summary}</span>
          </Link>
        );
      case "schedule":
        return (
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-xs text-slate-700 line-clamp-1 flex-1">{event.name}</span>
            <StatBadge stat={event.stat} type="schedule" />
          </div>
        );
      case "order":
        return (
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-xs text-slate-700 line-clamp-1 flex-1">{event.title}</span>
            <span className="text-xs font-semibold text-slate-600 shrink-0">{formatKRW(event.amount)}</span>
            <StatBadge stat={event.stat} type="order" />
          </div>
        );
      case "shipment":
        return (
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-xs text-slate-500 flex-1">납품</span>
            <span className="text-xs font-semibold text-slate-600 shrink-0">{formatKRW(event.amount)}</span>
            <StatBadge stat={event.stat} type="shipment" />
          </div>
        );
      case "expense":
        return (
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-xs text-slate-700 line-clamp-1 flex-1">{event.name}</span>
            <span className="text-xs font-semibold text-slate-600 shrink-0">{formatKRW(event.amount)}</span>
            <PayBadge paym={event.paym} />
          </div>
        );
    }
  })();

  return (
    <div className={cn("flex items-center gap-3 py-2", !isLast && "border-b border-slate-50")}>
      {/* 날짜 */}
      <span className="w-16 shrink-0 text-[11px] text-slate-400 text-right">{fmtDate(event.date)}</span>

      {/* 도트 + 아이콘 */}
      <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm bg-white">
        <div className={cn("h-2 w-2 rounded-full", cfg.dot)} />
      </div>

      {/* 타입 아이콘 */}
      <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]", cfg.bg)}>
        {cfg.icon}
      </div>

      {/* 내용 */}
      {content}
    </div>
  );
}
// #endregion

// #region Badges
function StatBadge({ stat, type }: { stat: string; type: "schedule" | "order" | "shipment" }) {
  const label = STAT_LABELS[stat] ?? stat;

  const color =
    stat === "completed" || stat === "paid" || stat === "confirmed"
      ? "bg-emerald-50 text-emerald-700"
      : stat === "canceled"
      ? "bg-slate-100 text-slate-400"
      : stat === "overdue"
      ? "bg-red-50 text-red-600"
      : stat === "delivered" || stat === "invoiced"
      ? "bg-orange-50 text-orange-700"
      : "bg-blue-50 text-blue-700";

  return (
    <span className={cn("shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full", color)}>
      {label}
    </span>
  );
}

function PayBadge({ paym }: { paym: string }) {
  const labels: Record<string, string> = { card: "카드", cash: "현금", transfer: "이체", other: "기타" };
  return (
    <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700">
      {labels[paym] ?? paym}
    </span>
  );
}
// #endregion
