// hooks/focuswin/shipment/useShipmentVM.ts

// #region Imports
import { useCallback, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { ShipmentRow, ShipmentStatus } from "@/types/shipment";
// #endregion

// #region Constants
const PAGE_LIMIT = 20;
// #endregion

export type ShipmentTabKey = ShipmentStatus | "all";

export function useShipmentVM() {
  // #region State
  const [activeTab, setActiveTabState] = useState<ShipmentTabKey>("all");
  const [offset, setOffset] = useState(0);
  const [accRows, setAccRows] = useState<ShipmentRow[]>([]);
  // #endregion

  // #region tRPC utils
  const utils = trpc.useUtils();
  // #endregion

  // #region Queries
  const listQuery = trpc.crm.shipment.list.useQuery(
    {
      ship_stat: activeTab !== "all" ? activeTab : undefined,
      page: { limit: PAGE_LIMIT, offset },
    },
    { placeholderData: (prev) => prev, staleTime: 10_000 }
  );

  const statsQuery = trpc.crm.shipment.stats.useQuery(undefined, {
    staleTime: 30_000,
  });
  // #endregion

  // #region Merge pages (append)
  useEffect(() => {
    const items = (listQuery.data?.items ?? []) as ShipmentRow[];

    if (offset === 0) {
      setAccRows(items);
      return;
    }

    setAccRows((prev) => {
      const map = new Map<number, ShipmentRow>();
      for (const p of prev) map.set(p.ship_idno, p);
      for (const p of items) map.set(p.ship_idno, p);
      return Array.from(map.values());
    });
  }, [listQuery.data, offset]);
  // #endregion

  // #region Tab change (paging 리셋 포함)
  const setActiveTab = useCallback((tab: ShipmentTabKey) => {
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
      utils.crm.shipment.list.invalidate(),
      utils.crm.shipment.stats.invalidate(),
    ]);
  }, [resetPaging, utils]);
  // #endregion

  // #region Stats (from statsQuery)
  const stats = statsQuery.data ?? {
    all: 0,
    pending: 0,
    delivered: 0,
    invoiced: 0,
    paid: 0,
    totalPaid: 0,
    totalInvoiced: 0,
    totalPending: 0,
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
