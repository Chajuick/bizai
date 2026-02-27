import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatKRW } from "@/lib/format";
import type {
  OrderRow,
  OrderStatus,
  OrderFormState,
  OrderDeliveryFormState,
  DeliveryStatus,
} from "@/types";
import { orderStatusTabs } from "@/types";

export type { OrderStatus, DeliveryStatus };
export const statusTabs = orderStatusTabs;

export function useOrdersViewModel() {
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");

  const [showForm, setShowForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [confirm, setConfirm] = useState<null | { id: number; title: string }>(null);

  const [form, setForm] = useState<OrderFormState>({
    clie_name: "",
    clie_idno: undefined,
    prod_serv: "",
    orde_pric: "",
    stat_code: "proposal",
    ctrt_date: "",
    expd_date: "",
    orde_memo: "",
  });

  const [deliveryForm, setDeliveryForm] = useState<OrderDeliveryFormState>({
    ship_pric: "",
    stat_code: "pending",
    ship_date: "",
    ship_memo: "",
  });

  const { data: ordersData, isLoading } = trpc.orders.list.useQuery(
    activeTab !== "all" ? { status: activeTab } : undefined
  );

  const createMutation = trpc.orders.create.useMutation();
  const updateMutation = trpc.orders.update.useMutation();
  const deleteMutation = trpc.orders.delete.useMutation();
  const createDeliveryMutation = trpc.deliveries.create.useMutation();
  const utils = trpc.useUtils();

  const orders = ordersData?.items ?? [];

  const resetForm = () => {
    setEditingId(null);
    setForm({
      clie_name: "",
      clie_idno: undefined,
      prod_serv: "",
      orde_pric: "",
      stat_code: "proposal",
      ctrt_date: "",
      expd_date: "",
      orde_memo: "",
    });
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clie_name || !form.prod_serv || !form.orde_pric) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        clie_idno: form.clie_idno,
        clie_name: form.clie_name,
        prod_serv: form.prod_serv,
        orde_pric: Number(form.orde_pric),
        stat_code: form.stat_code,
        ctrt_date: form.ctrt_date || undefined,
        expd_date: form.expd_date || undefined,
        orde_memo: form.orde_memo || undefined,
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

  const handleEdit = (order: OrderRow) => {
    setEditingId(order.orde_idno);
    setForm({
      clie_name: order.clie_name,
      clie_idno: order.clie_idno ?? undefined,
      prod_serv: order.prod_serv,
      orde_pric: String(order.orde_pric ?? ""),
      stat_code: order.stat_code,
      ctrt_date: order.ctrt_date ? new Date(order.ctrt_date).toISOString().split("T")[0] : "",
      expd_date: order.expd_date ? new Date(order.expd_date).toISOString().split("T")[0] : "",
      orde_memo: order.orde_memo || "",
    });
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    if (!form.clie_name || !form.prod_serv || !form.orde_pric) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        orde_idno: editingId,
        clie_name: form.clie_name,
        prod_serv: form.prod_serv,
        orde_pric: Number(form.orde_pric),
        stat_code: form.stat_code,
        ctrt_date: form.ctrt_date || undefined,
        expd_date: form.expd_date || undefined,
        orde_memo: form.orde_memo || undefined,
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

  const requestDelete = (order: OrderRow) =>
    setConfirm({ id: order.orde_idno, title: order.prod_serv });

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ orde_idno: id });
      await utils.orders.list.invalidate();
      await utils.dashboard.stats.invalidate();
      toast.success("수주가 삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleStatusChange = async (id: number, status: OrderStatus) => {
    try {
      await updateMutation.mutateAsync({ orde_idno: id, stat_code: status });
      await utils.orders.list.invalidate();
      await utils.dashboard.stats.invalidate();
      toast.success("상태가 변경되었습니다.");
    } catch {
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  const openDeliveryForm = (order: OrderRow) => {
    setSelectedOrder(order);
    setDeliveryForm({
      ship_pric: order.orde_pric ? String(Math.round(Number(order.orde_pric))) : "",
      stat_code: "pending",
      ship_date: order.expd_date ? new Date(order.expd_date).toISOString().split("T")[0] : "",
      ship_memo: "",
    });
    setShowDeliveryForm(true);
  };

  const resetDeliveryForm = () => {
    setShowDeliveryForm(false);
    setSelectedOrder(null);
    setDeliveryForm({
      ship_pric: "",
      stat_code: "pending",
      ship_date: "",
      ship_memo: "",
    });
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !deliveryForm.ship_pric) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }
    try {
      await createDeliveryMutation.mutateAsync({
        orde_idno: selectedOrder.orde_idno,
        clie_name: selectedOrder.clie_name,
        ship_pric: Number(deliveryForm.ship_pric),
        stat_code: deliveryForm.stat_code,
        ship_date: deliveryForm.ship_date || undefined,
        ship_memo: deliveryForm.ship_memo || undefined,
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
    const total = orders
      .filter((o) => o.stat_code !== "canceled")
      .reduce((sum, o) => sum + Number(o.orde_pric || 0), 0);
    const confirmed = orders
      .filter((o) => o.stat_code === "confirmed")
      .reduce((sum, o) => sum + Number(o.orde_pric || 0), 0);
    return { total, confirmed };
  }, [orders]);

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

  };
}
