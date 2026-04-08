// client/src/components/focuswin/common/filters/date-range-filter.tsx
// 날짜 범위 프리셋 필터 — 기본값: 최근 30일, 직접 선택 지원

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CalendarRange, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// #region Types
export type DatePreset = "today" | "7d" | "30d" | "3m" | "ytd" | "custom";

export type DateRange = {
  from: Date;
  to: Date;
  preset: DatePreset;
  label: string;
};
// #endregion

// #region Preset helpers
const PRESETS: { key: Exclude<DatePreset, "custom">; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "7d",    label: "최근 7일" },
  { key: "30d",   label: "최근 30일" },
  { key: "3m",    label: "최근 3개월" },
  { key: "ytd",   label: "올해" },
];

export function buildDateRange(preset: Exclude<DatePreset, "custom">): DateRange {
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  const from = new Date();
  from.setHours(0, 0, 0, 0);

  switch (preset) {
    case "today":
      break;
    case "7d":
      from.setDate(from.getDate() - 6);
      break;
    case "30d":
      from.setDate(from.getDate() - 29);
      break;
    case "3m":
      from.setMonth(from.getMonth() - 3);
      break;
    case "ytd":
      from.setMonth(0, 1);
      break;
  }

  const found = PRESETS.find((p) => p.key === preset)!;
  return { from, to, preset, label: found.label };
}

export const DEFAULT_DATE_RANGE: DateRange = buildDateRange("30d");
// #endregion

// #region Hook
const STORAGE_PREFIX = "fw_daterange_";

function readStorage(key: string): { preset: DatePreset; from?: string; to?: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStorage(key: string, preset: DatePreset, from?: string, to?: string) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify({ preset, from, to }));
  } catch {
    // localStorage 사용 불가 환경 무시
  }
}

export function useDateRange(
  initial: Exclude<DatePreset, "custom"> = "30d",
  storageKey?: string,
) {
  const [preset, setPresetState] = useState<DatePreset>(() => {
    if (!storageKey) return initial;
    return readStorage(storageKey)?.preset ?? initial;
  });
  const [customFrom, setCustomFrom] = useState<string>(() => {
    if (!storageKey) return "";
    return readStorage(storageKey)?.from ?? "";
  });
  const [customTo, setCustomTo] = useState<string>(() => {
    if (!storageKey) return "";
    return readStorage(storageKey)?.to ?? "";
  });

  const range = useMemo((): DateRange => {
    if (preset === "custom" && customFrom && customTo) {
      const from = new Date(customFrom + "T00:00:00");
      const to   = new Date(customTo   + "T23:59:59");
      return { from, to, preset: "custom", label: `${customFrom} ~ ${customTo}` };
    }
    if (preset === "custom") return buildDateRange("30d");
    return buildDateRange(preset);
  }, [preset, customFrom, customTo]);

  const setPreset = (p: DatePreset) => {
    setPresetState(p);
    if (storageKey) writeStorage(storageKey, p);
  };

  const setCustomRange = (from: string, to: string) => {
    setCustomFrom(from);
    setCustomTo(to);
    setPresetState("custom");
    if (storageKey) writeStorage(storageKey, "custom", from, to);
  };

  return { range, preset, setPreset, setCustomRange };
}
// #endregion

// #region Component
export default function DateRangeFilter({
  range,
  onChange,
  onCustomRange,
  className,
}: {
  range: DateRange;
  onChange: (preset: DatePreset) => void;
  onCustomRange?: (from: string, to: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [localFrom, setLocalFrom] = useState("");
  const [localTo, setLocalTo] = useState("");

  // 드롭다운 닫히면 커스텀 패널도 닫기
  useEffect(() => {
    if (!open) setShowCustom(false);
  }, [open]);

  const selectPreset = (key: DatePreset) => {
    onChange(key);
    setOpen(false);
  };

  const applyCustom = () => {
    if (localFrom && localTo && onCustomRange) {
      onCustomRange(localFrom, localTo);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white",
            "px-3 py-2 text-sm font-semibold text-slate-700 transition-colors",
            "hover:bg-slate-50 focus:outline-none",
            className,
          )}
        >
          <CalendarDays size={14} className="text-slate-400 shrink-0" />
          <span>{range.label}</span>
          <ChevronDown size={13} className="text-slate-400 shrink-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-48 p-1">
        {!showCustom ? (
          <div className="space-y-0.5">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => selectPreset(p.key)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors",
                  "hover:bg-slate-100",
                  range.preset === p.key && "bg-blue-50 text-blue-600",
                )}
              >
                {p.label}
              </button>
            ))}

            {onCustomRange && (
              <>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => setShowCustom(true)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors",
                    "flex items-center gap-2 hover:bg-slate-100",
                    range.preset === "custom" && "bg-blue-50 text-blue-600",
                  )}
                >
                  <CalendarRange size={13} className="shrink-0" />
                  직접 선택
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2 p-1">
            <p className="px-1 text-xs font-semibold text-slate-500">날짜 범위</p>
            <div className="space-y-1.5">
              <input
                type="date"
                value={localFrom}
                onChange={(e) => setLocalFrom(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
              <input
                type="date"
                value={localTo}
                min={localFrom}
                onChange={(e) => setLocalTo(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
            <div className="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setShowCustom(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={applyCustom}
                disabled={!localFrom || !localTo}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
              >
                적용
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
// #endregion
