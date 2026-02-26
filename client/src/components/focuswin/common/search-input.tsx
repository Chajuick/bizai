import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/focuswin/common/ui/input";
import { Search, X } from "lucide-react";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

export default function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "검색…",
  className = "",
  inputClassName = "",
  autoFocus,
  debounceMs = 0,
  trimOnChange = false,
}: {
  value: string;
  onChange: (next: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  debounceMs?: number;
  trimOnChange?: boolean;
}) {
  // ✅ debounce가 있을 때: 사용자가 타이핑 중인 값을 로컬로 들고 있다가,
  // 일정 시간 지나면 onChange로 확정 반영
  const [draft, setDraft] = useState(value);
  const isDebounced = debounceMs > 0;

  // 외부 value가 바뀌면 draft도 동기화 (URL 변경, reset 등)
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const debouncedDraft = useDebouncedValue(draft, debounceMs);

  // debounce 모드일 때만 debouncedDraft를 부모에 반영
  const lastSentRef = useRef<string>(value);
  useEffect(() => {
    if (!isDebounced) return;

    const next = trimOnChange ? debouncedDraft.trim() : debouncedDraft;
    if (next === lastSentRef.current) return;

    lastSentRef.current = next;
    onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDraft, isDebounced, trimOnChange]);

  const shownValue = isDebounced ? draft : value;

  const hasText = useMemo(() => !!shownValue.trim(), [shownValue]);

  const handleClear = () => {
    if (isDebounced) setDraft("");
    onChange("");
    onClear?.();
  };

  return (
    <div className={["relative", className].join(" ")}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

      {hasText && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center"
          aria-label="검색어 지우기"
        >
          <X size={14} className="text-slate-600" />
        </button>
      )}

      <Input
        autoFocus={autoFocus}
        value={shownValue}
        onChange={(e) => {
          const next = e.target.value;
          if (isDebounced) {
            setDraft(next);
          } else {
            onChange(trimOnChange ? next.trimStart() : next);
          }
        }}
        placeholder={placeholder}
        className={[
          "pl-9 pr-10 py-3 text-sm rounded-2xl border border-slate-200 bg-white",
          "focus-visible:ring-2 focus-visible:ring-blue-200",
          inputClassName,
        ].join(" ")}
      />
    </div>
  );
}