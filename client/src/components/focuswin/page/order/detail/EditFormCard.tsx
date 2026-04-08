// components/focuswin/page/order/detail/EditFormCard.tsx

import * as React from "react";
import { Card } from "@/components/focuswin/common/ui/card";
import {
  ClientNameField,
  TextField,
  MoneyField,
  SelectField,
  DateField,
  TextAreaField,
} from "@/components/focuswin/common/form";
import type { OrderFormState, OrderStatus } from "@/types/order";

const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "proposal",    label: "견적" },
  { value: "negotiation", label: "협상" },
  { value: "confirmed",   label: "확정" },
  { value: "canceled",    label: "취소" },
];

type Props = {
  form: OrderFormState;
  setForm: React.Dispatch<React.SetStateAction<OrderFormState>>;
};

export default function OrderDetailEditFormCard({ form, setForm }: Props) {
  return (
    <Card>
      <p className="text-xs font-extrabold tracking-[0.14em] text-slate-400 uppercase">편집 모드</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ClientNameField
          className="sm:col-span-2"
          label="거래처"
          required
          value={form.clie_name}
          clientId={form.clie_idno}
          onChange={(name, id) => setForm(f => ({ ...f, clie_name: name, clie_idno: id }))}
          placeholder="(주)OOO"
        />

        <TextField
          className="sm:col-span-2"
          label="품목 / 서비스"
          required
          value={form.prod_serv}
          onChange={v => setForm(f => ({ ...f, prod_serv: v }))}
          inputProps={{ placeholder: "예: 서버 납품, 유지보수 계약" }}
        />

        <MoneyField
          label="계약금액 (원)"
          required
          value={form.orde_pric}
          onChange={v => setForm(f => ({ ...f, orde_pric: v }))}
          inputProps={{ placeholder: "10000000" }}
        />

        <SelectField
          label="상태"
          value={form.orde_stat}
          onChange={v => setForm(f => ({ ...f, orde_stat: v as OrderStatus }))}
          options={ORDER_STATUS_OPTIONS}
        />

        <DateField
          label="계약일"
          value={form.ctrt_date ?? ""}
          onChange={v => setForm(f => ({ ...f, ctrt_date: v }))}
        />

        <DateField
          label="납기일"
          value={form.expd_date ?? ""}
          onChange={v => setForm(f => ({ ...f, expd_date: v }))}
        />
      </div>

      <TextAreaField
        label="메모"
        value={form.orde_memo ?? ""}
        onChange={v => setForm(f => ({ ...f, orde_memo: v }))}
        textareaProps={{ rows: 3, placeholder: "참고사항을 입력하세요" }}
      />
    </Card>
  );
}
