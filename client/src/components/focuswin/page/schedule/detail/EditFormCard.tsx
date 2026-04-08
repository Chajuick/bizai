// components/focuswin/page/schedule/detail/EditFormCard.tsx

import * as React from "react";
import { Card } from "@/components/focuswin/common/ui/card";
import {
  ClientNameField,
  TextField,
  DateTimeField,
  TextAreaField,
  SelectField,
} from "@/components/focuswin/common/form";
import type { ScheduleFormState } from "@/types/schedule";

type Props = {
  form: ScheduleFormState;
  setForm: React.Dispatch<React.SetStateAction<ScheduleFormState>>;
};

export default function ScheduleDetailEditFormCard({ form, setForm }: Props) {
  return (
    <Card>
      <p className="text-xs font-extrabold tracking-[0.14em] text-slate-400 uppercase">편집 모드</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ClientNameField
          className="sm:col-span-2"
          label="거래처"
          value={form.clie_name}
          clientId={form.clie_idno}
          onChange={(name, id) => setForm(f => ({ ...f, clie_name: name, clie_idno: id }))}
          placeholder="(주)OOO"
        />

        <TextField
          className="sm:col-span-2"
          label="일정 내용"
          required
          value={form.sche_name}
          onChange={v => setForm(f => ({ ...f, sche_name: v }))}
          inputProps={{ placeholder: "제안서 발표 미팅", required: true, maxLength: 200 }}
        />

        <DateTimeField
          className="sm:col-span-2"
          label="일시"
          required
          value={form.sche_date}
          onChange={v => setForm(f => ({ ...f, sche_date: v }))}
          inputProps={{ required: true }}
        />

        <SelectField
          className="sm:col-span-2"
          label="상태"
          value={form.stat_code ?? "scheduled"}
          onChange={v => setForm(f => ({ ...f, stat_code: v as "scheduled" | "completed" | "canceled" }))}
          options={[
            { value: "scheduled", label: "예정" },
            { value: "completed", label: "완료" },
            { value: "canceled", label: "취소" },
          ]}
          triggerClassName="border-slate-200 px-3 w-full"
        />
      </div>

      <TextAreaField
        label="메모"
        value={form.sche_desc ?? ""}
        onChange={v => setForm(f => ({ ...f, sche_desc: v }))}
        textareaProps={{ rows: 3, placeholder: "일정 관련 메모" }}
      />
    </Card>
  );
}
