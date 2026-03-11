// client/src/hooks/focuswin/clients/useClientListVM.ts

// #region Imports
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useLocation } from "wouter";

import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { handleApiError } from "@/lib/handleApiError";

import type { PageStatus } from "@/components/focuswin/common/page/scaffold/page-scaffold";
import type { RouterOutputs } from "@/types/router";
// #endregion

// #region Types
type UploadResult = RouterOutputs["crm"]["client"]["upload"];
type ClientItem = RouterOutputs["crm"]["client"]["list"]["items"][number];
// #endregion

// #region Constants
const PAGE_LIMIT = 20;
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

  // #region Pagination state

  const [offset, setOffset] = useState(0);
  const [accRows, setAccRows] = useState<ClientItem[]>([]);

  // #endregion

  // #region Data fetching

  const listQuery = trpc.crm.client.list.useQuery(
    { search: search || undefined, page: { limit: PAGE_LIMIT, offset } },
    { placeholderData: (prev) => prev, staleTime: 10_000 }
  );

  const uploadMutation = trpc.crm.client.upload.useMutation();
  const utils = trpc.useUtils();

  // #endregion

  // #region Merge pages (검색어 변경 시 교체, 더보기 시 누적)

  useEffect(() => {
    const items = listQuery.data?.items ?? [];

    if (offset === 0) {
      setAccRows(items);
      return;
    }

    setAccRows((prev) => {
      const map = new Map<number, ClientItem>();
      for (const r of prev) map.set(r.clie_idno, r);
      for (const r of items) map.set(r.clie_idno, r);
      return Array.from(map.values());
    });
  }, [listQuery.data, offset]);

  // #endregion

  // #region Paging flags / actions

  const hasMore = !!listQuery.data?.page?.hasMore;
  const isLoading = listQuery.isLoading && offset === 0;
  const isLoadingMore = listQuery.isFetching && offset > 0;

  const loadMore = useCallback(() => {
    if (!hasMore || listQuery.isFetching) return;
    setOffset((v) => v + PAGE_LIMIT);
  }, [hasMore, listQuery.isFetching]);

  const resetPaging = useCallback(() => {
    setAccRows([]);
    setOffset(0);
  }, []);

  // #endregion

  // #region Empty state

  const hasData = accRows.length > 0;

  const emptyTitle = search.trim() ? "검색 결과가 없어요" : "아직 거래처가 없어요";
  const emptyDesc = search.trim()
    ? "검색어를 바꿔서 다시 시도해보세요."
    : "거래처를 등록하면 영업/수주 기록을 빠르게 연결할 수 있어요.";

  // #endregion

  // #region Status

  const status: PageStatus = isLoading ? "loading" : hasData ? "ready" : "empty";

  // #endregion

  // #region Actions

  const handleSearch = (value: string) => {
    resetPaging();
    const q = value.trim();
    navigate(q ? `/clie-list?search=${encodeURIComponent(q)}` : "/clie-list", {
      replace: true,
    });
  };

  const handleClear = () => {
    resetPaging();
    navigate("/clie-list", { replace: true });
  };

  const refresh = useCallback(async () => {
    resetPaging();
    await utils.crm.client.list.invalidate();
  }, [resetPaging, utils]);

  // #endregion

  // #region Template Download
  const downloadTemplate = () => {
    const headers = ["거래처명", "사업자번호", "업종", "주소", "담당자명", "연락처", "이메일"];
    const example = ["예시회사", "1234567890", "제조업", "서울시 강남구 테헤란로 123", "홍길동", "010-1234-5678", "example@company.com"];

    const csv = [headers, example]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\r\n");

    // BOM: Excel에서 한글 UTF-8 깨짐 방지
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "거래처_업로드_양식.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  // #endregion

  // #region Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadGuide, setShowUploadGuide] = useState(false);

  const openUploadGuide = () => setShowUploadGuide(true);
  const closeUploadGuide = () => setShowUploadGuide(false);

  const openUploadPicker = () => {
    setShowUploadGuide(false);
    fileInputRef.current?.click();
  };

  const handleUploadFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await uploadMutation.mutateAsync({ fileBase64: base64, fileName: file.name });
      setUploadResult(result);

      // 업로드 후 첫 페이지부터 다시 로드
      await refresh();

      if (result.failed === 0) {
        toast.success(`거래처 업로드 완료: 신규 ${result.inserted}건, 업데이트 ${result.updated}건`);
      }
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearUploadResult = () => setUploadResult(null);
  // #endregion

  // #region Public API

  return {
    // state
    search,

    // data
    items: accRows,

    // pagination
    hasMore,
    isLoadingMore,
    loadMore,

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

    // upload guide modal
    showUploadGuide,
    openUploadGuide,
    closeUploadGuide,

    // upload
    fileInputRef,
    uploadResult,
    isUploading,
    openUploadPicker,
    handleUploadFile,
    clearUploadResult,
    downloadTemplate,
  };

  // #endregion
}
