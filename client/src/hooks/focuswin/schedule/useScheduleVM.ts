// hooks/focuswin/schedule/useScheduleVM.ts

// #region Imports
import { useCallback, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { EnhancedSchedule, ScheduleTabKey } from "@/types/schedule";
// #endregion

// #region Constants
const PAGE_LIMIT = 20;
// #endregion

export function useScheduleVM() {
  // #region State
  const [activeTab, setActiveTabState] = useState<ScheduleTabKey>("all");

  const [offset, setOffset] = useState(0);
  const [accRows, setAccRows] = useState<EnhancedSchedule[]>([]);
  // #endregion

  // #region TRPC utils
  const utils = trpc.useUtils();
  // #endregion

  // #region Queries
  const listQuery = trpc.crm.schedule.list.useQuery(
    { tab: activeTab, page: { limit: PAGE_LIMIT, offset } },
    {
      placeholderData: (prev) => prev,
      staleTime: 10_000,
    }
  );

  const statsQuery = trpc.crm.schedule.stats.useQuery(undefined, {
    staleTime: 30_000,
  });
  // #endregion

  // #region Merge pages (append)
  useEffect(() => {
    const items = (listQuery.data?.items ?? []) as EnhancedSchedule[];

    if (offset === 0) {
      // 탭 전환 후 첫 응답 or 리셋 → 교체
      setAccRows(items);
      return;
    }

    setAccRows((prev) => {
      const map = new Map<number, EnhancedSchedule>();
      for (const p of prev) map.set(p.sche_idno, p);
      for (const p of items) map.set(p.sche_idno, p);
      return Array.from(map.values());
    });
  }, [listQuery.data, offset]);
  // #endregion

  // #region List / DisplayList
  // 서버가 탭 필터링 + 정렬 + overdue/imminent 플래그를 모두 처리
  const list: EnhancedSchedule[] = accRows;
  const displayList: EnhancedSchedule[] = accRows;
  // #endregion

  // #region Counts (statsQuery 기반 — 전체 DB 기준)
  const counts = statsQuery.data ?? {
    all: 0,
    imminent: 0,
    overdue: 0,
    scheduled: 0,
    completed: 0,
    canceled: 0,
  };
  // #endregion

  // #region Tab change (paging 리셋 포함)
  const setActiveTab = useCallback((tab: ScheduleTabKey) => {
    setOffset(0);
    setActiveTabState(tab);
  }, []);
  // #endregion

  // #region Paging flags / actions
  const hasMore = !!listQuery.data?.page?.hasMore;

  const isLoading = listQuery.isLoading && offset === 0;
  const isLoadingMore = listQuery.isFetching && offset > 0;

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    if (listQuery.isFetching) return;
    setOffset((v) => v + PAGE_LIMIT);
  }, [hasMore, listQuery.isFetching]);

  /**
   * ✅ paging reset (누적 데이터까지 초기화)
   */
  const resetPaging = useCallback(() => {
    setAccRows([]);
    setOffset(0);
  }, []);

  /**
   * ✅ 서버에서 다시 가져오기까지 포함한 refresh
   */
  const refresh = useCallback(async () => {
    resetPaging();
    await Promise.all([
      utils.crm.schedule.list.invalidate(),
      utils.crm.schedule.stats.invalidate(),
    ]);
  }, [resetPaging, utils]);
  // #endregion

  // #region Derived counts
  const overdueInList = counts.overdue;
  const imminentInList = counts.imminent;
  // #endregion

  return {
    activeTab,
    setActiveTab,

    isLoading,
    isLoadingMore,

    list,
    displayList,

    counts,
    overdueInList,
    imminentInList,

    hasMore,
    loadMore,

    resetPaging,
    refresh,
  };
}

export type { ScheduleTabKey as TabKey };