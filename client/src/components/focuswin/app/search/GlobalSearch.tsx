// client/src/components/focuswin/app/search/GlobalSearch.tsx

import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, X, Building2, ShoppingCart, TrendingUp, Calendar, Receipt, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { useGlobalSearch, SearchResultKind } from "@/hooks/focuswin/search/useGlobalSearch";

type Props = ReturnType<typeof useGlobalSearch>;

const KIND_ICON: Record<SearchResultKind, React.ElementType> = {
  client: Building2,
  order: ShoppingCart,
  shipment: TrendingUp,
  schedule: Calendar,
  expense: Receipt,
};

const KIND_COLOR: Record<SearchResultKind, string> = {
  client: "text-blue-500 bg-blue-50",
  order: "text-emerald-600 bg-emerald-50",
  shipment: "text-violet-500 bg-violet-50",
  schedule: "text-amber-500 bg-amber-50",
  expense: "text-rose-500 bg-rose-50",
};

export default function GlobalSearch({
  open,
  closeSearch,
  query,
  setQuery,
  results,
  isFetching,
  isEmpty,
}: Props) {
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, closeSearch]);

  if (!open) return null;

  const handleSelect = (path: string) => {
    navigate(path);
    closeSearch();
  };

  const hasResults = results.length > 0;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
        onClick={closeSearch}
      />

      {/* 검색 패널 */}
      <div className="relative z-10 w-full px-4 mt-[5vh]">
      <div className="w-full max-w-lg mx-auto flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
        style={{ maxHeight: "80vh" }}
      >
        {/* 입력 바 */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 shrink-0">
          {isFetching ? (
            <Loader2 size={18} className="text-slate-400 shrink-0 animate-spin" />
          ) : (
            <Search size={18} className="text-slate-400 shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="수주, 거래처, 일정, 지출 검색…"
            className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0"
            >
              <X size={15} />
            </button>
          )}
          <button
            onClick={closeSearch}
            className="text-[11px] text-slate-400 hover:text-slate-600 transition shrink-0 ml-1"
          >
            닫기
          </button>
        </div>

        {/* 결과 영역 */}
        <div className="overflow-y-auto flex-1">
          {/* 초기 상태 */}
          {!query && (
            <div className="py-10 text-center">
              <Search size={28} className="mx-auto text-slate-200 mb-2" />
              <p className="text-xs text-slate-400">검색어를 입력하세요</p>
            </div>
          )}

          {/* 검색 결과 없음 */}
          {isEmpty && (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-slate-400">결과 없음</p>
              <p className="text-xs text-slate-300 mt-1">"{query}"에 해당하는 항목이 없어요</p>
            </div>
          )}

          {/* 결과 그룹 */}
          {hasResults && (
            <div className="py-2">
              {results.map((group) => {
                const Icon = KIND_ICON[group.kind];
                const colorClass = KIND_COLOR[group.kind];
                return (
                  <div key={group.kind}>
                    {/* 섹션 헤더 */}
                    <div className="flex items-center gap-2 px-4 py-2">
                      <span className={cn("w-5 h-5 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
                        <Icon size={11} />
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        {group.label}
                      </span>
                      <span className="text-[10px] text-slate-300 font-medium">{group.items.length}건</span>
                    </div>

                    {/* 아이템 목록 */}
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.path)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-left"
                      >
                        <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center shrink-0", colorClass)}>
                          <Icon size={13} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                          {item.subtitle && (
                            <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                          )}
                        </div>
                        {item.meta && (
                          <span className="text-[10px] text-slate-400 shrink-0 ml-1">{item.meta}</span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
