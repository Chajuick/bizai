// hooks/focuswin/shipment/useShipmentListVM.ts

// #region Imports
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDateRange } from "@/components/focuswin/common/filters/date-range-filter";

import { trpc } from "@/lib/trpc";
import { handleApiError } from "@/lib/handleApiError";
import { formatKRW } from "@/lib/format";

import type { PageStatus } from "@/components/focuswin/common/page/scaffold/page-scaffold";
import type { TabPill } from "@/components/focuswin/common/ui/tab-pills";
import type { ConfirmState } from "@/types";
import type { ShipmentFormState, ShipmentRow, ShipmentStatus } from "@/types/shipment";

import { shipmentTabs } from "@/types/shipment";
import { useShipmentVM, type ShipmentTabKey } from "./useShipmentVM";
import { useShipmentActions } from "./useShipmentActions";
import { buildDeleteConfirm } from "@/lib/confirm";
// #endregion

// #region Constants
const EMPTY_FORM: ShipmentFormState = {
  orde_idno: "",
  clie_name: "",
  ship_pric: "",
  ship_stat: "pending",
  ship_date: "",
  ship_memo: "",
};
// #endregion

export function useShipmentListVM() {
  // #region Date range filter
  const { range: dateRange, setPreset: setDatePreset, setCustomRange } = useDateRange("30d");
  // #endregion

  // #region Base VM (list/paging/stats)
  const shipmentVM = useShipmentVM(dateRange);
  const actions = useShipmentActions();
  // #endregion

  // #region Orders for form select (confirmed only)
  const { data: ordersData } = trpc.crm.order.list.useQuery({ status: "confirmed" });
  const orders = useMemo(() => ordersData?.items ?? [], [ordersData]);
  // #endregion

  // #region Derived: page status
  const hasData = shipmentVM.items.length > 0;
  const status: PageStatus = shipmentVM.isLoading ? "loading" : hasData ? "ready" : "empty";
  // #endregion

  // #region Derived: tabs (서버 stats 기반 카운트)
  const tabs = useMemo<TabPill<ShipmentTabKey>[]>(() => {
    return shipmentTabs.map((t) => ({
      key: t.key,
      label: t.label,
      count: shipmentVM.stats[t.key],
    }));
  }, [shipmentVM.stats]);
  // #endregion

  // #region Derived: financial stats (조회 기간 기준, 로드된 항목 기반)
  const stats = useMemo(() => {
    let paid = 0;
    let pending = 0;
    for (const s of shipmentVM.items) {
      const price = Number(s.ship_pric || 0);
      if (s.ship_stat === "paid") paid += price;
      else pending += price;
    }
    return { paid, pending };
  }, [shipmentVM.items]);
  // #endregion

  // #region Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ShipmentFormState>(EMPTY_FORM);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
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

  // #region Helpers
  function getShipmentStatusLabel(s: ShipmentStatus) {
    if (s === "pending") return "대기";
    if (s === "delivered") return "납품완료";
    if (s === "invoiced") return "청구완료";
    return "수금완료";
  }
  // #endregion

  // #region Confirm dialog state
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const requestDelete = useCallback((row: ShipmentRow) => {

    setConfirm(
      buildDeleteConfirm({
        kind: "shipment",
        id: row.ship_idno,
        title: "해당 납품",
        metas: [
          { label: "거래처", value: row.clie_name || "-" },
          { label: "납품일", value: row.ship_date ? new Date(row.ship_date).toLocaleDateString("ko-KR") : "미입력" },
          { label: "금액", value: formatKRW(Number(row.ship_pric || 0)) }
        ]
      })
    );

  }, []);
  // #endregion

  // #region CRUD handlers
  const handleCreateOrUpdate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!form.clie_name || !form.ship_pric) {
        toast.error("필수 항목을 입력해주세요.");
        return;
      }

      const payload = {
        orde_idno: Number(form.orde_idno) || 0,
        clie_name: form.clie_name,
        ship_pric: Number(form.ship_pric),
        ship_stat: form.ship_stat,
        ship_date: form.ship_date || undefined,
        ship_memo: form.ship_memo || undefined,
      };

      try {
        if (!editingId) {
          await actions.createShipment(payload);
          toast.success("납품이 등록되었습니다.");
        } else {
          await actions.updateShipment({ ship_idno: editingId, ...payload });
          toast.success("납품이 수정되었습니다.");
        }
        shipmentVM.resetPaging();
        setShowForm(false);
        resetForm();
      } catch (e) {
        handleApiError(e);
      }
    },
    [actions, editingId, form, resetForm, shipmentVM]
  );

  const handleEdit = useCallback((d: ShipmentRow) => {
    setEditingId(d.ship_idno);
    setForm({
      orde_idno: d.orde_idno ? String(d.orde_idno) : "",
      clie_name: d.clie_name || "",
      ship_pric: String(d.ship_pric ?? ""),
      ship_stat: d.ship_stat,
      ship_date: d.ship_date ? new Date(d.ship_date).toISOString().split("T")[0] : "",
      ship_memo: d.ship_memo || "",
    });
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await actions.deleteShipment({ ship_idno: id });
        shipmentVM.resetPaging();
        toast.success("삭제되었습니다.");
      } catch (e) {
        handleApiError(e);
      }
    },
    [actions, shipmentVM]
  );

  const handleStatusUpdate = useCallback(
    async (id: number, ship_stat: ShipmentStatus) => {
      try {
        await actions.updateShipment({ ship_idno: id, ship_stat });
        shipmentVM.resetPaging();
        toast.success("상태가 변경되었습니다.");
      } catch (e) {
        handleApiError(e);
      }
    },
    [actions, shipmentVM]
  );

  // ConfirmActionDialog onConfirm 시그니처에 맞는 래퍼
  const handleConfirm = useCallback(
    async (c: NonNullable<ConfirmState>) => {
      if (c.intent !== "delete") return;
      await handleDelete(c.target.id);
    },
    [handleDelete]
  );
  // #endregion

  // #region Action UI model
  const primaryAction = { label: "납품 등록", onClick: openCreate, variant: "primary" as const };
  const fab = { label: "납품 등록", onClick: openCreate };
  // #endregion

  // #region Modal props (ShipmentModals 컴포넌트로 일괄 전달)
  const modalProps = {
    showForm,
    onFormOpenChange: handleFormOpenChange,
    editing: !!editingId,
    form,
    setForm,
    orders,
    onFormSubmit: handleCreateOrUpdate,
    isFormSubmitting: actions.create.isPending || actions.update.isPending,
    confirm,
    setConfirm,
    onConfirm: handleConfirm,
  };
  // #endregion

  // #region Public API
  return {
    // status
    status,
    hasData,

    // data
    shipments: shipmentVM.items,

    // tabs (서버 stats 기반 카운트)
    activeTab: shipmentVM.activeTab,
    setActiveTab: shipmentVM.setActiveTab,
    tabs,

    // financial stats (조회 기간 기준)
    stats,

    // date filter
    dateRange,
    setDatePreset,
    setCustomRange,

    // pagination
    hasMore: shipmentVM.hasMore,
    isLoadingMore: shipmentVM.isLoadingMore,
    loadMore: shipmentVM.loadMore,

    // ui helpers
    formatKRW,
    primaryAction,
    fab,

    // card handlers
    handleEdit,
    requestDelete,
    handleStatusUpdate,
    statusChanging: actions.update.isPending,

    // modal props
    modalProps,
  };
  // #endregion
}
