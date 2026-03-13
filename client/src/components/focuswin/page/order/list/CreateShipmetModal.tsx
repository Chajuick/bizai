import * as React from "react";

import FormDialog from "@/components/focuswin/common/overlays/form-dialog";

import {
  MoneyField,
  SelectField,
  DateField,
  TextAreaField,
} from "@/components/focuswin/common/form";

import type { OrderShipmentFormState, OrderRow } from "@/types/order";
import type { ShipmentStatus } from "@/types/shipment";

export default function CreateShipmetModal({
  open,
  onOpenChange,
  selectedOrder,
  deliveryForm,
  setDeliveryForm,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  selectedOrder: OrderRow | null;
  deliveryForm: OrderShipmentFormState;
  setDeliveryForm: React.Dispatch<React.SetStateAction<OrderShipmentFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="납품 생성"
      actionLabel="납품 생성"
      actionTone="primary"
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    >
      <div className="space-y-4">
        {/* 수익 금액 */}
        <MoneyField
          label="수익 금액(원)"
          required
          value={deliveryForm.ship_pric ?? ""}
          onChange={(v) =>
            setDeliveryForm((f) => ({
              ...f,
              ship_pric: v ? v.replace(/,/g, "") : "",
            }))
          }
          inputProps={{
            required: true,
            placeholder: "1000000",
            maxLength: 13,
          }}
        />

        {/* 납품 상태 */}
        <SelectField
          label="납품 상태"
          value={deliveryForm.ship_stat}
          onChange={(v) =>
            setDeliveryForm((f) => ({
              ...f,
              ship_stat: v as ShipmentStatus,
            }))
          }
          options={[
            { value: "pending", label: "대기" },
            { value: "delivered", label: "납품완료" },
            { value: "invoiced", label: "청구완료" },
            { value: "paid", label: "수금완료" },
          ]}
          triggerClassName="w-full border-slate-200 px-3"
        />

        {/* 납품일 */}
        <DateField
          label="납품일"
          value={deliveryForm.ship_date}
          onChange={(v) => setDeliveryForm((f) => ({ ...f, ship_date: v }))}
        />

        {/* 메모 */}
        <TextAreaField
          label="메모"
          value={deliveryForm.ship_memo ?? ""}
          onChange={(v) => setDeliveryForm((f) => ({ ...f, ship_memo: v }))}
          textareaProps={{
            rows: 3,
            placeholder: "선택 입력",
          }}
        />
      </div>
    </FormDialog>
  );
}