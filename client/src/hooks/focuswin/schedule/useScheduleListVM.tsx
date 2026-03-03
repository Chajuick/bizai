// src/hooks/focuswin/schedule/useScheduleListVM.ts

// #region Imports
import React, { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { toLocalDatetimeInputValue, toLocalDateInputValue } from "@/lib/utils";

import { useScheduleVM } from "./useScheduleVM";
import type { TabKey } from "./useScheduleVM";

import { useScheduleActions } from "./useScheduleActions";
import { useScheduleAlerts } from "@/hooks/focuswin/schedule/useScheduleAlerts";

import type { ScheduleFormState, EnhancedSchedule, ConfirmState, OrderQuickFormState } from "@/types/";
import type { TabPill } from "@/components/focuswin/common/ui/tab-pills";

import ListNotice from "@/components/focuswin/schedule/list/ListNotice";
import ScheduleListFormModal from "@/components/focuswin/schedule/list/FormModal";
import CreateOrderModal from "@/components/focuswin/schedule/list/CreateOrderModal";
import ConfirmActionDialog from "@/components/focuswin/common/confirm-action-dialog";
import { PageStatus } from "@/components/focuswin/common/page-scaffold";
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
  stat_code: "proposal",
  ctrt_date: "",
  orde_memo: "",
};
// #endregion

export function useScheduleListVM() {
  // #region Base VM (list/tabs/paging)
  const { activeTab, setActiveTab, isLoading, isLoadingMore, list, displayList, counts, overdueInList, imminentInList, hasMore, loadMore, refresh } = useScheduleVM();

  const hasData = displayList.length > 0;

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

  // #region Notice (VM 내부에서 생성)
  const notice =
    overdueInList > 0 || imminentInList > 0 ? (
      <ListNotice tone={overdueInList > 0 ? "warning" : "primary"}>
        {overdueInList > 0 ? `지연 ${overdueInList}건` : null}
        {overdueInList > 0 && imminentInList > 0 ? " · " : null}
        {imminentInList > 0 ? `임박 ${imminentInList}건` : null}이 있어요.
      </ListNotice>
    ) : undefined;
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

  const requestCancel = useCallback((p: EnhancedSchedule) => setConfirm({ type: "cancel", id: p.sche_idno, title: p.sche_name }), []);

  const requestDelete = useCallback((p: EnhancedSchedule) => setConfirm({ type: "delete", id: p.sche_idno, title: p.sche_name }), []);

  const requestComplete = useCallback((p: EnhancedSchedule) => setConfirm({ type: "complete", id: p.sche_idno, title: p.sche_name }), []);
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
      } catch {
        toast.error("등록에 실패했습니다.");
      }
    },
    [actions, form, resetForm]
  );

  const handleEdit = useCallback((p: EnhancedSchedule) => {
    setEditingId(p.sche_idno);
    setForm({
      clie_name: p.clie_name || "",
      clie_idno: p.clie_idno ?? undefined,
      sche_name: p.sche_name,
      sche_desc: p.sche_desc || "",
      sche_date: toLocalDatetimeInputValue(new Date(p.sche_date)),
    });
    setShowForm(true);
  }, []);

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
        });

        toast.success("일정이 수정되었습니다.");
        setShowForm(false);
        resetForm();
      } catch {
        toast.error("수정에 실패했습니다.");
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
      } catch {
        toast.error("삭제에 실패했습니다.");
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
      } catch {
        toast.error("처리에 실패했습니다.");
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
      } catch {
        toast.error("처리에 실패했습니다.");
      }
    },
    [actions]
  );

  const handleConfirm = useCallback(
    async (c: NonNullable<ConfirmState>) => {
      if (c.type === "delete") await handleDelete(c.id);
      if (c.type === "cancel") await handleCancel(c.id);
      if (c.type === "complete") await handleComplete(c.id);
    },
    [handleCancel, handleDelete, handleComplete]
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
            clie_name: selectedSchedule.clie_name || "",
            prod_serv: orderForm.prod_serv,
            orde_pric: Number(orderForm.orde_pric),
            stat_code: orderForm.stat_code,
            ctrt_date: orderForm.ctrt_date || undefined,
            orde_memo: orderForm.orde_memo || undefined,
          },
          scheduleId: selectedSchedule.sche_idno,
        });

        toast.success("수주가 생성되었습니다.");
        setShowOrderForm(false);
        setSelectedSchedule(null);
        setOrderForm(EMPTY_ORDER_FORM);
      } catch {
        toast.error("수주 생성에 실패했습니다.");
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

  // #region Modals (VM이 렌더 담당)
  const modals = useMemo(() => {
    return (
      <>
        <ScheduleListFormModal
          open={showForm}
          onOpenChange={handleFormOpenChange}
          editing={!!editingId}
          form={form}
          setForm={setForm}
          onSubmit={editingId ? handleUpdate : handleCreate}
          isSubmitting={isSubmitting}
        />

        <CreateOrderModal
          open={showOrderForm}
          onOpenChange={setShowOrderForm}
          selectedPromise={selectedSchedule}
          orderForm={orderForm}
          setOrderForm={setOrderForm}
          onSubmit={handleCreateOrder}
          isSubmitting={createOrderPending}
        />

        <ConfirmActionDialog confirm={confirm} setConfirm={setConfirm} onConfirm={handleConfirm} />
      </>
    );
  }, [
    showForm,
    handleFormOpenChange,
    editingId,
    form,
    handleUpdate,
    handleCreate,
    isSubmitting,

    showOrderForm,
    selectedSchedule,
    orderForm,
    handleCreateOrder,
    createOrderPending,

    confirm,
    handleConfirm,
  ]);
  // #endregion

  return {
    // Page-level (SaleRegistPage 스타일)
    status,
    notice,
    modals,

    // list / tab
    activeTab,
    setActiveTab,
    isLoading,
    displayList,
    hasData,
    statusTabs,
    overdueInList,
    imminentInList,

    // paging
    hasMore,
    loadMore,
    isLoadingMore,

    // schedule form triggers
    openCreate,
    handleFormOpenChange,

    // card actions
    openOrderForm,
    handleEdit,
    requestCancel,
    requestDelete,
    requestComplete,

    // misc state needed by children (HeadContent/Content에서 쓰는 경우)
    completePending,
  };
}
