import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import type { SalesFilter } from "@/types/salesLog";
import type { TabPill } from "@/components/focuswin/tab-pills";

function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function useSalesLogsViewModel() {
  const [location, navigate] = useLocation();

  const getSearchFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("search") ?? "";
  };

  const [search, setSearchState] = useState(getSearchFromURL);
  const [filter, setFilter] = useState<SalesFilter>("all");

  useEffect(() => {
    const urlSearch = getSearchFromURL();
    if (urlSearch !== search) setSearchState(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const { data: logs, isLoading } = trpc.salesLogs.list.useQuery({
    search: search || undefined,
    limit: 50,
  });

  const weekStart = useMemo(() => startOfWeekMonday(new Date()), []);

  const counts = useMemo(() => {
    const arr = logs ?? [];
    return {
      all: arr.length,
      thisWeek: arr.filter(l => new Date(l.visitedAt) >= weekStart).length,
      ai: arr.filter(l => !!l.isProcessed).length,
      audio: arr.filter(l => !!l.audioUrl).length,
    };
  }, [logs, weekStart]);

  const salesTabs = useMemo<TabPill<SalesFilter>[]>(
    () => [
      { key: "all", label: "전체", count: counts.all },
      { key: "thisWeek", label: "이번주", count: counts.thisWeek },
      { key: "ai", label: "AI", count: counts.ai },
      { key: "audio", label: "음성", count: counts.audio },
    ],
    [counts]
  );

  const filteredLogs = useMemo(() => {
    const arr = logs ?? [];
    if (filter === "thisWeek") return arr.filter(l => new Date(l.visitedAt) >= weekStart);
    if (filter === "ai") return arr.filter(l => !!l.isProcessed);
    if (filter === "audio") return arr.filter(l => !!l.audioUrl);
    return arr;
  }, [logs, filter, weekStart]);

  const hasData = filteredLogs.length > 0;

  const emptyTitle = useMemo(() => {
    if (search.trim()) return "검색 결과가 없어요";
    if (filter !== "all") return "조건에 맞는 일지가 없어요";
    return "아직 영업일지가 없어요";
  }, [search, filter]);

  const emptyDesc = useMemo(() => {
    if (search.trim()) return "검색어를 바꿔서 다시 시도해보세요.";
    if (filter !== "all") return "필터를 '전체'로 바꾸거나 새 일지를 작성해보세요.";
    return "첫 기록을 남기면 AI가 자동으로 요약/정리해줘요.";
  }, [search, filter]);

  const handleSearch = (value: string) => {
    setSearchState(value);
    const q = value.trim();
    navigate(q ? `/sales-logs?search=${encodeURIComponent(q)}` : "/sales-logs", {
      replace: true,
    });
  };

  const handleClear = () => {
    setSearchState("");
    navigate("/sales-logs", { replace: true });
  };

  const handleReset = () => {
    setSearchState("");
    setFilter("all");
    navigate("/sales-logs", { replace: true });
  };

  return {
    search,
    filter,
    setFilter,
    logs: filteredLogs,
    isLoading,
    hasData,
    salesTabs,
    emptyTitle,
    emptyDesc,
    handleSearch,
    handleClear,
    handleReset,
  };
}
