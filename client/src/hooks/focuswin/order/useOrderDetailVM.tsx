// hooks/focuswin/order/useOrderDetailVM.ts

// #region Imports
import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { Edit2, Trash2, X } from "lucide-react";

import { trpc } from "@/lib/trpc";
import { formatKRW } from "@/lib/format";
import { handleApiError } from "@/lib/handleApiError";
import { buildDeleteConfirm } from "@/lib/confirm";
import { toLocalDateInputValue } from "@/lib/utils";

import { useOrderActions } from "./useOrderActions";
import { useShipmentActions } from "@/hooks/focuswin/shipment/useShipmentActions";

import type { PageStatus } from "@/components/focuswin/common/page/scaffold/page-scaffold";
import type { ConfirmState } from "@/types";
import type { OrderStatus, OrderFormState, OrderShipmentFormState } from "@/types/order";
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
  ship_stat: "delivered",
  ship_date: "",
  ship_memo: "",
};
// #endregion

export function useOrderDetailVM(ordeId: number) {
  const [, navigate] = useLocation();
  const searchStr = useSearch();

  // #region Queries
  const orderQuery = trpc.crm.order.get.useQuery(
    { orde_idno: ordeId },
    { enabled: !!ordeId && ordeId > 0, staleTime: 10_000 }
  );

  const shipmentsQuery = trpc.crm.shipment.list.useQuery(
    { orde_idno: ordeId },
    { enabled: !!ordeId && ordeId > 0, staleTime: 10_000 }
  );
  // #endregion

  const order = orderQuery.data ?? null;
  const shipments = shipmentsQuery.data?.items ?? [];

  // #region Status
  const isLoading = orderQuery.isLoading;
  const isInvalid = !isLoading && (!order || !order.enab_yesn);
  const pageStatus: PageStatus = isLoading ? "loading" : isInvalid ? "empty" : "ready";
  // #endregion

  // #region Actions
  const actions = useOrderActions();
  const shipmentActions = useShipmentActions();
  // #endregion

  // #region Inline edit
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<OrderFormState>(EMPTY_ORDER_FORM);

  // ?edit=1 진입 시 데이터 로드 후 자동 편집 모드
  useEffect(() => {
    if (!order || isEditing) return;
    if (new URLSearchParams(searchStr).get("edit") === "1") startEdit();
  }, [order, searchStr]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = useCallback(() => {
    if (!order) return;
    setForm({
      clie_name: order.clie_name,
      clie_idno: order.clie_idno ?? undefined,
      prod_serv: order.prod_serv,
      orde_pric: String(order.orde_pric ?? ""),
      orde_stat: order.orde_stat,
      ctrt_date: order.ctrt_date ? new Date(order.ctrt_date).toISOString().split("T")[0] : "",
      expd_date: order.expd_date ? new Date(order.expd_date).toISOString().split("T")[0] : "",
      orde_memo: order.orde_memo || "",
    });
    setIsEditing(true);
  }, [order]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setForm(EMPTY_ORDER_FORM);
  }, []);

  const handleSave = useCallback(async () => {
    if (!order) return;
    if (!form.clie_name || !form.prod_serv || !form.orde_pric) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }
    try {
      await actions.updateOrder({
        orde_idno: order.orde_idno,
        clie_name: form.clie_name,
        prod_serv: form.prod_serv,
        orde_pric: Number(form.orde_pric),
        orde_stat: form.orde_stat,
        ctrt_date: form.ctrt_date || undefined,
        expd_date: form.expd_date || undefined,
        orde_memo: form.orde_memo || undefined,
      });
      await orderQuery.refetch();
      toast.success("저장되었습니다.");
      setIsEditing(false);
    } catch (e) {
      handleApiError(e);
    }
  }, [actions, form, order, orderQuery]);
  // #endregion

  // #region Delivery form (modal)
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState<OrderShipmentFormState>(EMPTY_DELIVERY_FORM);

  const openDeliveryForm = useCallback(() => {
    if (!order) return;
    setDeliveryForm({
      ship_pric: order.orde_pric ? String(Math.round(Number(order.orde_pric))) : "",
      ship_stat: "delivered",
      ship_date: toLocalDateInputValue(new Date()),
      ship_memo: "",
    });
    setShowDeliveryForm(true);
  }, [order]);

  const handleDeliveryOpenChange = useCallback((open: boolean) => {
    setShowDeliveryForm(open);
    if (!open) setDeliveryForm(EMPTY_DELIVERY_FORM);
  }, []);

  const handleCreateDelivery = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !deliveryForm.ship_pric) {
      toast.error("납품 금액을 입력해주세요.");
      return;
    }
    try {
      await actions.createShipment({
        orde_idno: order.orde_idno,
        clie_idno: order.clie_idno ?? undefined,
        clie_name: order.clie_name,
        ship_pric: Number(deliveryForm.ship_pric),
        ship_stat: deliveryForm.ship_stat,
        ship_date: deliveryForm.ship_date || undefined,
        ship_memo: deliveryForm.ship_memo || undefined,
      });
      await shipmentsQuery.refetch();
      toast.success("납품이 등록되었습니다.");
      setShowDeliveryForm(false);
      setDeliveryForm(EMPTY_DELIVERY_FORM);
    } catch (e) {
      handleApiError(e);
    }
  }, [actions, deliveryForm, order, shipmentsQuery]);
  // #endregion

  // #region Status change
  const handleStatusChange = useCallback(async (next: OrderStatus) => {
    if (!order) return;
    try {
      await actions.updateOrder({ orde_idno: order.orde_idno, orde_stat: next });
      await orderQuery.refetch();
      toast.success("상태가 변경되었습니다.");
    } catch (e) {
      handleApiError(e);
    }
  }, [actions, order, orderQuery]);
  // #endregion

  // #region Shipment status change
  const handleShipmentStatusChange = useCallback(async (
    shipIdno: number,
    stat: "pending" | "delivered" | "invoiced" | "paid"
  ) => {
    try {
      await shipmentActions.updateShipment({ ship_idno: shipIdno, ship_stat: stat });
      await shipmentsQuery.refetch();
      toast.success("상태가 변경되었습니다.");
    } catch (e) {
      handleApiError(e);
    }
  }, [shipmentActions, shipmentsQuery]);
  // #endregion

  // #region Confirm (delete)
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const requestDelete = useCallback(() => {
    if (!order) return;
    setConfirm(
      buildDeleteConfirm({
        kind: "order",
        id: order.orde_idno,
        title: order.prod_serv,
        metas: [
          { label: "거래처", value: order.clie_name },
          { label: "금액", value: formatKRW(Number(order.orde_pric)) },
        ],
      })
    );
  }, [order]);

  const handleConfirm = useCallback(async (c: NonNullable<ConfirmState>) => {
    if (c.intent !== "delete") return;
    try {
      await actions.deleteOrder({ orde_idno: c.target.id });
      toast.success("수주가 삭제되었습니다.");
      navigate("/orde-list");
    } catch (e) {
      handleApiError(e);
    }
  }, [actions, navigate]);
  // #endregion

  // #region Derived: shipment summary
  const orderAmount = Number(order?.orde_pric ?? 0);
  const totalShipped = shipments.reduce((s, i) => s + Number(i.ship_pric || 0), 0);
  const totalPaid    = shipments.filter(i => i.ship_stat === "paid").reduce((s, i) => s + Number(i.ship_pric || 0), 0);
  const isFullyShipped = orderAmount > 0 && totalShipped >= orderAmount;

  const shipmentSummary = {
    totalShipped,
    totalPaid,
    count: shipments.length,
    isFullyShipped,
  };
  // #endregion

  // #region Header actions
  const primaryAction = isEditing
    ? { label: "저장", onClick: handleSave, variant: "primary" as const, disabled: actions.update.isPending }
    : order?.orde_stat === "confirmed" && !isFullyShipped
    ? { label: "납품 등록", onClick: openDeliveryForm, variant: "primary" as const }
    : (() => {
        const stat = order?.orde_stat;
        if (stat === "proposal")    return { label: "협상 시작", onClick: () => handleStatusChange("negotiation"), variant: "primary" as const, disabled: actions.update.isPending };
        if (stat === "negotiation") return { label: "수주 확정", onClick: () => handleStatusChange("confirmed"),   variant: "primary" as const, disabled: actions.update.isPending };
        return undefined;
      })();

  const headerActions = isEditing
    ? [{ label: "취소", icon: <X size={14} />, onClick: cancelEdit, variant: "ghost" as const }]
    : order
    ? [
        { label: "수정", icon: <Edit2 size={14} />, onClick: startEdit,    variant: "ghost" as const },
        { label: "삭제", icon: <Trash2 size={14} />, onClick: requestDelete, variant: "ghost" as const },
      ]
    : [];
  // #endregion

  return {
    // data
    order,
    shipments,
    shipmentSummary,

    // page status
    pageStatus,
    isInvalid,

    // navigation
    goList: () => window.history.back(),

    // inline edit
    isEditing,
    startEdit,
    cancelEdit,
    form,
    setForm,
    handleSave,

    // delivery modal
    showDeliveryForm,
    deliveryForm,
    setDeliveryForm,
    openDeliveryForm,
    handleDeliveryOpenChange,
    handleCreateDelivery,
    isDeliverySubmitting: actions.createDelivery.isPending,

    // status change
    handleStatusChange,

    // shipment status
    handleShipmentStatusChange,
    isShipmentUpdating: shipmentActions.update.isPending,

    // delete dialog
    confirm,
    setConfirm,
    requestDelete,
    handleConfirm,

    // header
    primaryAction,
    headerActions,

    // helpers
    formatKRW,
  };
}
