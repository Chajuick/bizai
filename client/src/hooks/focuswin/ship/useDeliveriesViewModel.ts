// client/src/hooks/focuswin/deliveries/useDeliveriesViewModel.ts

import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatKRW } from "@/lib/format";
import type { DeliveryRow, DeliveryFormState, DeleteConfirmState, DeliveryStatus } from "@/types/delivery";

export function useDeliveriesViewModel() {
  const [activeTab, setActiveTab] = useState<DeliveryStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DeleteConfirmState>(null);

  const [form, setForm] = useState<DeliveryFormState>({
    orderId: "",
    clientName: "",
    revenueAmount: "",
    deliveryStatus: "pending",
    deliveredAt: "",
    notes: "",
  });

  const { data: deliveries, isLoading } = trpc.deliveries.list.useQuery(
    activeTab !== "all" ? { deliveryStatus: activeTab } : undefined
  );

  const { data: orders } = trpc.orders.list.useQuery({ status: "confirmed" });

  const createMutation = trpc.deliveries.create.useMutation();
  const updateMutation = trpc.deliveries.update.useMutation();
  const deleteMutation = trpc.deliveries.delete?.useMutation?.();
  const utils = trpc.useUtils();

  const resetForm = () => {
    setEditingId(null);
    setForm({
      orderId: "",
      clientName: "",
      revenueAmount: "",
      deliveryStatus: "pending",
      deliveredAt: "",
      notes: "",
    });
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const stats = useMemo(() => {
    const arr = deliveries ?? [];
    const paid = arr
      .filter((d) => d.deliveryStatus === "paid")
      .reduce((s, d) => s + Number(d.revenueAmount || 0), 0);
    const pending = arr
      .filter((d) => d.deliveryStatus !== "paid")
      .reduce((s, d) => s + Number(d.revenueAmount || 0), 0);
    return { paid, pending };
  }, [deliveries]);

  const invalidateAll = () => {
    utils.deliveries.list.invalidate();
    utils.dashboard.stats.invalidate();
  };

  const hasData = (deliveries?.length ?? 0) > 0;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleEdit = (d: DeliveryRow) => {
    setEditingId(d.id);
    setForm({
      orderId: d.orderId ? String(d.orderId) : "",
      clientName: d.clientName || "",
      revenueAmount: String(d.revenueAmount ?? ""),
      deliveryStatus: d.deliveryStatus,
      deliveredAt: d.deliveredAt ? new Date(d.deliveredAt).toISOString().split("T")[0] : "",
      notes: d.notes || "",
    });
    setShowForm(true);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !form.revenueAmount) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }
    const payload = {
      orderId: Number(form.orderId) || 0,
      clientName: form.clientName,
      revenueAmount: Number(form.revenueAmount),
      deliveryStatus: form.deliveryStatus,
      deliveredAt: form.deliveredAt || undefined,
      notes: form.notes || undefined,
    };
    try {
      if (!editingId) {
        await createMutation.mutateAsync(payload);
        toast.success("납품 건이 등록되었습니다.");
      } else {
        await updateMutation.mutateAsync({ id: editingId, ...payload });
        toast.success("납품 건이 수정되었습니다.");
      }
      invalidateAll();
      setShowForm(false);
      resetForm();
    } catch {
      toast.error(editingId ? "수정에 실패했습니다." : "등록에 실패했습니다.");
    }
  };

  const handleStatusUpdate = async (id: number, deliveryStatus: DeliveryStatus) => {
    try {
      await updateMutation.mutateAsync({ id, deliveryStatus });
      invalidateAll();
      toast.success("상태가 변경되었습니다.");
    } catch {
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!deleteMutation) {
      toast.error("삭제 API가 아직 연결되어 있지 않아요.");
      return;
    }
    try {
      await deleteMutation.mutateAsync({ id });
      invalidateAll();
      toast.success("삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  return {
    activeTab,
    setActiveTab,
    showForm,
    setShowForm,
    editingId,
    setEditingId,
    confirmDelete,
    setConfirmDelete,
    form,
    setForm,
    deliveries,
    orders,
    isLoading,
    hasData,
    stats,
    formatKRW,
    createMutation,
    updateMutation,
    deleteMutation,
    resetForm,
    openCreate,
    invalidateAll,
    isSubmitting,
    handleEdit,
    handleCreateOrUpdate,
    handleStatusUpdate,
    handleDelete,
  };
}
