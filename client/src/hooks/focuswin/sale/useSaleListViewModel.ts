import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import type { SalesFilter } from "@/types/salesLog";
import type { TabPill } from "@/components/focuswin/common/ui/tab-pills";

function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun ... 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getSearchFromLocation(location: string) {
  // location 예: "/sale-list?search=abc"
  const qs = location.split("?")[1] ?? "";
  const params = new URLSearchParams(qs);
  return params.get("search") ?? "";
}

export function useSaleListViewModel() {
  const [location, navigate] = useLocation();

  // ✅ window 의존 제거 + 초기 1회만 파싱
  const [search, setSearchState] = useState(() => getSearchFromLocation(location));
  const [filter, setFilter] = useState<SalesFilter>("all");

  // ✅ URL → state 동기화 (뒤로가기/앞으로가기 등)
  useEffect(() => {
    const urlSearch = getSearchFromLocation(location);
    if (urlSearch !== search) setSearchState(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const { data: logsData, isLoading } = trpc.salesLogs.list.useQuery({
    search: search || undefined,
  });

  // ✅ 앱 켜둔 채 주(week) 넘어가도 기준이 갱신되도록 location 기준으로 재계산
  const weekStart = useMemo(() => startOfWeekMonday(new Date()), [location]);

  // ✅ Date 파싱/정규화: 한 번만
  const normalizedLogs = useMemo(() => {
    const arr = logsData?.items ?? [];
    return arr.map((l) => ({
      ...l,
      visitedAtDate: new Date(l.vist_date),
    }));
  }, [logsData]);

  // ✅ counts 계산도 normalizedLogs 기준으로
  const counts = useMemo(() => {
    return {
      all: normalizedLogs.length,
      thisWeek: normalizedLogs.filter((l) => l.visitedAtDate >= weekStart).length,
      ai: normalizedLogs.filter((l) => !!l.aiex_done).length,
    };
  }, [normalizedLogs, weekStart]);

  const salesTabs = useMemo<TabPill<SalesFilter>[]>(
    () => [
      { key: "all", label: "전체", count: counts.all },
      { key: "thisWeek", label: "이번주", count: counts.thisWeek },
      { key: "ai", label: "AI", count: counts.ai },
    ],
    [counts]
  );

  const filteredLogs = useMemo(() => {
    if (filter === "thisWeek") return normalizedLogs.filter((l) => l.visitedAtDate >= weekStart);
    if (filter === "ai") return normalizedLogs.filter((l) => !!l.aiex_done);
    return normalizedLogs;
  }, [normalizedLogs, filter, weekStart]);

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
    const q = value.trim();
    setSearchState(value);

    navigate(q ? `/sale-list?search=${encodeURIComponent(q)}` : "/sale-list", {
      replace: true,
    });
  };

  const handleClear = () => {
    setSearchState("");
    navigate("/sale-list", { replace: true });
  };

  const handleReset = () => {
    setSearchState("");
    setFilter("all");
    navigate("/sale-list", { replace: true });
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
