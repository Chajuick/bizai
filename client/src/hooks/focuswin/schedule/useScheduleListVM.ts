// src/hooks/focuswin/schedule/useScheduleListVM.ts

// #region Imports
import { useCallback, useMemo, useState } from "react";
import { useLocation, useSearch, useRoute } from "wouter";
import { toast } from "sonner";
import { handleApiError } from "@/lib/handleApiError";


import { toLocalDatetimeInputValue, toLocalDateInputValue } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

import { useScheduleVM } from "./useScheduleVM";
import type { TabKey } from "./useScheduleVM";

import { useScheduleActions } from "./useScheduleActions";
import { useScheduleAlerts } from "@/hooks/focuswin/schedule/useScheduleAlerts";

import type { ScheduleFormState, EnhancedSchedule, ConfirmState, OrderQuickFormState } from "@/types/";
import type { TabPill } from "@/components/focuswin/common/ui/tab-pills";
import { PageStatus } from "@/components/focuswin/common/page/scaffold/page-scaffold";
import { buildDeleteConfirm, buildConfirm } from "@/lib/confirm";
// #endregion

// #region Constants
const EMPTY_SCHEDULE_FORM: ScheduleFormState = {
  clie_name: "",
  clie_idno: undefined,
  sche_name: "",
  sche_desc: "",
  sche_date: "",
};

const EMPTY_ORDER_FORM: OrderQuickFormState = {
  prod_serv: "",
  orde_pric: "",
  orde_stat: "proposal",
  ctrt_date: "",
  orde_memo: "",
};
// #endregion

export function useScheduleListVM() {
  // #region View toggle (list / calendar) — URL param ?view=calendar
  const [, setLocation] = useLocation();
  const urlSearch = useSearch();

  const view: "list" | "calendar" = new URLSearchParams(urlSearch).get("view") === "calendar" ? "calendar" : "list";

  const setView = useCallback((v: "list" | "calendar") => {
    const params = new URLSearchParams(urlSearch);
    if (v === "calendar") params.set("view", "calendar");
    else params.delete("view");
    const qs = params.toString();
    setLocation(qs ? `/sche-list?${qs}` : "/sche-list");
  }, [urlSearch, setLocation]);
  // #endregion

  // #region Calendar month state
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth() + 1); // 1-based

  const prevMonth = useCallback(() => {
    setCalendarMonth((m) => {
      if (m === 1) { setCalendarYear((y) => y - 1); return 12; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setCalendarMonth((m) => {
      if (m === 12) { setCalendarYear((y) => y + 1); return 1; }
      return m + 1;
    });
  }, []);
  // #endregion

  // #region Calendar query
  const calendarQuery = trpc.crm.schedule.calendarList.useQuery(
    { year: calendarYear, month: calendarMonth },
    { enabled: view === "calendar", staleTime: 10_000 }
  );
  // #endregion

  // #region Base VM (list/tabs/paging)
  const { activeTab, setActiveTab, isLoading, isLoadingMore, list, displayList, counts, overdueInList, imminentInList, hasMore, loadMore, refresh } = useScheduleVM();

  // #region Search
  const [search, setSearch] = useState("");

  const handleSearch = useCallback((value: string) => setSearch(value), []);
  const handleClear = useCallback(() => setSearch(""), []);
  // #endregion

  // 검색어 클라이언트 필터링
  const filteredDisplayList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return displayList;
    return displayList.filter((s) =>
      s.sche_name.toLowerCase().includes(q) ||
      (s.clie_name ?? "").toLowerCase().includes(q) ||
      (s.sche_desc ?? "").toLowerCase().includes(q)
    );
  }, [displayList, search]);

  const hasData = filteredDisplayList.length > 0;

  // 페이지 공통 status 규칙
  const status: PageStatus = isLoading ? "loading" : hasData ? "ready" : "empty";
  // #endregion

  // #region Tabs
  const statusTabs = useMemo<TabPill<TabKey>[]>(() => {
    return [
      { key: "all", label: "전체", count: counts.all },
      { key: "scheduled", label: "예정", count: counts.scheduled },
      { key: "imminent", label: "임박", count: counts.imminent },
      { key: "overdue", label: "지연", count: counts.overdue },
      { key: "completed", label: "완료", count: counts.completed },
      { key: "canceled", label: "취소", count: counts.canceled },
    ];
  }, [counts]);
  // #endregion

  // #region Alerts
  useScheduleAlerts({ list, overdueCount: overdueInList, imminentCount: imminentInList });
  // #endregion

  // #region Actions
  const actions = useScheduleActions();
  // #endregion

  // #region Schedule form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ScheduleFormState>(EMPTY_SCHEDULE_FORM);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_SCHEDULE_FORM);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setShowForm(true);
  }, [resetForm]);

  // 캘린더에서 날짜 클릭 → 해당 날짜 09:00 KST로 생성 모달 오픈
  const openCreateForDate = useCallback((dateStr: string) => {
    // dateStr: "2026-03-15" (KST 날짜)
    const dt = new Date(`${dateStr}T09:00:00+09:00`);
    resetForm();
    setForm((f) => ({ ...f, sche_date: toLocalDatetimeInputValue(dt) }));
    setShowForm(true);
  }, [resetForm, setForm]);

  const handleFormOpenChange = useCallback(
    (open: boolean) => {
      setShowForm(open);
      if (!open) resetForm();
    },
    [resetForm]
  );
  // #endregion

  // #region Order quick-create state
  const [selectedSchedule, setSelectedSchedule] = useState<EnhancedSchedule | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderQuickFormState>(EMPTY_ORDER_FORM);

  const openOrderForm = useCallback((p: EnhancedSchedule) => {
    setSelectedSchedule(p);
    setOrderForm({
      ...EMPTY_ORDER_FORM,
      orde_pric: p.sche_pric ? String(Math.round(Number(p.sche_pric))) : "",
      ctrt_date: toLocalDateInputValue(new Date(p.sche_date)),
      orde_memo: p.sche_desc || "",
    });
    setShowOrderForm(true);
  }, []);
  // #endregion

  // #region Confirm dialog state
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const requestDelete = useCallback((p: EnhancedSchedule) => {
    setConfirm(
      buildDeleteConfirm({
        kind: "schedule",
        id: p.sche_idno,
        title: "해당 일정",
        metas: [
          { label: "일정명", value: p.sche_name },
          { label: "날짜", value: new Date(p.sche_date).toLocaleDateString("ko-KR") },
          { label: "거래처", value: p.clie_name || "-" },
        ],
      })
    );
  }, []);

  const requestComplete = useCallback((p: EnhancedSchedule) => {
    setConfirm(
      buildConfirm("complete", {
        kind: "schedule",
        id: p.sche_idno,
        title: p.sche_name,
        metas: [
          { label: "일정명", value: p.sche_name },
          { label: "날짜", value: new Date(p.sche_date).toLocaleDateString("ko-KR") },
          { label: "거래처", value: p.clie_name || "-" },
        ],
      })
    );
  }, []);
  // #endregion

  // #region CRUD handlers
  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.sche_name || !form.sche_date) return toast.error("제목과 일시를 입력해주세요.");

      try {
        await actions.createSchedule({
          clie_idno: form.clie_idno,
          clie_name: form.clie_name || undefined,
          sche_name: form.sche_name,
          sche_desc: form.sche_desc || undefined,
          sche_date: form.sche_date,
        });

        toast.success("일정이 등록되었습니다.");
        setShowForm(false);
        resetForm();
      } catch (e) {
        handleApiError(e);
      }
    },
    [actions, form, resetForm]
  );

  const handleEdit = useCallback((p: EnhancedSchedule) => {
    setLocation(`/sche-list/${p.sche_idno}?edit=1`);
  }, [setLocation]);

  const handleUpdate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingId) return;
      if (!form.sche_name || !form.sche_date) return toast.error("제목과 일시를 입력해주세요.");

      try {
        await actions.updateSchedule({
          sche_idno: editingId,
          sche_name: form.sche_name,
          clie_name: form.clie_name || undefined,
          sche_desc: form.sche_desc || undefined,
          sche_date: form.sche_date,
          sche_stat: form.stat_code,
        });

        toast.success("일정이 수정되었습니다.");
        setShowForm(false);
        resetForm();
      } catch (e) {
        handleApiError(e);
      }
    },
    [actions, editingId, form, resetForm]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await actions.deleteSchedule({ sche_idno: id });
        toast.success("삭제되었습니다.");
        refresh();
      } catch (e) {
        handleApiError(e);
      }
    },
    [actions]
  );

  const handleComplete = useCallback(
    async (id: number) => {
      try {
        await actions.completeSchedule({ sche_idno: id });
        toast.success("완료 처리되었습니다.");
        refresh();
      } catch (e) {
        handleApiError(e);
      }
    },
    [actions]
  );

  const handleCancel = useCallback(
    async (id: number) => {
      try {
        await actions.cancelSchedule({ sche_idno: id });
        toast.success("취소 처리되었습니다.");
        refresh();
      } catch (e) {
        handleApiError(e);
      }
    },
    [actions, refresh]
  );

  const requestCancel = useCallback((p: EnhancedSchedule) => handleCancel(p.sche_idno), [handleCancel]);

  const handleConfirm = useCallback(
    async (c: NonNullable<ConfirmState>) => {
      if (c.intent === "delete") await handleDelete(c.target.id);
      if (c.intent === "complete") await handleComplete(c.target.id);
    },
    [handleDelete, handleComplete]
  );
  // #endregion

  // #region Create Order handler
  const handleCreateOrder = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedSchedule || !orderForm.prod_serv || !orderForm.orde_pric) return toast.error("필수 항목을 입력해주세요.");

      try {
        await actions.createOrderAndCompleteSchedule({
          order: {
            clie_idno: selectedSchedule.clie_idno ?? undefined,
            clie_name: selectedSchedule.clie_name || "",
            prod_serv: orderForm.prod_serv,
            orde_pric: Number(orderForm.orde_pric),
            orde_stat: orderForm.orde_stat,
            ctrt_date: orderForm.ctrt_date || undefined,
            orde_memo: orderForm.orde_memo || undefined,
          },
          scheduleId: selectedSchedule.sche_idno,
        });

        toast.success("수주가 생성되었습니다.");
        setShowOrderForm(false);
        setSelectedSchedule(null);
        setOrderForm(EMPTY_ORDER_FORM);
      } catch (e) {
        handleApiError(e);
      }
    },
    [actions, orderForm, selectedSchedule]
  );
  // #endregion

  // #region Derived flags
  const isSubmitting = actions.create.isPending || actions.update.isPending;
  const createOrderPending = actions.createOrder.isPending;
  const completePending = actions.complete.isPending;
  // #endregion

  // #region Modal props (ScheduleModals 컴포넌트에 전달, VM은 상태/핸들러만 제공)
  const modalProps = {
    // 일정 폼 모달
    showForm,
    onFormOpenChange: handleFormOpenChange,
    editingId,
    form,
    setForm,
    onFormSubmit: editingId ? handleUpdate : handleCreate,
    isFormSubmitting: isSubmitting,
    // 수주 생성 모달
    showOrderForm,
    onOrderOpenChange: setShowOrderForm,
    selectedSchedule,
    orderForm,
    setOrderForm,
    onOrderSubmit: handleCreateOrder,
    isOrderSubmitting: createOrderPending,
    // 확인 다이얼로그
    confirm,
    setConfirm,
    onConfirm: handleConfirm,
  };
  // #endregion

  return {
    // Page-level
    status,

    // view toggle
    view,
    setView,

    // search
    search,
    handleSearch,
    handleClear,

    // list / tab
    activeTab,
    setActiveTab,
    isLoading,
    displayList: filteredDisplayList,
    hasData,
    statusTabs,
    overdueInList,
    imminentInList,

    // paging
    hasMore,
    loadMore,
    isLoadingMore,

    // calendar
    calendarYear,
    calendarMonth,
    prevMonth,
    nextMonth,
    calendarItems: (calendarQuery.data ?? []) as EnhancedSchedule[],
    isCalendarLoading: calendarQuery.isLoading,

    // schedule form triggers
    openCreate,
    openCreateForDate,
    handleFormOpenChange,

    // card actions
    openOrderForm,
    handleEdit,
    requestCancel,
    requestDelete,
    requestComplete,

    // misc state needed by children
    completePending,

    // modal props → ScheduleModals 컴포넌트에 spread
    modalProps,
  };
}
