import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { toLocalDatetimeInputValue, toLocalDateInputValue } from "@/lib/utils";
import { usePromisesViewModel } from "./usePromisesViewModel";
import type { TabKey } from "./usePromisesViewModel";
import { usePromiseActions } from "./usePromiseActions";
import { usePromiseAlerts } from "@/hooks/usePromiseAlerts";
import type { PromiseFormState, ConfirmState, EnhancedPromise } from "@/types/promise";
import type { OrderQuickFormState } from "@/types/order";
import type { TabPill } from "@/components/focuswin/tab-pills";

export function usePromisesPageViewModel() {
  const { activeTab, setActiveTab, isLoading, displayList, counts, overdueInList, imminentInList } =
    usePromisesViewModel();

  usePromiseAlerts(overdueInList, imminentInList);

  const actions = usePromiseActions();

  // ── Promise form ──────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PromiseFormState>({
    clientName: "",
    clientId: undefined,
    title: "",
    description: "",
    scheduledAt: "",
  });

  // ── Order quick-create ────────────────────────────────────────────────────
  const [selectedPromise, setSelectedPromise] = useState<EnhancedPromise | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderQuickFormState>({
    productService: "",
    amount: "",
    status: "proposal",
    contractDate: "",
    notes: "",
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
    setForm({ clientName: "", clientId: undefined, title: "", description: "", scheduledAt: "" });
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.scheduledAt) return toast.error("제목과 일시를 입력해주세요.");
    try {
      await actions.createPromise({
        clientId: form.clientId,
        clientName: form.clientName || undefined,
        title: form.title,
        description: form.description || undefined,
        scheduledAt: form.scheduledAt,
      });
      toast.success("일정이 등록되었습니다.");
      setShowForm(false);
      resetForm();
    } catch {
      toast.error("등록에 실패했습니다.");
    }
  };

  const handleEdit = (p: EnhancedPromise) => {
    setEditingId(p.id);
    setForm({
      clientName: p.clientName || "",
      clientId: p.clientId ?? undefined,
      title: p.title,
      description: p.description || "",
      scheduledAt: toLocalDatetimeInputValue(new Date(p.scheduledAt)),
    });
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!form.title || !form.scheduledAt) return toast.error("제목과 일시를 입력해주세요.");
    try {
      await actions.updatePromise({
        id: editingId,
        title: form.title,
        clientName: form.clientName || undefined,
        description: form.description || undefined,
        scheduledAt: form.scheduledAt,
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
      await actions.deletePromise({ id });
      toast.success("삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await actions.completePromise({ id });
      toast.success("완료 처리되었습니다.");
    } catch {
      toast.error("처리에 실패했습니다.");
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await actions.cancelPromise({ id });
      toast.success("취소되었습니다.");
    } catch {
      toast.error("처리에 실패했습니다.");
    }
  };

  const requestCancel = (p: EnhancedPromise) =>
    setConfirm({ type: "cancel", id: p.id, title: p.title });

  const requestDelete = (p: EnhancedPromise) =>
    setConfirm({ type: "delete", id: p.id, title: p.title });

  const handleConfirm = async (c: NonNullable<ConfirmState>) => {
    if (c.type === "delete") await handleDelete(c.id);
    if (c.type === "cancel") await handleCancel(c.id);
  };

  // ── Order form ────────────────────────────────────────────────────────────
  const openOrderForm = (p: EnhancedPromise) => {
    setSelectedPromise(p);
    setOrderForm({
      productService: "",
      amount: "",
      status: "proposal",
      contractDate: toLocalDateInputValue(new Date(p.scheduledAt)),
      notes: p.description || "",
    });
    setShowOrderForm(true);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromise || !orderForm.productService || !orderForm.amount)
      return toast.error("필수 항목을 입력해주세요.");
    try {
      await actions.createOrderAndCompletePromise({
        order: {
          clientName: selectedPromise.clientName || "",
          productService: orderForm.productService,
          amount: Number(orderForm.amount),
          status: orderForm.status,
          contractDate: orderForm.contractDate || undefined,
          notes: orderForm.notes || undefined,
        },
        promiseId: selectedPromise.id,
      });
      toast.success("수주가 생성되었습니다.");
      setShowOrderForm(false);
      setSelectedPromise(null);
      setOrderForm({ productService: "", amount: "", status: "proposal", contractDate: "", notes: "" });
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
