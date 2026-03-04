// components/focuswin/shipment/list/ShipmentModals.tsx

// #region Imports
import type { Dispatch, SetStateAction } from "react";
import type { ConfirmState } from "@/types";
import type { ShipmentFormState } from "@/types/shipment";
import type { OrderRow } from "@/types/order";

import ShipmentListFormModal from "./FormModal";
import ConfirmActionDialog from "@/components/focuswin/common/confirm-action-dialog";
// #endregion

// #region Types

export type ShipmentModalsProps = {
  // ─── 납품 폼 모달 ────────────────────────────────────────────────────────
  showForm: boolean;
  onFormOpenChange: (open: boolean) => void;
  editing: boolean;
  form: ShipmentFormState;
  setForm: Dispatch<SetStateAction<ShipmentFormState>>;
  orders: OrderRow[];
  onFormSubmit: (e: React.FormEvent) => void;
  isFormSubmitting: boolean;

  // ─── 삭제 확인 다이얼로그 ─────────────────────────────────────────────
  confirm: ConfirmState;
  setConfirm: Dispatch<SetStateAction<ConfirmState>>;
  onConfirm: (c: NonNullable<ConfirmState>) => Promise<void>;
};

// #endregion

// #region Component

/**
 * 납품 목록 페이지 모달 모음.
 * VM은 상태/핸들러만 제공하고, 이 컴포넌트가 JSX 조립 담당.
 */
export function ShipmentModals({
  showForm,
  onFormOpenChange,
  editing,
  form,
  setForm,
  orders,
  onFormSubmit,
  isFormSubmitting,
  confirm,
  setConfirm,
  onConfirm,
}: ShipmentModalsProps) {
  return (
    <>
      <ShipmentListFormModal
        open={showForm}
        onOpenChange={onFormOpenChange}
        editing={editing}
        form={form}
        setForm={setForm}
        orders={orders}
        onSubmit={onFormSubmit}
        isSubmitting={isFormSubmitting}
      />

      <ConfirmActionDialog
        confirm={confirm}
        setConfirm={setConfirm}
        onConfirm={onConfirm}
      />
    </>
  );
}

// #endregion
