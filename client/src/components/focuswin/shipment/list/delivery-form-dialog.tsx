// client/src/components/focuswin/deliveries/delivery-form-dialog.tsx
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/focuswin/common/ui/input";
import { Textarea } from "@/components/focuswin/common/ui/textarea";
import { Button } from "@/components/focuswin/common/ui/button";

import type { DeliveryFormState, DeliveryStatus } from "@/types/delivery";

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
                value={form.orde_idno}
                onChange={(e) => {
                  const v = e.target.value;
                  const order = orders.find((o) => String(o.orde_idno) === v);
                  setForm((f) => ({
                    ...f,
                    orde_idno: v,
                    clie_name: order?.clie_name || f.clie_name,
                    ship_pric: order ? String(order.orde_pric) : f.ship_pric,
                  }));
                }}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900"
              >
                <option value="">선택 안함</option>
                {orders.map((o) => (
                  <option key={o.orde_idno} value={String(o.orde_idno)}>
                    {o.clie_name} - {o.prod_serv}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">고객사 *</Label>
            <Input
              value={form.clie_name}
              onChange={(e) => setForm((f) => ({ ...f, clie_name: e.target.value }))}
              required
              className="rounded-2xl border-slate-200"
              placeholder="(주)OOO"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">매출 금액(원) *</Label>
            <Input
              type="number"
              value={form.ship_pric}
              onChange={(e) => setForm((f) => ({ ...f, ship_pric: e.target.value }))}
              required
              className="rounded-2xl border-slate-200"
              placeholder="5000000"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">납품 상태</Label>
            <select
              value={form.stat_code}
              onChange={(e) => setForm((f) => ({ ...f, stat_code: e.target.value as DeliveryStatus }))}
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
              value={form.ship_date}
              onChange={(e) => setForm((f) => ({ ...f, ship_date: e.target.value }))}
              className="rounded-2xl border-slate-200"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">메모</Label>
            <Textarea
              value={form.ship_memo}
              onChange={(e) => setForm((f) => ({ ...f, ship_memo: e.target.value }))}
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
