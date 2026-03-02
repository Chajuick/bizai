import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

import type { SalesFilter } from "@/types/salesLog";
import type { TabPill } from "@/components/focuswin/common/ui/tab-pills";
import { PageStatus } from "@/components/focuswin/common/page-scaffold";

function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getSearchFromLocation(location: string) {
  const qs = location.split("?")[1] ?? "";
  const params = new URLSearchParams(qs);
  return params.get("search") ?? "";
}

export function useSaleListVM() {
  // #region Router state (URL = source of truth)

  const [location, navigate] = useLocation();
  const search = useMemo(() => getSearchFromLocation(location), [location]);

  // #endregion

  // #region Local state

  const [filter, setFilter] = useState<SalesFilter>("all");

  // #endregion

  // #region Data fetching

  const { data, isLoading } = trpc.crm.sale.list.useQuery({
    search: search || undefined,
  });

  const logs = data?.items ?? [];

  // #endregion

  // #region Derived data

  const weekStart = useMemo(
    () => startOfWeekMonday(new Date()),
    []
  );

  const normalized = useMemo(
    () =>
      logs.map((l) => ({
        ...l,
        visitedAtDate: new Date(l.vist_date),
      })),
    [logs]
  );

  const predicates = {
    all: () => true,
    thisWeek: (l: any) => l.visitedAtDate >= weekStart,
    ai: (l: any) => !!l.aiex_done,
  };

  const filteredLogs = useMemo(
    () => normalized.filter(predicates[filter]),
    [normalized, filter, weekStart]
  );

  const counts = useMemo(
    () => ({
      all: normalized.length,
      thisWeek: normalized.filter(predicates.thisWeek).length,
      ai: normalized.filter(predicates.ai).length,
    }),
    [normalized, weekStart]
  );

  const tabs: TabPill<SalesFilter>[] = [
    { key: "all", label: "전체", count: counts.all },
    { key: "thisWeek", label: "이번주", count: counts.thisWeek },
    { key: "ai", label: "AI", count: counts.ai },
  ];

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

  const status: PageStatus =
    isLoading ? "loading" : hasData ? "ready" : "empty";
  // #endregion

  // #region Actions

  const handleSearch = (value: string) => {
    const q = value.trim();
    navigate(
      q
        ? `/sale-list?search=${encodeURIComponent(q)}`
        : "/sale-list",
      { replace: true }
    );
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

    // data
    logs: filteredLogs,
    tabs,

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