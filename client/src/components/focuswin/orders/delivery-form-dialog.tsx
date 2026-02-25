import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import type { OrderDeliveryFormState, OrderRow } from "@/types/order";
import type { DeliveryStatus } from "@/types/delivery";

export default function DeliveryFormDialog({
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
  deliveryForm: OrderDeliveryFormState;
  setDeliveryForm: React.Dispatch<React.SetStateAction<OrderDeliveryFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-slate-100 bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-900 font-black">납품 생성</DialogTitle>
          {selectedOrder && (
            <p className="mt-2 text-sm text-slate-600">
              고객사: <span className="font-bold text-slate-900">{selectedOrder.clientName}</span>
            </p>
          )}
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">수익 금액(원) *</Label>
            <Input
              type="number"
              value={deliveryForm.revenueAmount}
              onChange={(e) => setDeliveryForm((f) => ({ ...f, revenueAmount: e.target.value }))}
              required
              className="rounded-2xl border-slate-200"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">납품 상태</Label>
            <select
              value={deliveryForm.deliveryStatus}
              onChange={(e) => setDeliveryForm((f) => ({ ...f, deliveryStatus: e.target.value as DeliveryStatus }))}
              className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900"
            >
              <option value="pending">대기</option>
              <option value="delivered">납품완료</option>
              <option value="invoiced">청구완료</option>
              <option value="paid">수금완료</option>
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">납품일</Label>
            <Input
              type="date"
              value={deliveryForm.deliveredAt}
              onChange={(e) => setDeliveryForm((f) => ({ ...f, deliveredAt: e.target.value }))}
              className="rounded-2xl border-slate-200"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">메모</Label>
            <Textarea
              value={deliveryForm.notes}
              onChange={(e) => setDeliveryForm((f) => ({ ...f, notes: e.target.value }))}
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
            납품 생성
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
