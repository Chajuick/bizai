// components/focuswin/page/schedule/calendar/CalendarView.tsx
//
// 월별 캘린더 그리드. 외부 라이브러리 없이 직접 구현.
// - 7컬럼 그리드 (일~토)
// - 각 날짜 셀: 일정 칩 최대 3개 + 초과 시 "+N"
// - 칩 색상: overdue(빨강), imminent(주황), completed(초록), 기타(파랑)
// - 날짜 클릭 → openCreateForDate
// - 칩 클릭 → handleEdit

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnhancedSchedule } from "@/types/schedule";

// #region Types
type Props = {
  year: number;
  month: number; // 1-based
  items: EnhancedSchedule[];
  isLoading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onDateClick: (dateStr: string) => void; // "YYYY-MM-DD" (KST)
  onItemClick: (item: EnhancedSchedule) => void;
};
// #endregion

// #region Utils

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** UTC Date → KST "YYYY-MM-DD" 문자열 */
function toKstDateStr(date: Date): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 오늘 KST 날짜 문자열 */
function todayKstStr(): string {
  return toKstDateStr(new Date());
}

/** items를 KST 날짜 키별로 그룹핑 */
function groupByDate(items: EnhancedSchedule[]): Map<string, EnhancedSchedule[]> {
  const map = new Map<string, EnhancedSchedule[]>();
  for (const item of items) {
    const key = toKstDateStr(new Date(item.sche_date));
    const arr = map.get(key) ?? [];
    arr.push(item);
    map.set(key, arr);
  }
  return map;
}

/** 해당 월의 캘린더 그리드 날짜 배열 (앞뒤 패딩 포함) */
function buildCalendarGrid(year: number, month: number): (string | null)[] {
  // 1일의 요일 (0=일 ~ 6=토)
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (string | null)[] = [];

  // 앞 패딩
  for (let i = 0; i < firstDay; i++) cells.push(null);

  // 날짜
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    cells.push(`${year}-${mm}-${dd}`);
  }

  // 뒤 패딩 (7의 배수 맞추기)
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function chipColor(item: EnhancedSchedule): string {
  if (item.overdue) return "bg-red-100 text-red-700 border-red-200";
  if (item.imminent) return "bg-orange-100 text-orange-700 border-orange-200";
  if (item.sche_stat === "completed") return "bg-green-100 text-green-700 border-green-200";
  if (item.sche_stat === "canceled") return "bg-gray-100 text-gray-500 border-gray-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

// #endregion

// #region Component

const MAX_CHIPS = 3;

export default function CalendarView({ year, month, items, isLoading, onPrev, onNext, onDateClick, onItemClick }: Props) {
  const cells = buildCalendarGrid(year, month);
  const grouped = groupByDate(items);
  const todayStr = todayKstStr();

  const monthLabel = `${year}년 ${month}월`;

  return (
    <div className="flex flex-col gap-0">
      {/* #region Header */}
      <div className="flex items-center justify-between px-1 pb-3">
        <button
          type="button"
          onClick={onPrev}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
          aria-label="이전 달"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-sm font-semibold text-foreground">{monthLabel}</span>

        <button
          type="button"
          onClick={onNext}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
          aria-label="다음 달"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      {/* #endregion */}

      {/* #region Day labels */}
      <div className="grid grid-cols-7 border-b border-border/50">
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "py-1.5 text-center text-[11px] font-semibold",
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"
            )}
          >
            {d}
          </div>
        ))}
      </div>
      {/* #endregion */}

      {/* #region Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">불러오는 중…</div>
      ) : (
        <div className="grid grid-cols-7 divide-x divide-y divide-border/40">
          {cells.map((dateStr, idx) => {
            if (!dateStr) {
              return <div key={`pad-${idx}`} className="min-h-[90px] bg-muted/20" />;
            }

            const dayItems = grouped.get(dateStr) ?? [];
            const visible = dayItems.slice(0, MAX_CHIPS);
            const overflow = dayItems.length - MAX_CHIPS;

            const day = Number(dateStr.slice(8));
            const dow = (idx % 7); // 0=일, 6=토
            const isToday = dateStr === todayStr;
            const isCurrentMonth = true; // 항상 현재 월 날짜만 렌더링

            return (
              <div
                key={dateStr}
                className="min-h-[90px] cursor-pointer p-1 transition-colors hover:bg-muted/30"
                onClick={() => onDateClick(dateStr)}
              >
                {/* 날짜 번호 */}
                <div className="mb-1 flex justify-end">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-medium",
                      isToday && "bg-primary text-primary-foreground font-bold",
                      !isToday && dow === 0 && "text-red-500",
                      !isToday && dow === 6 && "text-blue-500",
                      !isToday && dow !== 0 && dow !== 6 && "text-foreground"
                    )}
                  >
                    {day}
                  </span>
                </div>

                {/* 일정 칩 */}
                <div className="flex flex-col gap-0.5">
                  {visible.map((item) => (
                    <button
                      key={item.sche_idno}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(item);
                      }}
                      className={cn(
                        "w-full truncate rounded border px-1 py-0.5 text-left text-[10px] font-medium leading-tight transition-opacity hover:opacity-80",
                        chipColor(item)
                      )}
                      title={item.sche_name}
                    >
                      {item.sche_name}
                    </button>
                  ))}

                  {overflow > 0 && (
                    <span className="pl-1 text-[10px] font-semibold text-muted-foreground">
                      +{overflow}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* #endregion */}
    </div>
  );
}

// #endregion
