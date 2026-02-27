import React from "react";
import { Input } from "@/components/focuswin/common/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/focuswin/common/ui/textarea";
import FormDialog from "@/components/focuswin/common/form-dialog";

import type { OrderQuickFormState } from "@/types/order";
import type { EnhancedPromise } from "@/types/promise";

export type { OrderQuickFormState };
/** @deprecated OrderFormState → OrderQuickFormState 로 변경되었습니다. @/types/order 에서 import하세요. */
export type OrderFormState = OrderQuickFormState;

export default function CreateOrderDialog({
  open,
  onOpenChange,
  selectedPromise,
  orderForm,
  setOrderForm,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPromise: EnhancedPromise | null;
  orderForm: OrderQuickFormState;
  setOrderForm: React.Dispatch<React.SetStateAction<OrderQuickFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
}) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="수주 생성"
      subtitle={
        selectedPromise ? (
          <p className="text-sm text-slate-600">
            일정: <span className="text-slate-900 font-bold">{selectedPromise.sche_name}</span>
          </p>
        ) : null
      }
      actionLabel="수주 생성"
      actionTone="primary"
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    >
      {selectedPromise?.clie_name && (
        <div>
          <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
            고객사
          </Label>
          <div className="px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900">
            {selectedPromise.clie_name}
          </div>
        </div>
      )}

      <div>
        <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
          상품/서비스 *
        </Label>
        <Input
          value={orderForm.prod_serv}
          onChange={(e) => setOrderForm((f) => ({ ...f, prod_serv: e.target.value }))}
          required
          placeholder="예: 소프트웨어 개발"
          className="rounded-2xl border-slate-200"
        />
      </div>

      <div>
        <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
          예상 금액 (원) *
        </Label>
        <Input
          type="number"
          value={orderForm.orde_pric}
          onChange={(e) => setOrderForm((f) => ({ ...f, orde_pric: e.target.value }))}
          required
          placeholder="5000000"
          className="rounded-2xl border-slate-200"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
            초기 상태
          </Label>
          <select
            value={orderForm.stat_code}
            onChange={(e) =>
              setOrderForm((f) => ({
                ...f,
                stat_code: e.target.value as OrderQuickFormState["stat_code"],
              }))
            }
            className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900"
          >
            <option value="proposal">제안</option>
            <option value="negotiation">협상</option>
            <option value="confirmed">확정</option>
          </select>
        </div>

        <div>
          <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
            계약일
          </Label>
          <Input
            type="date"
            value={orderForm.ctrt_date}
            onChange={(e) => setOrderForm((f) => ({ ...f, ctrt_date: e.target.value }))}
            className="rounded-2xl border-slate-200"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">메모</Label>
        <Textarea
          value={orderForm.orde_memo}
          onChange={(e) => setOrderForm((f) => ({ ...f, orde_memo: e.target.value }))}
          rows={2}
          className="rounded-2xl border-slate-200 resize-none"
          placeholder="일정 메모에서 자동 입력"
        />
      </div>
    </FormDialog>
  );
}