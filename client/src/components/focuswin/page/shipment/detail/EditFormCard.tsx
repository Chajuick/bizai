// components/focuswin/page/shipment/detail/EditFormCard.tsx

import { Card } from "@/components/focuswin/common/ui/card";
import { SelectField, DateTimeField, TextAreaField, TextField } from "@/components/focuswin/common/form";
import type { useShipmentDetailVM } from "@/hooks/focuswin/shipment/useShipmentDetailVM";

type VM = ReturnType<typeof useShipmentDetailVM>;

const STAT_OPTIONS = [
  { value: "pending",   label: "대기" },
  { value: "delivered", label: "납품완료" },
  { value: "invoiced",  label: "청구완료" },
  { value: "paid",      label: "수금완료" },
];

export default function ShipmentDetailEditFormCard({ vm }: { vm: VM }) {
  const { form, setForm } = vm;

  return (
    <Card>
      <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-4">납품 수정</p>
      <div className="space-y-4">
        <SelectField
          label="상태"
          value={form.ship_stat}
          options={STAT_OPTIONS}
          onChange={(v) => setForm((f) => ({ ...f, ship_stat: v as typeof form.ship_stat }))}
        />
        <TextField
          label="금액"
          value={form.ship_pric}
          onChange={(v) => setForm((f) => ({ ...f, ship_pric: v }))}
          required
        />
        <DateTimeField
          label="납품일"
          value={form.ship_date}
          onChange={(v) => setForm((f) => ({ ...f, ship_date: v }))}
        />
        <TextAreaField
          label="메모"
          value={form.ship_memo}
          onChange={(v) => setForm((f) => ({ ...f, ship_memo: v }))}
          textareaProps={{ rows: 3 }}
        />
      </div>
    </Card>
  );
}
