// src/components/.../ScheduleListFormModal.tsx

// #region Imports
import * as React from "react";

import FormDialog from "@/components/focuswin/common/overlays/form-dialog";

import {
  ClientNameField,
  TextField,
  DateTimeField,
  TextAreaField,
  SelectField,
} from "@/components/focuswin/common/form";

import type { ScheduleFormState } from "@/types/schedule";
// #endregion

// #region Types
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;

  form: ScheduleFormState;
  setForm: React.Dispatch<React.SetStateAction<ScheduleFormState>>;

  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
};
// #endregion

// #region Component
export default function ScheduleListFormModal({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  onSubmit,
  isSubmitting,
}: Props) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "일정 수정" : "일정 추가"}
      actionLabel={editing ? "수정" : "등록"}
      actionTone="primary"
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {/* 거래처 (선택) */}
          <ClientNameField
            label="거래처"
            value={form.clie_name}
            clientId={form.clie_idno}
            onChange={(name, id) =>
              setForm((f) => ({
                ...f,
                clie_name: name,
                clie_idno: id,
              }))
            }
            placeholder="(주)삼성전자"
          />

          {/* 일정 내용 */}
          <TextField
            label="일정 내용"
            required
            value={form.sche_name}
            onChange={(v) => setForm((f) => ({ ...f, sche_name: v }))}
            inputProps={{
              placeholder: "제안서 발표 미팅",
              required: true,
              maxLength: 200,
            }}
          />

          {/* 일시 */}
          <DateTimeField
            label="일시"
            required
            value={form.sche_date}
            onChange={(v) => setForm((f) => ({ ...f, sche_date: v }))}
            inputProps={{ required: true }}
          />
        </div>

        {/* 메모 */}
        <TextAreaField
          label="메모"
          value={form.sche_desc ?? ""}
          onChange={(v) => setForm((f) => ({ ...f, sche_desc: v }))}
          textareaProps={{
            rows: 3,
            placeholder: "일정 관련 메모",
          }}
        />

        {/* 상태 (편집일 때만) */}
        {editing ? (
          <SelectField
            label="상태"
            value={form.stat_code ?? "scheduled"}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                stat_code: v as "scheduled" | "completed" | "canceled",
              }))
            }
            options={[
              { value: "scheduled", label: "예정" },
              { value: "completed", label: "완료" },
              { value: "canceled", label: "취소" },
            ]}
            triggerClassName="border-slate-200 px-3 w-full"
          />
        ) : null}
      </div>
    </FormDialog>
  );
}
// #endregion