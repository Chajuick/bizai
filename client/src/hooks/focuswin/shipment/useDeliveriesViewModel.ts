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
    orde_idno: "",
    clie_name: "",
    ship_pric: "",
    stat_code: "pending",
    ship_date: "",
    ship_memo: "",
  });

  const { data: deliveriesData, isLoading } = trpc.crm.shipment.list.useQuery(
    activeTab !== "all" ? { stat_code: activeTab } : undefined
  );

  const { data: ordersData } = trpc.crm.order.list.useQuery({ status: "confirmed" });

  const createMutation = trpc.crm.shipment.create.useMutation();
  const updateMutation = trpc.crm.shipment.update.useMutation();
  const deleteMutation = trpc.crm.shipment.delete?.useMutation?.();
  const utils = trpc.useUtils();

  const deliveries = deliveriesData?.items ?? [];
  const orders = ordersData?.items ?? [];

  const resetForm = () => {
    setEditingId(null);
    setForm({
      orde_idno: "",
      clie_name: "",
      ship_pric: "",
      stat_code: "pending",
      ship_date: "",
      ship_memo: "",
    });
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const stats = useMemo(() => {
    const paid = deliveries
      .filter((d) => d.stat_code === "paid")
      .reduce((s, d) => s + Number(d.ship_pric || 0), 0);
    const pending = deliveries
      .filter((d) => d.stat_code !== "paid")
      .reduce((s, d) => s + Number(d.ship_pric || 0), 0);
    return { paid, pending };
  }, [deliveries]);

  const invalidateAll = () => {
    utils.crm.shipment.list.invalidate();
    utils.crm.dashboard.stats.invalidate();
  };

  const hasData = deliveries.length > 0;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleEdit = (d: DeliveryRow) => {
    setEditingId(d.ship_idno);
    setForm({
      orde_idno: d.orde_idno ? String(d.orde_idno) : "",
      clie_name: d.clie_name || "",
      ship_pric: String(d.ship_pric ?? ""),
      stat_code: d.stat_code,
      ship_date: d.ship_date ? new Date(d.ship_date).toISOString().split("T")[0] : "",
      ship_memo: d.ship_memo || "",
    });
    setShowForm(true);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clie_name || !form.ship_pric) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }
    const payload = {
      orde_idno: Number(form.orde_idno) || 0,
      clie_name: form.clie_name,
      ship_pric: Number(form.ship_pric),
      stat_code: form.stat_code,
      ship_date: form.ship_date || undefined,
      ship_memo: form.ship_memo || undefined,
    };
    try {
      if (!editingId) {
        await createMutation.mutateAsync(payload);
        toast.success("납품 건이 등록되었습니다.");
      } else {
        await updateMutation.mutateAsync({ ship_idno: editingId, ...payload });
        toast.success("납품 건이 수정되었습니다.");
      }
      invalidateAll();
      setShowForm(false);
      resetForm();
    } catch {
      toast.error(editingId ? "수정에 실패했습니다." : "등록에 실패했습니다.");
    }
  };

  const handleStatusUpdate = async (id: number, stat_code: DeliveryStatus) => {
    try {
      await updateMutation.mutateAsync({ ship_idno: id, stat_code });
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
      await deleteMutation.mutateAsync({ ship_idno: id });
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
