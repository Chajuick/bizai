// src/components/focuswin/order/list/OrderModals.tsx

// #region Imports
import OrderListFormDModal from "@/components/focuswin/page/order//list/FormModal";
import CreateShipmetModal from "@/components/focuswin/page/order//list/CreateShipmetModal";
import ConfirmActionDialog from "@/components/focuswin/common/overlays/confirm-action-dialog";

import type { ConfirmState } from "@/types";
import type { OrderFormState, OrderShipmentFormState, OrderRow } from "@/types/order";
// #endregion

// #region Types
type Props = {
  // order form
  showForm: boolean;
  onFormOpenChange: (open: boolean) => void;
  editing: boolean;
  form: OrderFormState;
  setForm: React.Dispatch<React.SetStateAction<OrderFormState>>;
  onFormSubmit: (e: React.FormEvent) => void;
  isFormSubmitting: boolean;

  // delivery form
  showDeliveryForm: boolean;
  onDeliveryOpenChange: (open: boolean) => void;
  selectedOrder: OrderRow | null;
  deliveryForm: OrderShipmentFormState;
  setDeliveryForm: React.Dispatch<React.SetStateAction<OrderShipmentFormState>>;
  onDeliverySubmit: (e: React.FormEvent) => void;
  isDeliverySubmitting: boolean;

  // confirm
  confirm: ConfirmState;
  setConfirm: (next: ConfirmState) => void;
  onConfirm: (confirm: Exclude<ConfirmState, null>) => Promise<void> | void;
};
// #endregion

export function OrderModals(props: Props) {
  // #region Destructure
  const {
    showForm,
    onFormOpenChange,
    editing,
    form,
    setForm,
    onFormSubmit,
    isFormSubmitting,

    showDeliveryForm,
    onDeliveryOpenChange,
    selectedOrder,
    deliveryForm,
    setDeliveryForm,
    onDeliverySubmit,
    isDeliverySubmitting,

    confirm,
    setConfirm,
    onConfirm,
  } = props;
  // #endregion

  return (
    <>
      <OrderListFormDModal
        open={showForm}
        onOpenChange={onFormOpenChange}
        editing={editing}
        form={form}
        setForm={setForm}
        onSubmit={onFormSubmit}
        isSubmitting={isFormSubmitting}
      />

      <CreateShipmetModal
        open={showDeliveryForm}
        onOpenChange={onDeliveryOpenChange}
        selectedOrder={selectedOrder}
        deliveryForm={deliveryForm}
        setDeliveryForm={setDeliveryForm}
        onSubmit={onDeliverySubmit}
        isSubmitting={isDeliverySubmitting}
      />

      <ConfirmActionDialog confirm={confirm} setConfirm={setConfirm} onConfirm={onConfirm} />
    </>
  );
}