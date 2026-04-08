// hooks/focuswin/schedule/useScheduleDetailVM.tsx

import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { Edit2, Trash2, X } from "lucide-react";

import { trpc } from "@/lib/trpc";
import { handleApiError } from "@/lib/handleApiError";
import { buildDeleteConfirm, buildConfirm } from "@/lib/confirm";
import { toLocalDatetimeInputValue, toLocalDateInputValue } from "@/lib/utils";
import { formatKRW } from "@/lib/format";

import { useScheduleActions } from "./useScheduleActions";

import type { PageStatus } from "@/components/focuswin/common/page/scaffold/page-scaffold";
import type { ConfirmState, OrderQuickFormState } from "@/types";
import type { ScheduleFormState } from "@/types/schedule";

const EMPTY_FORM: ScheduleFormState = {
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

export function useScheduleDetailVM(scheId: number) {
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const actions = useScheduleActions();

  // #region Query
  const scheduleQuery = trpc.crm.schedule.get.useQuery(
    { sche_idno: scheId },
    { enabled: !!scheId && scheId > 0, staleTime: 10_000 }
  );

  // 이 일정에서 생성된 수주 목록
  const linkedOrdersQuery = trpc.crm.order.list.useQuery(
    { sche_idno: scheId },
    { enabled: !!scheId && scheId > 0, staleTime: 30_000 }
  );

  // 연결된 수주들의 납품 목록 (첫 번째 수주 기준)
  const firstOrderId = linkedOrdersQuery.data?.items?.[0]?.orde_idno;
  const linkedShipmentsQuery = trpc.crm.shipment.list.useQuery(
    { orde_idno: firstOrderId! },
    { enabled: !!firstOrderId, staleTime: 30_000 }
  );
  // #endregion

  const schedule = scheduleQuery.data ?? null;

  // #region Page status
  const isLoading = scheduleQuery.isLoading;
  const isInvalid = !isLoading && !schedule;
  const pageStatus: PageStatus = isLoading ? "loading" : isInvalid ? "empty" : "ready";
  // #endregion

  // #region Inline edit
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ScheduleFormState>(EMPTY_FORM);

  // ?edit=1 진입 시 데이터 로드 후 자동 편집 모드
  useEffect(() => {
    if (!schedule || isEditing) return;
    if (new URLSearchParams(searchStr).get("edit") === "1") startEdit();
  }, [schedule, searchStr]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = useCallback(() => {
    if (!schedule) return;
    setForm({
      clie_name: schedule.clie_name || "",
      clie_idno: schedule.clie_idno ?? undefined,
      sche_name: schedule.sche_name,
      sche_desc: schedule.sche_desc || "",
      sche_date: toLocalDatetimeInputValue(new Date(schedule.sche_date)),
      stat_code: schedule.sche_stat === "overdue" ? "scheduled" : schedule.sche_stat as "scheduled" | "completed" | "canceled",
    });
    setIsEditing(true);
  }, [schedule]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setForm(EMPTY_FORM);
  }, []);

  const handleSave = useCallback(async () => {
    if (!schedule) return;
    if (!form.sche_name || !form.sche_date) {
      toast.error("제목과 일시를 입력해주세요.");
      return;
    }
    try {
      await actions.updateSchedule({
        sche_idno: schedule.sche_idno,
        sche_name: form.sche_name,
        clie_name: form.clie_name || undefined,
        sche_desc: form.sche_desc || undefined,
        sche_date: form.sche_date,
        sche_stat: form.stat_code,
      });
      await scheduleQuery.refetch();
      toast.success("저장되었습니다.");
      setIsEditing(false);
    } catch (e) {
      handleApiError(e);
    }
  }, [actions, form, schedule, scheduleQuery]);
  // #endregion

  // #region Confirm dialog
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const requestDelete = useCallback(() => {
    if (!schedule) return;
    setConfirm(
      buildDeleteConfirm({
        kind: "schedule",
        id: schedule.sche_idno,
        title: "해당 일정",
        metas: [
          { label: "일정명", value: schedule.sche_name },
          { label: "날짜", value: new Date(schedule.sche_date).toLocaleDateString("ko-KR") },
          { label: "거래처", value: schedule.clie_name || "-" },
        ],
      })
    );
  }, [schedule]);

  const requestComplete = useCallback(() => {
    if (!schedule) return;
    setConfirm(
      buildConfirm("complete", {
        kind: "schedule",
        id: schedule.sche_idno,
        title: schedule.sche_name,
        metas: [
          { label: "일정명", value: schedule.sche_name },
          { label: "날짜", value: new Date(schedule.sche_date).toLocaleDateString("ko-KR") },
          { label: "거래처", value: schedule.clie_name || "-" },
        ],
      })
    );
  }, [schedule]);

  const handleConfirm = useCallback(async (c: NonNullable<ConfirmState>) => {
    if (c.intent === "delete") {
      try {
        await actions.deleteSchedule({ sche_idno: c.target.id });
        toast.success("삭제되었습니다.");
        navigate("/sche-list");
      } catch (e) {
        handleApiError(e);
      }
    }
    if (c.intent === "complete") {
      try {
        await actions.completeSchedule({ sche_idno: c.target.id });
        await scheduleQuery.refetch();
        toast.success("완료 처리되었습니다.");
      } catch (e) {
        handleApiError(e);
      }
    }
  }, [actions, navigate, scheduleQuery]);
  // #endregion

  // #region Cancel
  const handleCancel = useCallback(async () => {
    if (!schedule) return;
    try {
      await actions.cancelSchedule({ sche_idno: schedule.sche_idno });
      await scheduleQuery.refetch();
      toast.success("취소 처리되었습니다.");
    } catch (e) {
      handleApiError(e);
    }
  }, [actions, schedule, scheduleQuery]);
  // #endregion

  // #region Order quick-create
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderQuickFormState>(EMPTY_ORDER_FORM);

  const openOrderForm = useCallback(() => {
    if (!schedule) return;
    setOrderForm({
      ...EMPTY_ORDER_FORM,
      orde_pric: schedule.sche_pric ? String(Math.round(Number(schedule.sche_pric))) : "",
      ctrt_date: toLocalDateInputValue(new Date(schedule.sche_date)),
      orde_memo: schedule.sche_desc || "",
    });
    setShowOrderForm(true);
  }, [schedule]);

  const handleCreateOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedule || !orderForm.prod_serv || !orderForm.orde_pric) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }
    try {
      await actions.createOrderAndCompleteSchedule({
        order: {
          clie_idno: schedule.clie_idno ?? undefined,
          clie_name: schedule.clie_name || "",
          prod_serv: orderForm.prod_serv,
          orde_pric: Number(orderForm.orde_pric),
          orde_stat: orderForm.orde_stat,
          ctrt_date: orderForm.ctrt_date || undefined,
          orde_memo: orderForm.orde_memo || undefined,
        },
        scheduleId: schedule.sche_idno,
      });
      await scheduleQuery.refetch();
      toast.success("수주가 생성되었습니다.");
      setShowOrderForm(false);
      setOrderForm(EMPTY_ORDER_FORM);
    } catch (e) {
      handleApiError(e);
    }
  }, [actions, orderForm, schedule, scheduleQuery]);
  // #endregion

  // #region Header actions & primary action
  const isScheduled = schedule?.sche_stat === "scheduled" || schedule?.sche_stat === "overdue";

  const headerActions = isEditing
    ? [{ label: "취소", icon: <X size={14} />, onClick: cancelEdit, variant: "ghost" as const }]
    : schedule
    ? [
        { label: "수정", icon: <Edit2 size={14} />, onClick: startEdit, variant: "ghost" as const },
        { label: "삭제", icon: <Trash2 size={14} />, onClick: requestDelete, variant: "ghost" as const },
      ]
    : [];

  const primaryAction = isEditing
    ? { label: "저장", onClick: handleSave, variant: "primary" as const, disabled: actions.update.isPending }
    : isScheduled
    ? { label: "완료 처리", onClick: requestComplete, variant: "primary" as const, disabled: actions.complete.isPending }
    : undefined;
  // #endregion

  return {
    schedule,
    pageStatus,
    isInvalid,
    goList: () => window.history.back(),

    // inline edit
    isEditing,
    form,
    setForm,
    startEdit,
    cancelEdit,
    handleSave,

    // confirm
    confirm,
    setConfirm,
    requestDelete,
    requestComplete,
    handleConfirm,

    // cancel
    handleCancel,
    isCancelPending: actions.cancel.isPending,

    // order form
    showOrderForm,
    setShowOrderForm,
    orderForm,
    setOrderForm,
    openOrderForm,
    handleCreateOrder,
    isOrderSubmitting: actions.createOrder.isPending,

    // header
    headerActions,
    primaryAction,

    // linked data
    linkedOrders: linkedOrdersQuery.data?.items ?? [],
    linkedShipments: linkedShipmentsQuery.data?.items ?? [],

    // helpers
    formatKRW,
  };
}
