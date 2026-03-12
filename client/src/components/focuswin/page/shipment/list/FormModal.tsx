// client/src/components/focuswin/page/shipment/list/FormModal.tsx
import * as React from "react";
import { Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/focuswin/common/ui/button";

import {
  TextField,
  TextAreaField,
  MoneyField,
  SelectField,
  DateField,
} from "@/components/focuswin/common/form";

import type { ShipmentFormState, ShipmentStatus } from "@/types/shipment";

export default function ShipmentListFormModal({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  orders,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: boolean;
  form: ShipmentFormState;
  setForm: React.Dispatch<React.SetStateAction<ShipmentFormState>>;
  orders?: any[];
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}) {
  const orderOptions =
    orders?.map((o) => ({
      value: String(o.orde_idno),
      label: (
        <span className="flex items-center gap-2 min-w-0">
          <span className="truncate">{o.clie_name}</span>
          <span className="text-slate-400 shrink-0">-</span>
          <span className="truncate text-slate-600">{o.prod_serv}</span>
        </span>
      ),
    })) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-slate-100 bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-900 font-black">
            {editing ? "납품 수정" : "납품 등록"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* 연결 수주(선택) */}
          {!!orders?.length ? (
            <SelectField
              label="연결 수주"
              value={form.orde_idno ? String(form.orde_idno) : ""}
              onChange={(v) => {
                const order = orders.find((o) => String(o.orde_idno) === v);

                setForm((f) => ({
                  ...f,
                  // 기존 로직 유지: 값은 string으로 넣고 있었음
                  orde_idno: v,
                  clie_name: order?.clie_name || f.clie_name,
                  ship_pric: order ? String(order.orde_pric) : f.ship_pric,
                }));
              }}
              placeholder="선택 안함"
              options={orderOptions}
              triggerClassName="border-slate-200 px-3 w-full"
            />
          ) : null}

          {/* 거래처 */}
          <TextField
            label="거래처"
            required
            value={form.clie_name}
            onChange={(v) => setForm((f) => ({ ...f, clie_name: v }))}
            inputProps={{
              required: true,
              placeholder: "(주)OOO",
              maxLength: 200,
            }}
          />

          {/* 매출 금액 */}
          <MoneyField
            label="매출 금액(원)"
            required
            value={form.ship_pric ?? ""}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                ship_pric: v ? v.replace(/,/g, "") : "",
              }))
            }
            inputProps={{
              required: true,
              placeholder: "5000000",
              maxLength: 13,
            }}
          />

          {/* 납품 상태 */}
          <SelectField
            label="납품 상태"
            value={form.ship_stat}
            onChange={(v) =>
              setForm((f) => ({
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
            value={form.ship_date}
            onChange={(v) => setForm((f) => ({ ...f, ship_date: v }))}
          />

          {/* 메모 */}
          <TextAreaField
            label="메모"
            value={form.ship_memo ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, ship_memo: v }))}
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
            {editing ? "수정" : "등록"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}