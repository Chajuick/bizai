import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/focuswin/common/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-slate-100 bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-900 font-black">
            {editing ? "수주 수정" : "수주 등록"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* 거래처 */}
          <ClientNameField
            label="거래처"
            required
            value={form.clie_name}
            clientId={form.clie_idno}
            onChange={(name, id) => setForm((f) => ({ ...f, clie_name: name, clie_idno: id }))}
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
                // MoneyField 입력값은 콤마가 포함될 수 있어서 저장 시 제거 (string 유지)
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
              onChange={(v) => setForm((f) => ({ ...f, orde_stat: v as OrderStatus }))}
              options={[
                { value: "proposal", label: "제안" },
                { value: "negotiation", label: "협상" },
                { value: "confirmed", label: "확정" },
                { value: "canceled", label: "취소" },
              ]}
              triggerClassName="border-slate-200 px-3 w-full"
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