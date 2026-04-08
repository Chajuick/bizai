// client/src/components/focuswin/page/shipment/list/FormModal.tsx
import * as React from "react";

import FormDialog from "@/components/focuswin/common/overlays/form-dialog";

import {
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
      label: `${o.clie_name} — ${o.prod_serv}`,
    })) ?? [];

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "납품 수정" : "납품 등록"}
      actionLabel={editing ? "수정" : "등록"}
      actionTone="primary"
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    >
      <div className="space-y-4">
        {/* 연결 수주 (필수) */}
        {orders && orders.length > 0 ? (
          <SelectField
            label="연결 수주"
            required
            value={form.orde_idno ? String(form.orde_idno) : ""}
            onChange={(v) => {
              const order = orders.find((o) => String(o.orde_idno) === v);
              setForm((f) => ({
                ...f,
                orde_idno: v,
                clie_name: order?.clie_name ?? "",
                ship_pric: order ? String(order.orde_pric) : f.ship_pric,
              }));
            }}
            placeholder="수주를 선택하세요"
            options={orderOptions}
            triggerClassName="w-full border-slate-200 px-3"
          />
        ) : (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">연결 수주 <span className="text-red-500">*</span></p>
            <p className="text-sm text-slate-400 bg-slate-50 rounded-xl px-3 py-2.5">
              확정된 수주가 없습니다. 수주를 먼저 등록해주세요.
            </p>
          </div>
        )}

        {/* 거래처 (수주에서 자동 입력, 수정 불가) */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500">거래처</p>
          <p className={`text-sm rounded-xl px-3 py-2.5 ${form.clie_name ? "bg-slate-50 text-slate-700 font-medium" : "bg-slate-50 text-slate-400"}`}>
            {form.clie_name || "수주 선택 후 자동 입력"}
          </p>
        </div>

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
            placeholder: "5,000,000",
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
          triggerClassName="w-full border-slate-200 px-3"
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
      </div>
    </FormDialog>
  );
}