"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export type OrderStatus = "proposal" | "negotiation" | "confirmed" | "canceled";
export type DeliveryStatus = "pending" | "delivered" | "invoiced" | "paid";

export const statusTabs: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "proposal", label: "제안" },
  { key: "negotiation", label: "협상" },
  { key: "confirmed", label: "확정" },
  { key: "canceled", label: "취소" },
];

export function useOrdersViewModel() {
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");

  const [showForm, setShowForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null); // 원하면 TRPC 타입으로 바꿔줄게
  const [editingId, setEditingId] = useState<number | null>(null);

  const [confirm, setConfirm] = useState<null | { id: number; title: string }>(null);

  const [form, setForm] = useState({
    clientName: "",
    clientId: undefined as number | undefined,
    productService: "",
    amount: "",
    status: "proposal" as OrderStatus,
    contractDate: "",
    expectedDeliveryDate: "",
    notes: "",
  });

  const [deliveryForm, setDeliveryForm] = useState({
    revenueAmount: "",
    deliveryStatus: "pending" as DeliveryStatus,
    deliveredAt: "",
    notes: "",
  });

  const { data: orders, isLoading } = trpc.orders.list.useQuery(
    activeTab !== "all" ? { status: activeTab } : undefined
  );

  const createMutation = trpc.orders.create.useMutation();
  const updateMutation = trpc.orders.update.useMutation();
  const deleteMutation = trpc.orders.delete.useMutation();
  const createDeliveryMutation = trpc.deliveries.create.useMutation();
  const utils = trpc.useUtils();

  const resetForm = () => {
    setEditingId(null);
    setForm({
      clientName: "",
      clientId: undefined,
      productService: "",
      amount: "",
      status: "proposal",
      contractDate: "",
      expectedDeliveryDate: "",
      notes: "",
    });
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !form.productService || !form.amount) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        clientId: form.clientId,
        clientName: form.clientName,
        productService: form.productService,
        amount: Number(form.amount),
        status: form.status,
        contractDate: form.contractDate || undefined,
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
        notes: form.notes || undefined,
      });
      await utils.orders.list.invalidate();
      await utils.dashboard.stats.invalidate();
      toast.success("수주가 등록되었습니다.");
      setShowForm(false);
      resetForm();
    } catch {
      toast.error("등록에 실패했습니다.");
    }
  };

  const handleEdit = (order: any) => {
    setEditingId(order.id);
    setForm({
      clientName: order.clientName,
      clientId: order.clientId ?? undefined,
      productService: order.productService,
      amount: String(order.amount ?? ""),
      status: order.status,
      contractDate: order.contractDate ? new Date(order.contractDate).toISOString().split("T")[0] : "",
      expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split("T")[0] : "",
      notes: order.notes || "",
    });
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    if (!form.clientName || !form.productService || !form.amount) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editingId,
        clientName: form.clientName,
        productService: form.productService,
        amount: Number(form.amount),
        status: form.status,
        contractDate: form.contractDate || undefined,
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
        notes: form.notes || undefined,
      });
      await utils.orders.list.invalidate();
      await utils.dashboard.stats.invalidate();
      toast.success("수주가 수정되었습니다.");
      setShowForm(false);
      resetForm();
    } catch {
      toast.error("수정에 실패했습니다.");
    }
  };

  const requestDelete = (order: any) => setConfirm({ id: order.id, title: order.productService });

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      await utils.orders.list.invalidate();
      await utils.dashboard.stats.invalidate();
      toast.success("수주가 삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleStatusChange = async (id: number, status: OrderStatus) => {
    try {
      await updateMutation.mutateAsync({ id, status });
      await utils.orders.list.invalidate();
      await utils.dashboard.stats.invalidate();
      toast.success("상태가 변경되었습니다.");
    } catch {
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  const openDeliveryForm = (order: any) => {
    setSelectedOrder(order);
    setDeliveryForm({
      revenueAmount: order.amount ? String(Math.round(Number(order.amount))) : "",
      deliveryStatus: "pending",
      deliveredAt: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split("T")[0] : "",
      notes: "",
    });
    setShowDeliveryForm(true);
  };

  const resetDeliveryForm = () => {
    setShowDeliveryForm(false);
    setSelectedOrder(null);
    setDeliveryForm({
      revenueAmount: "",
      deliveryStatus: "pending",
      deliveredAt: "",
      notes: "",
    });
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !deliveryForm.revenueAmount) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }
    try {
      await createDeliveryMutation.mutateAsync({
        orderId: selectedOrder.id,
        clientName: selectedOrder.clientName,
        revenueAmount: Number(deliveryForm.revenueAmount),
        deliveryStatus: deliveryForm.deliveryStatus,
        deliveredAt: deliveryForm.deliveredAt || undefined,
        notes: deliveryForm.notes || undefined,
      });

      await utils.deliveries.list.invalidate();
      await utils.orders.list.invalidate();
      await utils.dashboard.stats.invalidate();
      toast.success("납품이 생성되었습니다.");
      resetDeliveryForm();
    } catch {
      toast.error("납품 생성에 실패했습니다.");
    }
  };

  const stats = useMemo(() => {
    const rows = orders ?? [];
    const total = rows.filter((o) => o.status !== "canceled").reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const confirmed = rows.filter((o) => o.status === "confirmed").reduce((sum, o) => sum + Number(o.amount || 0), 0);
    return { total, confirmed };
  }, [orders]);

  const formatKRW = (n: number) => {
    if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
    if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만원`;
    return `${n.toLocaleString()}원`;
  };

  return {
    // state
    activeTab,
    setActiveTab,
    showForm,
    setShowForm,
    showDeliveryForm,
    setShowDeliveryForm,
    selectedOrder,
    editingId,
    confirm,
    setConfirm,
    form,
    setForm,
    deliveryForm,
    setDeliveryForm,

    // data
    orders,
    isLoading,
    stats,
    statusTabs,

    // utils
    formatKRW,

    // mutations
    createMutation,
    updateMutation,
    deleteMutation,
    createDeliveryMutation,

    // handlers
    resetForm,
    openCreate,
    handleCreate,
    handleEdit,
    handleUpdate,
    requestDelete,
    handleDelete,
    handleStatusChange,
    openDeliveryForm,
    resetDeliveryForm,
    handleCreateDelivery,

    // icons (page에서 FAB에 쓰려고)
    icons: { Plus },
  };
}