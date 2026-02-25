// client/src/hooks/focuswin/deliveries/useDeliveriesViewModel.ts
"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import type {
  DeliveryFormState,
  DeleteConfirmState,
  DeliveryStatus,
} from "@/components/focuswin/deliveries/deliveries.types";

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

  const formatKRW = (n: number) => {
    if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
    if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만원`;
    return `${n.toLocaleString()}원`;
  };

  const invalidateAll = () => {
    utils.deliveries.list.invalidate();
    utils.dashboard.stats.invalidate();
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

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
    stats,
    formatKRW,
    createMutation,
    updateMutation,
    deleteMutation,
    resetForm,
    openCreate,
    invalidateAll,
    isSubmitting,
  };
}
