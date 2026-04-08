// client/src/hooks/focuswin/expense/useExpenseListVM.ts

import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useDateRange } from "@/components/focuswin/common/filters/date-range-filter";
import type { PageStatus } from "@/components/focuswin/common/page/scaffold/page-scaffold";
import type { TabPill } from "@/components/focuswin/common/ui/tab-pills";

// #region Types
export type PayFilter = "all" | "card" | "cash" | "transfer";
// #endregion

// #region Utils
function getSearchFromLocation(location: string) {
  const qs = location.split("?")[1] ?? "";
  return new URLSearchParams(qs).get("search") ?? "";
}
// #endregion

export function useExpenseListVM() {
  // #region Router
  const [location, navigate] = useLocation();
  const search = useMemo(() => getSearchFromLocation(location), [location]);
  // #endregion

  // #region Filters
  const { range: dateRange, setPreset: setDatePreset, setCustomRange } = useDateRange("30d", "expense-list");
  const [payFilter, setPayFilter] = useState<PayFilter>("all");
  // #endregion

  // #region Query
  const listQuery = trpc.crm.expense.list.useQuery(
    { search: search || undefined },
    { staleTime: 15_000 },
  );
  const rawItems = listQuery.data?.items ?? [];
  // #endregion

  // #region Client-side filtering
  const items = useMemo(() => {
    return rawItems.filter((item) => {
      const date = new Date(item.expe_date);

      // 날짜 범위
      if (date < dateRange.from || date > dateRange.to) return false;

      // 결제 수단 필터
      if (payFilter === "card"     && item.paym_meth !== "card") return false;
      if (payFilter === "cash"     && item.paym_meth !== "cash") return false;
      if (payFilter === "transfer" && item.paym_meth !== "transfer") return false;

      return true;
    });
  }, [rawItems, dateRange, payFilter]);
  // #endregion

  // #region Summary stats (조회 기간 기준)
  const summary = useMemo(() => {
    let totalAmnt = 0;
    let totalCount = 0;
    let recurCount = 0;
    let cardAmnt = 0;

    for (const item of items) {
      const amnt = Number(item.expe_amnt);
      totalAmnt += amnt;
      totalCount++;
      if (item.recr_type !== "none") recurCount++;
      if (item.paym_meth === "card") cardAmnt += amnt;
    }

    return { totalAmnt, totalCount, recurCount, cardAmnt };
  }, [items]);
  // #endregion

  // #region Tab pills — 결제 수단 (날짜 범위 기준 건수)
  const payTabs: TabPill<PayFilter>[] = useMemo(() => {
    const dateFiltered = rawItems.filter((item) => {
      const date = new Date(item.expe_date);
      return date >= dateRange.from && date <= dateRange.to;
    });
    const count = (meth?: string) =>
      meth ? dateFiltered.filter((i) => i.paym_meth === meth).length : dateFiltered.length;
    return [
      { key: "all",      label: "전체", count: count() },
      { key: "card",     label: "카드", count: count("card") },
      { key: "cash",     label: "현금", count: count("cash") },
      { key: "transfer", label: "이체", count: count("transfer") },
    ];
  }, [rawItems, dateRange]);
  // #endregion

  // #region Status
  const isLoading = listQuery.isLoading;
  const hasData = items.length > 0;
  const status: PageStatus = isLoading ? "loading" : hasData ? "ready" : "empty";
  // #endregion

  // #region Navigation actions
  const openCreate = () => navigate("/expe-list/new");
  const openDetail = (id: number) => navigate(`/expe-list/${id}`);

  const handleSearch = (value: string) => {
    const q = value.trim();
    navigate(q ? `/expe-list?search=${encodeURIComponent(q)}` : "/expe-list", { replace: true });
  };
  const handleClear = () => navigate("/expe-list", { replace: true });
  // #endregion

  return {
    // status
    status,
    isLoading,
    hasData,

    // data
    items,
    summary,

    // date filter
    dateRange,
    setDatePreset,
    setCustomRange,

    // segment filters
    payFilter,
    setPayFilter,
    payTabs,

    // search
    search,
    handleSearch,
    handleClear,

    // navigation
    openCreate,
    openDetail,
  };
}
