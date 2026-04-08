// src/hooks/focuswin/order/useOrderListVM.ts

// #region Imports
import { useCallback, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { handleApiError } from "@/lib/handleApiError";
import { useDateRange } from "@/components/focuswin/common/filters/date-range-filter";

import { formatKRW } from "@/lib/format";

import type { PageStatus } from "@/components/focuswin/common/page/scaffold/page-scaffold";
import type { TabPill } from "@/components/focuswin/common/ui/tab-pills";
import type { ConfirmState } from "@/types";

import type {
  OrderRow,
  OrderStatus,
  OrderFormState,
  OrderShipmentFormState,
  ShipmentStatus,
} from "@/types";

import { orderStatusTabs } from "@/types/order";
import { useOrderActions } from "./useOrderActions";
import { useOrderVM } from "./useOrderVM";
import { buildDeleteConfirm } from "@/lib/confirm";
// #endregion

// #region Re-exports (기존 컴포넌트 호환)
export type { OrderStatus, ShipmentStatus };
export const statusTabs = orderStatusTabs;
// #endregion

// #region Constants
const EMPTY_ORDER_FORM: OrderFormState = {
  clie_name: "",
  clie_idno: undefined,
  prod_serv: "",
  orde_pric: "",
  orde_stat: "proposal",
  ctrt_date: "",
  expd_date: "",
  orde_memo: "",
};

const EMPTY_DELIVERY_FORM: OrderShipmentFormState = {
  ship_pric: "",
  ship_stat: "pending",
  ship_date: "",
  ship_memo: "",
};
// #endregion

export function useOrderListVM() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const urlSearch = useSearch();

  // #region View toggle (list / kanban)
  const view: "list" | "kanban" = new URLSearchParams(urlSearch).get("view") === "kanban" ? "kanban" : "list";
  const setView = useCallback((v: "list" | "kanban") => {
    const params = new URLSearchParams(urlSearch);
    if (v === "kanban") params.set("view", "kanban");
    else params.delete("view");
    const qs = params.toString();
    setLocation(qs ? `/orde-list?${qs}` : "/orde-list");
  }, [urlSearch, setLocation]);
  // #endregion

  // #region Date range filter (UI only — list shows all records)
  const { range: dateRange, setPreset: setDatePreset, setCustomRange } = useDateRange("30d", "order-list");
  // #endregion

  // #region Base VM (list/paging/stats)
  const orderVM = useOrderVM();
  // #endregion

  // #region Search
  const [search, setSearch] = useState("");
  const handleSearch = useCallback((v: string) => setSearch(v), []);
  const handleClear = useCallback(() => setSearch(""), []);
  // #endregion

  // #region Actions (mutations + refresh)
  const actions = useOrderActions();
  // #endregion

  // #region Search filter (client-side)
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orderVM.items;
    return orderVM.items.filter((o) =>
      (o.clie_name ?? "").toLowerCase().includes(q) ||
      o.prod_serv.toLowerCase().includes(q) ||
      (o.orde_memo ?? "").toLowerCase().includes(q)
    );
  }, [orderVM.items, search]);
  // #endregion

  // #region Derived: page status
  const hasData = filteredItems.length > 0;
  const status: PageStatus = orderVM.isLoading ? "loading" : (view === "kanban" ? "ready" : hasData ? "ready" : "empty");
  // #endregion

  // #region Derived: kanban groups
  const kanbanGroups = useMemo(() => {
    const active = filteredItems.filter((o) => o.orde_stat !== "canceled");
    const byStatus = (s: OrderStatus) => active.filter((o) => o.orde_stat === s);
    return [
      { key: "proposal"    as const, label: "제안",  items: byStatus("proposal"),    color: "#64748b" },
      { key: "negotiation" as const, label: "협상",  items: byStatus("negotiation"), color: "#f59e0b" },
      { key: "confirmed"   as const, label: "확정",  items: byStatus("confirmed"),   color: "#10b981" },
    ];
  }, [filteredItems]);
  // #endregion

  // #region Derived: tabs (서버 stats 기반 — 전체 DB 카운트)
  const tabs: TabPill<OrderStatus | "all">[] = useMemo(() => {
    return orderStatusTabs.map((t) => ({
      key: t.key,
      label: t.label,
      count: orderVM.stats[t.key],
    }));
  }, [orderVM.stats]);
  // #endregion

  // #region Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<OrderFormState>(EMPTY_ORDER_FORM);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_ORDER_FORM);
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

  // #region Delivery form state
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [deliveryForm, setDeliveryForm] = useState<OrderShipmentFormState>(EMPTY_DELIVERY_FORM);

  const resetDeliveryForm = useCallback(() => {
    setShowDeliveryForm(false);
    setSelectedOrder(null);
    setDeliveryForm(EMPTY_DELIVERY_FORM);
  }, []);

  const handleDeliveryOpenChange = useCallback(
    (open: boolean) => {
      setShowDeliveryForm(open);
      if (!open) resetDeliveryForm();
    },
    [resetDeliveryForm]
  );

  const today = new Date().toISOString().slice(0, 10);

  const openDeliveryForm = useCallback((order: OrderRow) => {
    setSelectedOrder(order);

    const defaultDate = order.expd_date
      ? new Date(order.expd_date).toISOString().slice(0, 10)
      : today;

    setDeliveryForm({
      ship_pric: order.orde_pric ? String(Math.round(Number(order.orde_pric))) : "",
      ship_stat: "delivered",
      ship_date: defaultDate,
      ship_memo: "",
    });

    setShowDeliveryForm(true);
  }, []);
  // #endregion

  // #region Confirm dialog state
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const requestDelete = useCallback((order: OrderRow) => {

    setConfirm(
      buildDeleteConfirm({
        kind: "order",
        id: order.orde_idno,
        title: order.prod_serv || "해당 수주",
        metas: [
          { label: "거래처", value: order.clie_name || "-" },
          { label: "품목", value: order.prod_serv || "-" },
          { label: "금액", value: formatKRW(Number(order.orde_pric || 0)) }
        ]
      })
    );

  }, []);
  // #endregion

  // #region CRUD handlers
  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!form.clie_name || !form.prod_serv || !form.orde_pric) {
        toast.error("필수 항목을 입력해주세요.");
        return;
      }

      try {
        await actions.createOrder({
          clie_idno: form.clie_idno,
          clie_name: form.clie_name,
          prod_serv: form.prod_serv,
          orde_pric: Number(form.orde_pric),
          orde_stat: form.orde_stat,
          ctrt_date: form.ctrt_date || undefined,
          expd_date: form.expd_date || undefined,
          orde_memo: form.orde_memo || undefined,
        });

        orderVM.resetPaging();
        toast.success("수주가 등록되었습니다.");
        setShowForm(false);
        resetForm();
      } catch (e) {
        handleApiError(e);
      }
    },
    [actions, form, orderVM, resetForm]
  );

  const handleEdit = useCallback((order: OrderRow) => {
    navigate(`/orde-list/${order.orde_idno}?edit=1`);
  }, []);

  const handleUpdate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingId) return;

      if (!form.clie_name || !form.prod_serv || !form.orde_pric) {
        toast.error("필수 항목을 입력해주세요.");
        return;
      }

      try {
        await actions.updateOrder({
          orde_idno: editingId,
          clie_name: form.clie_name,
          prod_serv: form.prod_serv,
          orde_pric: Number(form.orde_pric),
          orde_stat: form.orde_stat,
          ctrt_date: form.ctrt_date || undefined,
          expd_date: form.expd_date || undefined,
          orde_memo: form.orde_memo || undefined,
        });

        orderVM.resetPaging();
        toast.success("수주가 수정되었습니다.");
        setShowForm(false);
        resetForm();
      } catch (e) {
        handleApiError(e);
      }
    },
    [actions, editingId, form, orderVM, resetForm]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await actions.deleteOrder({ orde_idno: id });
        orderVM.resetPaging();
        toast.success("수주가 삭제되었습니다.");
      } catch (e) {
        handleApiError(e);
      }
    },
    [actions, orderVM]
  );

  const handleStatusChange = useCallback(
    async (id: number, next: OrderStatus) => {
      try {
        await actions.updateOrder({ orde_idno: id, orde_stat: next });
        orderVM.resetPaging();
        toast.success("상태가 변경되었습니다.");
      } catch (e) {
        handleApiError(e);
      }
    },
    [actions, orderVM]
  );

  const handleCreateDelivery = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedOrder || !deliveryForm.ship_pric) {
        toast.error("필수 항목을 입력해주세요.");
        return;
      }

      try {
        await actions.createShipment({
          orde_idno: selectedOrder.orde_idno,
          clie_idno: selectedOrder.clie_idno ?? undefined,
          clie_name: selectedOrder.clie_name,
          ship_pric: Number(deliveryForm.ship_pric),
          ship_stat: deliveryForm.ship_stat,
          ship_date: deliveryForm.ship_date || undefined,
          ship_memo: deliveryForm.ship_memo || undefined,
        });

        orderVM.resetPaging();
        toast.success("납품이 생성되었습니다.");
        resetDeliveryForm();
      } catch (e) {
        handleApiError(e);
      }
    },
    [actions, deliveryForm, orderVM, resetDeliveryForm, selectedOrder]
  );
  // #endregion

  // #region Confirm handler
  const handleConfirm = useCallback(
    async (c: Exclude<ConfirmState, null>) => {
      if (c.intent !== "delete") return;
      await handleDelete(c.target.id);
    },
    [handleDelete]
  );
  // #endregion

  // #region Action UI model
  const primaryAction = {
    label: "수주 등록",
    onClick: openCreate,
    variant: "primary" as const,
    disabled: actions.create.isPending || actions.update.isPending,
  };

  const fab = { label: "수주 등록", onClick: openCreate };
  // #endregion

  // #region Modal props (OrderModals 컴포넌트로 일괄 전달)
  const modalProps = {
    showForm,
    onFormOpenChange: handleFormOpenChange,
    editing: !!editingId,
    form,
    setForm,
    onFormSubmit: editingId ? handleUpdate : handleCreate,
    isFormSubmitting: actions.create.isPending || actions.update.isPending,

    showDeliveryForm,
    onDeliveryOpenChange: handleDeliveryOpenChange,
    selectedOrder,
    deliveryForm,
    setDeliveryForm,
    onDeliverySubmit: handleCreateDelivery,
    isDeliverySubmitting: actions.createDelivery.isPending,

    confirm,
    setConfirm,
    onConfirm: handleConfirm,
  };
  // #endregion

  // #region Period stats (로드된 항목 기반)
  const periodStats = useMemo(() => {
    let total = 0;
    let confirmed = 0;
    for (const o of filteredItems) {
      const price = Number(o.orde_pric || 0);
      if (o.orde_stat !== "canceled") total += price;
      if (o.orde_stat === "confirmed") confirmed += price;
    }
    return { total, confirmed };
  }, [filteredItems]);
  // #endregion

  // #region Public API
  return {
    // status
    status,
    isLoading: orderVM.isLoading,
    hasData,

    // data
    // view toggle
    view,
    setView,

    orders: filteredItems,
    kanbanGroups,

    // financial stats (Header용 — 조회 기간 기준)
    stats: periodStats,

    // date filter
    dateRange,
    setDatePreset,
    setCustomRange,

    // search
    search,
    handleSearch,
    handleClear,

    // tabs (서버 stats 기반 카운트)
    activeTab: orderVM.activeTab,
    setActiveTab: orderVM.setActiveTab,
    tabs,

    // pagination
    hasMore: orderVM.hasMore,
    isLoadingMore: orderVM.isLoadingMore,
    loadMore: orderVM.loadMore,

    // ui helpers
    formatKRW,
    primaryAction,
    fab,

    // card handlers
    handleEdit,
    requestDelete,
    handleStatusChange,
    openDeliveryForm,

    // pending flags
    statusChanging: actions.update.isPending,

    // modal props
    modalProps,
  };
  // #endregion
}
