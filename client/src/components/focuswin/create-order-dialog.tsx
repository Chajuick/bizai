import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type OrderFormState = {
  productService: string;
  amount: string;
  status: "proposal" | "negotiation" | "confirmed";
  contractDate: string;
  notes: string;
};

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
  selectedPromise: any | null;
  orderForm: OrderFormState;
  setOrderForm: React.Dispatch<React.SetStateAction<OrderFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-slate-100 bg-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-slate-900 font-black">수주 생성</DialogTitle>
          </div>

          {selectedPromise && (
            <p className="text-sm mt-2 text-slate-600">
              일정:{" "}
              <span className="text-slate-900 font-bold">{selectedPromise.title}</span>
            </p>
          )}
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {selectedPromise?.clientName && (
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                고객사
              </Label>
              <div className="px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900">
                {selectedPromise.clientName}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              상품/서비스 *
            </Label>
            <Input
              value={orderForm.productService}
              onChange={(e) => setOrderForm((f) => ({ ...f, productService: e.target.value }))}
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
              value={orderForm.amount}
              onChange={(e) => setOrderForm((f) => ({ ...f, amount: e.target.value }))}
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
                value={orderForm.status}
                onChange={(e) => setOrderForm((f) => ({ ...f, status: e.target.value as any }))}
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
                value={orderForm.contractDate}
                onChange={(e) => setOrderForm((f) => ({ ...f, contractDate: e.target.value }))}
                className="rounded-2xl border-slate-200"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              메모
            </Label>
            <Textarea
              value={orderForm.notes}
              onChange={(e) => setOrderForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="rounded-2xl border-slate-200 resize-none"
              placeholder="일정 메모에서 자동 입력"
            />
          </div>

          <Button
            type="submit"
            disabled={!!isSubmitting}
            className="w-full rounded-2xl text-white font-bold"
            style={{
              background: "rgb(37, 99, 235)",
              boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
            }}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            수주 생성
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}