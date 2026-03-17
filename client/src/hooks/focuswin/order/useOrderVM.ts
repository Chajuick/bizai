// hooks/focuswin/order/useOrderVM.ts

// #region Imports
import { useCallback, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { OrderRow, OrderStatus } from "@/types/order";
import type { DateRange } from "@/components/focuswin/common/filters/date-range-filter";
// #endregion

// #region Constants
const PAGE_LIMIT = 20;
// #endregion

export type OrderTabKey = OrderStatus | "all";

export function useOrderVM(dateRange?: DateRange) {
  // #region State
  const [activeTab, setActiveTabState] = useState<OrderTabKey>("all");
  const [offset, setOffset] = useState(0);
  const [accRows, setAccRows] = useState<OrderRow[]>([]);
  // #endregion

  // #region tRPC utils
  const utils = trpc.useUtils();
  // #endregion

  // #region Queries
  const listQuery = trpc.crm.order.list.useQuery(
    {
      status: activeTab !== "all" ? activeTab : undefined,
      page: { limit: PAGE_LIMIT, offset },
      from: dateRange?.from.toISOString(),
      to:   dateRange?.to.toISOString(),
    },
    { placeholderData: (prev) => prev, staleTime: 10_000 }
  );

  const statsQuery = trpc.crm.order.stats.useQuery(undefined, {
    staleTime: 30_000,
  });
  // #endregion

  // #region Reset on date range change
  useEffect(() => {
    setAccRows([]);
    setOffset(0);
  }, [dateRange?.from.getTime(), dateRange?.to.getTime()]);
  // #endregion

  // #region Merge pages (append)
  useEffect(() => {
    const items = (listQuery.data?.items ?? []) as OrderRow[];

    if (offset === 0) {
      setAccRows(items);
      return;
    }

    setAccRows((prev) => {
      const map = new Map<number, OrderRow>();
      for (const p of prev) map.set(p.orde_idno, p);
      for (const p of items) map.set(p.orde_idno, p);
      return Array.from(map.values());
    });
  }, [listQuery.data, offset]);
  // #endregion

  // #region Tab change (paging 리셋 포함)
  const setActiveTab = useCallback((tab: OrderTabKey) => {
    setAccRows([]);
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

  const resetPaging = useCallback(() => {
    setAccRows([]);
    setOffset(0);
  }, []);

  const refresh = useCallback(async () => {
    resetPaging();
    await Promise.all([
      utils.crm.order.list.invalidate(),
      utils.crm.order.stats.invalidate(),
    ]);
  }, [resetPaging, utils]);
  // #endregion

  // #region Stats (from statsQuery)
  const stats = statsQuery.data ?? {
    all: 0,
    proposal: 0,
    negotiation: 0,
    confirmed: 0,
    canceled: 0,
    totalPipeline: 0,
    confirmedAmount: 0,
  };
  // #endregion

  return {
    activeTab,
    setActiveTab,

    isLoading,
    isLoadingMore,

    items: accRows,
    stats,

    hasMore,
    loadMore,

    resetPaging,
    refresh,
  };
}
