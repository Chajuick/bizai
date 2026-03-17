import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useDateRange } from "@/components/focuswin/common/filters/date-range-filter";

import type { SalesFilter } from "@/types/sale";
import type { TabPill } from "@/components/focuswin/common/ui/tab-pills";
import type { PageStatus } from "@/components/focuswin/common/page/scaffold/page-scaffold";

// #region Utils

function getSearchFromLocation(location: string) {
  const qs = location.split("?")[1] ?? "";
  const params = new URLSearchParams(qs);
  return params.get("search") ?? "";
}

// #endregion

export function useSaleListVM() {
  // #region Router state (URL = source of truth)

  const [location, navigate] = useLocation();
  const search = useMemo(() => getSearchFromLocation(location), [location]);

  // #endregion

  // #region Local state

  const [filter, setFilter] = useState<SalesFilter>("all");

  // #endregion

  // #region Date range filter
  const { range: dateRange, setPreset: setDatePreset, setCustomRange } = useDateRange("30d");
  // #endregion

  // #region Data fetching

  const { data, isLoading } = trpc.crm.sale.list.useQuery({
    search: search || undefined,
  });

  const logs = data?.items ?? [];

  // #endregion

  // #region Derived data

  type LogItem = (typeof logs)[number];
  type SaleRow = LogItem & { visitedAtDate: Date };

  const normalized: SaleRow[] = useMemo(
    () =>
      logs.map((l) => ({
        ...l,
        visitedAtDate: new Date(l.vist_date),
      })),
    [logs],
  );

  // 날짜 범위 + 탭 필터 적용
  const dateFiltered = useMemo(
    () => normalized.filter((l) => l.visitedAtDate >= dateRange.from && l.visitedAtDate <= dateRange.to),
    [normalized, dateRange],
  );

  const predicates = useMemo(() => {
    const all = (_l: SaleRow) => true;
    const thisWeek = (l: SaleRow) => {
      const weekStart = new Date();
      const day = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
      weekStart.setHours(0, 0, 0, 0);
      return l.visitedAtDate >= weekStart;
    };
    const ai = (l: SaleRow) => !!l.aiex_done;
    return { all, thisWeek, ai } satisfies Record<SalesFilter, (l: SaleRow) => boolean>;
  }, []);

  const filteredLogs = useMemo(() => {
    const predicate = predicates[filter];
    return dateFiltered.filter(predicate);
  }, [dateFiltered, filter, predicates]);

  const counts = useMemo(() => {
    let all = 0;
    let thisWeek = 0;
    let ai = 0;

    for (const l of dateFiltered) {
      all++;
      if (predicates.thisWeek(l)) thisWeek++;
      if (predicates.ai(l)) ai++;
    }

    return { all, thisWeek, ai };
  }, [dateFiltered, predicates]);

  const tabs: TabPill<SalesFilter>[] = useMemo(
    () => [
      { key: "all", label: "전체", count: counts.all },
      { key: "thisWeek", label: "이번주", count: counts.thisWeek },
      { key: "ai", label: "AI", count: counts.ai },
    ],
    [counts.all, counts.thisWeek, counts.ai],
  );

  // Summary stats (날짜 범위 기준)
  const summary = useMemo(() => {
    let totalCount = 0;
    let aiCount = 0;

    for (const l of dateFiltered) {
      totalCount++;
      if (l.aiex_done) aiCount++;
    }

    return { totalCount, aiCount };
  }, [dateFiltered]);

  // #endregion

  // #region Empty state

  const hasData = filteredLogs.length > 0;

  const emptyTitle = search.trim()
    ? "검색 결과가 없어요"
    : filter !== "all"
      ? "조건에 맞는 일지가 없어요"
      : "아직 영업일지가 없어요";

  const emptyDesc = search.trim()
    ? "검색어를 바꿔서 다시 시도해보세요."
    : filter !== "all"
      ? "필터를 '전체'로 바꾸거나 새 일지를 작성해보세요."
      : "첫 기록을 남기면 AI가 자동으로 요약/정리해줘요.";

  // #endregion

  // #region Status

  const status: PageStatus = isLoading ? "loading" : hasData ? "ready" : "empty";

  // #endregion

  // #region Actions

  const handleSearch = (value: string) => {
    const q = value.trim();
    navigate(q ? `/sale-list?search=${encodeURIComponent(q)}` : "/sale-list", {
      replace: true,
    });
  };

  const handleClear = () => {
    navigate("/sale-list", { replace: true });
  };

  const handleReset = () => {
    setFilter("all");
    navigate("/sale-list", { replace: true });
  };

  // #endregion

  // #region Public API

  return {
    // state
    search,
    filter,
    setFilter,

    // date filter
    dateRange,
    setDatePreset,
    setCustomRange,

    // summary stats (날짜 범위 기준)
    summary,

    // data
    items: filteredLogs,
    tabs,

    // ─── 통일 페이지네이션 인터페이스 ───────────────────────────
    hasMore: false as boolean,
    isLoadingMore: false as boolean,
    loadMore: () => {},

    // status
    isLoading,
    hasData,
    status,

    // empty
    emptyTitle,
    emptyDesc,

    // actions
    handleSearch,
    handleClear,
    handleReset,
  };

  // #endregion
}
