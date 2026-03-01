import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { toLocalDatetimeInputValue, toLocalDateInputValue } from "@/lib/utils";
import { usePromisesViewModel } from "./usePromisesViewModel";
import type { TabKey } from "./usePromisesViewModel";
import { usePromiseActions } from "./usePromiseActions";
import { usePromiseAlerts } from "@/hooks/usePromiseAlerts";
import type { PromiseFormState, ConfirmState, EnhancedPromise } from "@/types/promise";
import type { OrderQuickFormState } from "@/types/order";
import type { TabPill } from "@/components/focuswin/common/ui/tab-pills";

export function usePromisesPageViewModel() {
  const { activeTab, setActiveTab, isLoading, displayList, counts, overdueInList, imminentInList } =
    usePromisesViewModel();

  usePromiseAlerts(overdueInList, imminentInList);

  const actions = usePromiseActions();

  // ── Promise form ──────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PromiseFormState>({
    clie_name: "",
    clie_idno: undefined,
    sche_name: "",
    sche_desc: "",
    sche_date: "",
  });

  // ── Order quick-create ────────────────────────────────────────────────────
  const [selectedPromise, setSelectedPromise] = useState<EnhancedPromise | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderQuickFormState>({
    prod_serv: "",
    orde_pric: "",
    stat_code: "proposal",
    ctrt_date: "",
    orde_memo: "",
  });

  // ── Confirm dialog ────────────────────────────────────────────────────────
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const statusTabs = useMemo<TabPill<TabKey>[]>(
    () => [
      { key: "all", label: "전체", count: counts.all },
      { key: "imminent", label: "임박", count: counts.imminent },
      { key: "scheduled", label: "예정", count: counts.scheduled },
      { key: "completed", label: "완료", count: counts.completed },
      { key: "overdue", label: "지연", count: counts.overdue },
      { key: "canceled", label: "취소", count: counts.canceled },
    ],
    [counts]
  );

  const hasData = displayList.length > 0;

  // ── Form helpers ──────────────────────────────────────────────────────────
  const resetForm = () => {
    setEditingId(null);
    setForm({ clie_name: "", clie_idno: undefined, sche_name: "", sche_desc: "", sche_date: "" });
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sche_name || !form.sche_date) return toast.error("제목과 일시를 입력해주세요.");
    try {
      await actions.createPromise({
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
  };

  const handleEdit = (p: EnhancedPromise) => {
    setEditingId(p.sche_idno);
    setForm({
      clie_name: p.clie_name || "",
      clie_idno: p.clie_idno ?? undefined,
      sche_name: p.sche_name,
      sche_desc: p.sche_desc || "",
      sche_date: toLocalDatetimeInputValue(new Date(p.sche_date)),
    });
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!form.sche_name || !form.sche_date) return toast.error("제목과 일시를 입력해주세요.");
    try {
      await actions.updatePromise({
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
  };

  const handleDelete = async (id: number) => {
    try {
      await actions.deletePromise({ sche_idno: id });
      toast.success("삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await actions.completePromise({ sche_idno: id });
      toast.success("완료 처리되었습니다.");
    } catch {
      toast.error("처리에 실패했습니다.");
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await actions.cancelPromise({ sche_idno: id });
      toast.success("취소되었습니다.");
    } catch {
      toast.error("처리에 실패했습니다.");
    }
  };

  const requestCancel = (p: EnhancedPromise) =>
    setConfirm({ type: "cancel", id: p.sche_idno, title: p.sche_name });

  const requestDelete = (p: EnhancedPromise) =>
    setConfirm({ type: "delete", id: p.sche_idno, title: p.sche_name });

  const handleConfirm = async (c: NonNullable<ConfirmState>) => {
    if (c.type === "delete") await handleDelete(c.id);
    if (c.type === "cancel") await handleCancel(c.id);
  };

  // ── Order form ────────────────────────────────────────────────────────────
  const openOrderForm = (p: EnhancedPromise) => {
    setSelectedPromise(p);
    setOrderForm({
      prod_serv: "",
      orde_pric: p.sche_pric ? String(Math.round(Number(p.sche_pric))) : "",
      stat_code: "proposal",
      ctrt_date: toLocalDateInputValue(new Date(p.sche_date)),
      orde_memo: p.sche_desc || "",
    });
    setShowOrderForm(true);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromise || !orderForm.prod_serv || !orderForm.orde_pric)
      return toast.error("필수 항목을 입력해주세요.");
    try {
      await actions.createOrderAndCompletePromise({
        order: {
          clie_name: selectedPromise.clie_name || "",
          prod_serv: orderForm.prod_serv,
          orde_pric: Number(orderForm.orde_pric),
          stat_code: orderForm.stat_code,
          ctrt_date: orderForm.ctrt_date || undefined,
          orde_memo: orderForm.orde_memo || undefined,
        },
        promiseId: selectedPromise.sche_idno,
      });
      toast.success("수주가 생성되었습니다.");
      setShowOrderForm(false);
      setSelectedPromise(null);
      setOrderForm({ prod_serv: "", orde_pric: "", stat_code: "proposal", ctrt_date: "", orde_memo: "" });
    } catch {
      toast.error("수주 생성에 실패했습니다.");
    }
  };

  return {
    // list / tab
    activeTab,
    setActiveTab,
    isLoading,
    displayList,
    hasData,
    statusTabs,
    overdueInList,
    imminentInList,

    // promise form
    showForm,
    setShowForm,
    editingId,
    form,
    setForm,
    openCreate,
    resetForm,
    handleCreate,
    handleEdit,
    handleUpdate,

    // actions
    handleComplete,
    requestCancel,
    requestDelete,
    completePending: actions.complete.isPending,
    isSubmitting: actions.create.isPending || actions.update.isPending,

    // confirm
    confirm,
    setConfirm,
    handleConfirm,

    // order form
    showOrderForm,
    setShowOrderForm,
    selectedPromise,
    orderForm,
    setOrderForm,
    openOrderForm,
    handleCreateOrder,
    createOrderPending: actions.createOrder.isPending,
  };
}
