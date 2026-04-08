// client/src/components/focuswin/page/dashboard/DashboardCalendar.tsx
// 대시보드 전사 캘린더 뷰 — 영업/일정/수주/납품/지출 통합

import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKRW } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import type { RouterOutputs } from "@/types";

// #region Types
type CalEvent = RouterOutputs["crm"]["dashboard"]["calendarEvents"][number];
type EventType = CalEvent["type"];
// #endregion

// #region Config
const TYPE_CFG: Record<EventType, { label: string; dot: string; chip: string; path: string }> = {
  sale:     { label: "영업",  dot: "bg-blue-500",    chip: "bg-blue-50 text-blue-700 border-blue-100",     path: "/sale-list" },
  schedule: { label: "일정",  dot: "bg-violet-500",  chip: "bg-violet-50 text-violet-700 border-violet-100", path: "/sche-list" },
  order:    { label: "수주",  dot: "bg-amber-500",   chip: "bg-amber-50 text-amber-700 border-amber-100",   path: "/orde-list" },
  shipment: { label: "납품",  dot: "bg-orange-500",  chip: "bg-orange-50 text-orange-700 border-orange-100", path: "/ship-list" },
  expense:  { label: "지출",  dot: "bg-rose-500",    chip: "bg-rose-50 text-rose-700 border-rose-100",     path: "/expe-list" },
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
// #endregion

// #region Helpers
function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=일
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // 6주 고정 (42칸)
  while (days.length < 42) days.push(null);
  return days;
}

function eventPath(e: CalEvent) {
  return `${TYPE_CFG[e.type].path}/${e.id}`;
}
// #endregion

const ALL_TYPES = Object.keys(TYPE_CFG) as EventType[];

export default function DashboardCalendar() {
  const [, navigate] = useLocation();
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selected, setSelected] = useState<number | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<EventType>>(new Set(ALL_TYPES));

  const toggleType = (type: EventType) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size === 1) return prev; // 최소 1개는 유지
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
    setSelected(null);
  };

  const { data: rawEvents = [], isLoading } = trpc.crm.dashboard.calendarEvents.useQuery(
    { year, month },
    { staleTime: 60_000 }
  );

  // 필터 적용
  const events = useMemo(
    () => rawEvents.filter(e => activeTypes.has(e.type)),
    [rawEvents, activeTypes]
  );

  // 날짜별 이벤트 맵
  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalEvent[]>();
    for (const e of events) {
      const d = new Date(e.date).getDate();
      const arr = map.get(d) ?? [];
      arr.push(e);
      map.set(d, arr);
    }
    return map;
  }, [events]);

  const days = useMemo(() => buildCalendarDays(year, month), [year, month]);

  const selectedEvents = selected ? (eventsByDay.get(selected) ?? []) : [];

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelected(null);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelected(null);
  }

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더: 월 네비게이션 + 범례 */}
      <div className="flex flex-col items-start  gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={prevMonth}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition">
            <ChevronLeft size={14} className="text-slate-600" />
          </button>
          <span className="text-base font-black text-slate-900 min-w-[80px] text-center">
            {year}년 {month}월
          </span>
          <button type="button" onClick={nextMonth}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition">
            <ChevronRight size={14} className="text-slate-600" />
          </button>
        </div>

        {/* 필터 칩 */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {ALL_TYPES.map(type => {
            const cfg = TYPE_CFG[type];
            const active = activeTypes.has(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border transition-all",
                  active
                    ? cn(cfg.chip, "opacity-100")
                    : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", active ? cfg.dot : "bg-slate-300")} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 캘린더 그리드 */}
      <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white"
           style={{ boxShadow: "0 4px 16px rgba(15,23,42,0.04)" }}>
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={cn(
              "py-2 text-center text-[11px] font-bold",
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-slate-400"
            )}>
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 셀 */}
        {isLoading ? (
          <div className="grid grid-cols-7">
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="h-10 sm:h-[96px] border-b border-r border-slate-50 animate-pulse bg-slate-50/40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dayEvents = day ? (eventsByDay.get(day) ?? []) : [];
              const isSelected = day === selected;
              const isSun = idx % 7 === 0;
              const isSat = idx % 7 === 6;
              const MAX_VISIBLE = 3;
              const overflow = dayEvents.length - MAX_VISIBLE;

              return (
                <div
                  key={idx}
                  onClick={() => day && setSelected(isSelected ? null : day)}
                  className={cn(
                    // 모바일: 작은 고정 높이 / PC: 넉넉한 고정 높이
                    "h-10 sm:h-[96px] border-b border-r border-slate-50 transition-colors",
                    "p-1 sm:p-1.5 overflow-hidden",
                    day ? "cursor-pointer" : "bg-slate-50/30",
                    isSelected && "bg-blue-50/60",
                    day && !isSelected && "hover:bg-slate-50/80"
                  )}
                >
                  {day && (
                    <>
                      {/* 날짜 숫자 + 초과 카운트 */}
                      <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
                        <div className={cn(
                          "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold shrink-0",
                          "text-[10px] sm:text-xs",
                          isToday(day)
                            ? "bg-blue-500 text-white"
                            : isSun ? "text-red-400"
                            : isSat ? "text-blue-400"
                            : "text-slate-700"
                        )}>
                          {day}
                        </div>
                        {overflow > 0 && (
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 leading-none">
                            +{overflow}
                          </span>
                        )}
                      </div>

                      {/* 모바일: 도트만 */}
                      {dayEvents.length > 0 && (
                        <div className="flex sm:hidden gap-0.5 flex-wrap">
                          {dayEvents.slice(0, 3).map(e => (
                            <span key={`${e.type}-${e.id}`}
                              className={cn("w-1.5 h-1.5 rounded-full shrink-0", TYPE_CFG[e.type].dot)} />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                          )}
                        </div>
                      )}

                      {/* PC: 칩 + 초과 카운트 */}
                      <div className="hidden sm:block space-y-0.5">
                        {dayEvents.slice(0, MAX_VISIBLE).map(e => {
                          const cfg = TYPE_CFG[e.type];
                          return (
                            <div key={`${e.type}-${e.id}`}
                              onClick={ev => { ev.stopPropagation(); navigate(eventPath(e)); }}
                              className={cn(
                                "flex items-center gap-1 px-1.5 py-0.5 rounded-md border",
                                "text-[10px] font-semibold truncate cursor-pointer hover:opacity-75 transition",
                                cfg.chip
                              )}>
                              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
                              <span className="truncate">{e.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 선택된 날짜 이벤트 패널 */}
      {selected && selectedEvents.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4"
             style={{ boxShadow: "0 4px 16px rgba(15,23,42,0.04)" }}>
          <p className="text-xs font-extrabold tracking-widest text-slate-400 uppercase mb-3">
            {month}월 {selected}일 · {selectedEvents.length}건
          </p>
          <div className="divide-y divide-slate-50">
            {selectedEvents.map(e => {
              const cfg = TYPE_CFG[e.type];
              return (
                <div
                  key={`${e.type}-${e.id}`}
                  onClick={() => navigate(eventPath(e))}
                  className="flex items-center gap-3 py-2.5 cursor-pointer hover:opacity-80 transition"
                >
                  <span className={cn(
                    "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                    cfg.chip
                  )}>
                    {cfg.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{e.title}</p>
                    {e.clie_name && <p className="text-[11px] text-slate-400">{e.clie_name}</p>}
                  </div>
                  {e.amount != null && e.amount > 0 && (
                    <p className="shrink-0 text-xs font-bold text-slate-700">{formatKRW(e.amount)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {selected && selectedEvents.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-2">{month}월 {selected}일에 등록된 일정이 없어요.</p>
      )}
    </div>
  );
}
