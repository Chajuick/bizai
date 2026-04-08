// hooks/focuswin/shipment/useShipmentDetailVM.tsx

import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { Edit2, Trash2, X } from "lucide-react";

import { trpc } from "@/lib/trpc";
import { formatKRW } from "@/lib/format";
import { handleApiError } from "@/lib/handleApiError";
import { buildDeleteConfirm } from "@/lib/confirm";
import { toLocalDateInputValue } from "@/lib/utils";

import { useShipmentActions } from "./useShipmentActions";
import type { PageStatus } from "@/components/focuswin/common/page/scaffold/page-scaffold";
import type { ConfirmState } from "@/types";
import type { ShipmentStatus } from "@/types/shipment";

type EditForm = {
  ship_stat: ShipmentStatus;
  ship_date: string;
  ship_pric: string;
  ship_memo: string;
};

const EMPTY_FORM: EditForm = {
  ship_stat: "pending",
  ship_date: "",
  ship_pric: "",
  ship_memo: "",
};

export function useShipmentDetailVM(shipId: number) {
  const [, navigate] = useLocation();
  const searchStr = useSearch();

  // #region Queries
  const shipQuery = trpc.crm.shipment.get.useQuery(
    { ship_idno: shipId },
    { enabled: !!shipId && shipId > 0, staleTime: 10_000 }
  );

  const shipment = shipQuery.data ?? null;

  // 연결 수주 조회 (shipment 로드 후)
  const orderQuery = trpc.crm.order.get.useQuery(
    { orde_idno: shipment?.orde_idno ?? 0 },
    { enabled: !!shipment?.orde_idno, staleTime: 30_000 }
  );

  const linkedOrder = orderQuery.data ?? null;

  // 연결 일정 조회 (수주에 sche_idno 있을 때)
  const scheduleQuery = trpc.crm.schedule.get.useQuery(
    { sche_idno: linkedOrder?.sche_idno ?? 0 },
    { enabled: !!(linkedOrder?.sche_idno), staleTime: 30_000 }
  );

  const linkedSchedule = scheduleQuery.data ?? null;
  // #endregion

  // #region Status
  const isLoading = shipQuery.isLoading;
  const isInvalid = !isLoading && (!shipment || !shipment.enab_yesn);
  const pageStatus: PageStatus = isLoading ? "loading" : isInvalid ? "empty" : "ready";
  // #endregion

  const actions = useShipmentActions();

  // #region Inline edit
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);

  useEffect(() => {
    if (!shipment || isEditing) return;
    if (new URLSearchParams(searchStr).get("edit") === "1") startEdit();
  }, [shipment, searchStr]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = useCallback(() => {
    if (!shipment) return;
    setForm({
      ship_stat: shipment.ship_stat as ShipmentStatus,
      ship_date: shipment.ship_date
        ? new Date(shipment.ship_date).toISOString().split("T")[0]
        : toLocalDateInputValue(new Date()),
      ship_pric: String(Math.round(Number(shipment.ship_pric))),
      ship_memo: shipment.ship_memo || "",
    });
    setIsEditing(true);
  }, [shipment]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setForm(EMPTY_FORM);
  }, []);

  const handleSave = useCallback(async () => {
    if (!shipment) return;
    if (!form.ship_pric) { toast.error("금액을 입력해주세요."); return; }
    try {
      await actions.updateShipment({
        ship_idno: shipment.ship_idno,
        ship_stat: form.ship_stat,
        ship_date: form.ship_date || undefined,
        ship_pric: Number(form.ship_pric),
        ship_memo: form.ship_memo || undefined,
      });
      await shipQuery.refetch();
      toast.success("저장되었습니다.");
      setIsEditing(false);
    } catch (e) {
      handleApiError(e);
    }
  }, [actions, form, shipment, shipQuery]);
  // #endregion

  // #region Confirm (delete)
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const requestDelete = useCallback(() => {
    if (!shipment) return;
    setConfirm(
      buildDeleteConfirm({
        kind: "shipment",
        id: shipment.ship_idno,
        title: "해당 납품",
        metas: [
          { label: "거래처", value: shipment.clie_name },
          { label: "금액",   value: formatKRW(Number(shipment.ship_pric)) },
        ],
      })
    );
  }, [shipment]);

  const handleConfirm = useCallback(async (c: NonNullable<ConfirmState>) => {
    if (c.intent !== "delete") return;
    try {
      await actions.deleteShipment({ ship_idno: c.target.id });
      toast.success("납품이 삭제되었습니다.");
      navigate("/ship-list");
    } catch (e) {
      handleApiError(e);
    }
  }, [actions, navigate]);
  // #endregion

  // #region Header actions
  const primaryAction = isEditing
    ? { label: "저장", onClick: handleSave, variant: "primary" as const, disabled: actions.update.isPending }
    : undefined;

  const headerActions = isEditing
    ? [{ label: "취소", icon: <X size={14} />, onClick: cancelEdit, variant: "ghost" as const }]
    : shipment
    ? [
        { label: "수정", icon: <Edit2 size={14} />, onClick: startEdit,     variant: "ghost" as const },
        { label: "삭제", icon: <Trash2 size={14} />, onClick: requestDelete, variant: "ghost" as const },
      ]
    : [];
  // #endregion

  return {
    shipment,
    linkedOrder,
    linkedSchedule,

    pageStatus,
    isInvalid,
    isLoading,

    goList: () => window.history.back(),

    isEditing,
    form,
    setForm,
    startEdit,
    cancelEdit,
    handleSave,
    isSaving: actions.update.isPending,

    confirm,
    setConfirm,
    requestDelete,
    handleConfirm,

    headerActions,
    primaryAction,

    formatKRW,
  };
}
