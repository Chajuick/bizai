// client/src/components/focuswin/deliveries/delivery-form-dialog.tsx
"use client";

import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import type { DeliveryFormState, DeliveryStatus } from "./deliveries.types";

export default function DeliveryFormDialog({
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
  form: DeliveryFormState;
  setForm: React.Dispatch<React.SetStateAction<DeliveryFormState>>;
  orders?: any[];
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-slate-100 bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-900 font-black">{editing ? "납품 수정" : "납품 등록"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {!!orders?.length && (
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">연결 수주(선택)</Label>
              <select
                value={form.orderId}
                onChange={(e) => {
                  const v = e.target.value;
                  const order = orders.find((o) => String(o.id) === v);
                  setForm((f) => ({
                    ...f,
                    orderId: v,
                    clientName: order?.clientName || f.clientName,
                    revenueAmount: order ? String(order.amount) : f.revenueAmount,
                  }));
                }}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900"
              >
                <option value="">선택 안함</option>
                {orders.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.clientName} - {o.productService}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">고객사 *</Label>
            <Input
              value={form.clientName}
              onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
              required
              className="rounded-2xl border-slate-200"
              placeholder="(주)OOO"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">매출 금액(원) *</Label>
            <Input
              type="number"
              value={form.revenueAmount}
              onChange={(e) => setForm((f) => ({ ...f, revenueAmount: e.target.value }))}
              required
              className="rounded-2xl border-slate-200"
              placeholder="5000000"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">납품 상태</Label>
            <select
              value={form.deliveryStatus}
              onChange={(e) => setForm((f) => ({ ...f, deliveryStatus: e.target.value as DeliveryStatus }))}
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
              value={form.deliveredAt}
              onChange={(e) => setForm((f) => ({ ...f, deliveredAt: e.target.value }))}
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
