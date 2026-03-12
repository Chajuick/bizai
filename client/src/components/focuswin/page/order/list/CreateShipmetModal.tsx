import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/focuswin/common/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-slate-100 bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-900 font-black">납품 생성</DialogTitle>

          {selectedOrder ? (
            <p className="mt-2 text-sm text-slate-600">
              거래처: <span className="font-bold text-slate-900">{selectedOrder.clie_name}</span>
            </p>
          ) : null}
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* 수익 금액 */}
          <MoneyField
            label="수익 금액(원)"
            required
            value={deliveryForm.ship_pric ?? ""}
            onChange={(v) =>
              setDeliveryForm((f) => ({
                ...f,
                // MoneyField는 콤마가 포함될 수 있어 저장 시 제거 (string 유지)
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
            triggerClassName="border-slate-200 px-3 w-full"
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

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl text-white font-bold"
            style={{
              background: "rgb(37, 99, 235)",
              boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
            }}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            납품 생성
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}