import * as React from "react";

import FormDialog from "@/components/focuswin/common/overlays/form-dialog";

import {
  ClientNameField,
  TextField,
  TextAreaField,
  MoneyField,
  SelectField,
  DateField,
} from "@/components/focuswin/common/form";

import type { OrderFormState, OrderStatus } from "@/types/order";

export default function OrderListFormDModal({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: boolean;
  form: OrderFormState;
  setForm: React.Dispatch<React.SetStateAction<OrderFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "수주 수정" : "수주 등록"}
      actionLabel={editing ? "수정" : "등록"}
      actionTone="primary"
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    >
      <div className="space-y-4">
        {/* 거래처 */}
        <ClientNameField
          label="거래처"
          required
          value={form.clie_name}
          clientId={form.clie_idno}
          onChange={(name, id) =>
            setForm((f) => ({
              ...f,
              clie_name: name,
              clie_idno: id,
            }))
          }
          placeholder="(주)OOO"
        />

        {/* 상품/서비스 */}
        <TextField
          label="상품/서비스"
          required
          value={form.prod_serv}
          onChange={(v) => setForm((f) => ({ ...f, prod_serv: v }))}
          inputProps={{
            required: true,
            placeholder: "예: 소프트웨어 개발",
            maxLength: 200,
          }}
        />

        {/* 금액 */}
        <MoneyField
          label="금액(원)"
          required
          value={form.orde_pric ?? ""}
          onChange={(v) =>
            setForm((f) => ({
              ...f,
              orde_pric: v ? v.replace(/,/g, "") : "",
            }))
          }
          inputProps={{
            required: true,
            placeholder: "5000000",
            maxLength: 13,
          }}
        />

        <div className="grid grid-cols-2 gap-3">
          {/* 상태 */}
          <SelectField
            label="상태"
            value={form.orde_stat}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                orde_stat: v as OrderStatus,
              }))
            }
            options={[
              { value: "proposal", label: "제안" },
              { value: "negotiation", label: "협상" },
              { value: "confirmed", label: "확정" },
              { value: "canceled", label: "취소" },
            ]}
            triggerClassName="w-full border-slate-200 px-3"
          />

          {/* 계약일 */}
          <DateField
            label="계약일"
            value={form.ctrt_date}
            onChange={(v) => setForm((f) => ({ ...f, ctrt_date: v }))}
          />
        </div>

        {/* 예상 납기 */}
        <DateField
          label="예상 납기"
          value={form.expd_date}
          onChange={(v) => setForm((f) => ({ ...f, expd_date: v }))}
        />

        {/* 메모 */}
        <TextAreaField
          label="메모"
          value={form.orde_memo}
          onChange={(v) => setForm((f) => ({ ...f, orde_memo: v }))}
          textareaProps={{
            rows: 3,
            placeholder: "선택 입력",
          }}
        />
      </div>
    </FormDialog>
  );
}