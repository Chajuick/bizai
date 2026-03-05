// client/src/hooks/focuswin/clients/useClientListVM.ts

// #region Imports
import { useMemo } from "react";
import { useLocation } from "wouter";

import { trpc } from "@/lib/trpc";

import type { PageStatus } from "@/components/focuswin/common/page/scaffold/page-scaffold";
// import type { TabPill } from "@/components/focuswin/common/ui/tab-pills"; // 필요해지면 추가
// #endregion

// #region Utils
function getSearchFromLocation(location: string) {
  const qs = location.split("?")[1] ?? "";
  const params = new URLSearchParams(qs);
  return params.get("search") ?? "";
}
// #endregion

export function useClientListVM() {
  // #region Router state (URL = source of truth)

  const [location, navigate] = useLocation();
  const search = useMemo(() => getSearchFromLocation(location), [location]);

  const goRegist = () => navigate("/clie-list/regi");
  const goDetail = (id: number) => navigate(`/clie-list/${id}`);

  // #endregion

  // #region Data fetching

  const listQuery = trpc.crm.client.list.useQuery({
    search: search || undefined,
  });

  const items = listQuery.data?.items ?? [];

  // #endregion

  // #region Empty state

  const hasData = items.length > 0;

  const emptyTitle = search.trim() ? "검색 결과가 없어요" : "아직 고객사가 없어요";
  const emptyDesc = search.trim()
    ? "검색어를 바꿔서 다시 시도해보세요."
    : "고객사를 등록하면 영업/수주 기록을 빠르게 연결할 수 있어요.";

  // #endregion

  // #region Status

  const isLoading = listQuery.isLoading;
  const status: PageStatus = isLoading ? "loading" : hasData ? "ready" : "empty";

  // #endregion

  // #region Actions

  const handleSearch = (value: string) => {
    const q = value.trim();
    navigate(q ? `/clie-list?search=${encodeURIComponent(q)}` : "/clie-list", {
      replace: true,
    });
  };

  const handleClear = () => {
    navigate("/clie-list", { replace: true });
  };

  const refresh = async () => {
    await listQuery.refetch();
  };

  // #endregion

  // #region Public API

  return {
    // state
    search,

    // data
    items,

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

    // navigation
    goRegist,
    goDetail,

    // actions
    handleSearch,
    handleClear,
    refresh,

    // raw query (필요하면)
    listQuery,
  };

  // #endregion
}