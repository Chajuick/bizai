// components/focuswin/schedule/list/ScheduleModals.tsx

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { ConfirmState } from "@/types/";
import type { ScheduleFormState, EnhancedSchedule, OrderQuickFormState } from "@/types/";

import ScheduleListFormModal from "./FormModal";
import CreateOrderModal from "./CreateOrderModal";
import ConfirmActionDialog from "@/components/focuswin/common/confirm-action-dialog";

// #region Types

export type ScheduleModalsProps = {
  // ─── 일정 폼 모달 ───────────────────────────────────────────────────────
  showForm: boolean;
  onFormOpenChange: (open: boolean) => void;
  editingId: number | null;
  form: ScheduleFormState;
  setForm: Dispatch<SetStateAction<ScheduleFormState>>;
  onFormSubmit: (e: FormEvent) => void;
  isFormSubmitting: boolean;

  // ─── 수주 생성 모달 ─────────────────────────────────────────────────────
  showOrderForm: boolean;
  onOrderOpenChange: (open: boolean) => void;
  selectedSchedule: EnhancedSchedule | null;
  orderForm: OrderQuickFormState;
  setOrderForm: Dispatch<SetStateAction<OrderQuickFormState>>;
  onOrderSubmit: (e: FormEvent) => void;
  isOrderSubmitting: boolean;

  // ─── 확인 다이얼로그 ─────────────────────────────────────────────────────
  confirm: ConfirmState;
  setConfirm: Dispatch<SetStateAction<ConfirmState>>;
  onConfirm: (c: NonNullable<ConfirmState>) => Promise<void>;
};

// #endregion

// #region Component

/**
 * 일정 리스트 페이지에서 사용하는 모달 모음.
 * VM은 상태/핸들러만 제공하고, 이 컴포넌트가 JSX 조립 담당.
 */
export function ScheduleModals({
  showForm,
  onFormOpenChange,
  editingId,
  form,
  setForm,
  onFormSubmit,
  isFormSubmitting,
  showOrderForm,
  onOrderOpenChange,
  selectedSchedule,
  orderForm,
  setOrderForm,
  onOrderSubmit,
  isOrderSubmitting,
  confirm,
  setConfirm,
  onConfirm,
}: ScheduleModalsProps) {
  return (
    <>
      <ScheduleListFormModal
        open={showForm}
        onOpenChange={onFormOpenChange}
        editing={!!editingId}
        form={form}
        setForm={setForm}
        onSubmit={onFormSubmit}
        isSubmitting={isFormSubmitting}
      />

      <CreateOrderModal
        open={showOrderForm}
        onOpenChange={onOrderOpenChange}
        selectedPromise={selectedSchedule}
        orderForm={orderForm}
        setOrderForm={setOrderForm}
        onSubmit={onOrderSubmit}
        isSubmitting={isOrderSubmitting}
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
