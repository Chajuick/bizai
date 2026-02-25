import { Loader2 } from "lucide-react";
import ClientNameInput from "@/components/ClientNameInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import type { OrderFormState, OrderStatus } from "@/types/order";

export default function OrderFormDialog({
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
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">고객사 *</Label>
            <ClientNameInput
              value={form.clientName}
              clientId={form.clientId}
              onChange={(name, id) => setForm((f) => ({ ...f, clientName: name, clientId: id }))}
              placeholder="(주)OOO"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">상품/서비스 *</Label>
            <Input
              value={form.productService}
              onChange={(e) => setForm((f) => ({ ...f, productService: e.target.value }))}
              required
              className="rounded-2xl border-slate-200"
              placeholder="예: 소프트웨어 개발"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">금액(원) *</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
              className="rounded-2xl border-slate-200"
              placeholder="5000000"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">상태</Label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as OrderStatus }))}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900"
              >
                <option value="proposal">제안</option>
                <option value="negotiation">협상</option>
                <option value="confirmed">확정</option>
                <option value="canceled">취소</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">계약일</Label>
              <Input
                type="date"
                value={form.contractDate}
                onChange={(e) => setForm((f) => ({ ...f, contractDate: e.target.value }))}
                className="rounded-2xl border-slate-200"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">예상 납기</Label>
            <Input
              type="date"
              value={form.expectedDeliveryDate}
              onChange={(e) => setForm((f) => ({ ...f, expectedDeliveryDate: e.target.value }))}
              className="rounded-2xl border-slate-200"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">메모</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="rounded-2xl border-slate-200 resize-none"
              placeholder="선택 입력"
            />
          </div>

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