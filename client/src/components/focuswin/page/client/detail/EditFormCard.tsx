// src/components/focuswin/client/detail/EditFormCard.tsx

// #region Imports
import { Card } from "@/components/focuswin/common/ui/card";

import { TextField, TextAreaField } from "@/components/focuswin/common/form";

import BusinessNumberField from "@/components/focuswin/common/form/business-number-field";

import type { ClientDraft } from "@/types/client";
// #endregion

// #region Types
type Props = {
  form: ClientDraft;
  setForm: React.Dispatch<React.SetStateAction<ClientDraft>>;
};
// #endregion

export default function ClientDetailEditFormCard({ form, setForm }: Props) {
  const bizNo = form.bizn_numb ?? "";

  const bizNoError = bizNo.length > 0 && bizNo.length !== 10 ? "숫자 10자리여야 합니다." : undefined;

  return (
    <Card>
      <p className="text-xs font-extrabold tracking-[0.14em] text-slate-400 uppercase mb-4">편집 모드</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 거래처 (1줄 전체) */}
        <div className="sm:col-span-2">
          <TextField
            label="거래처"
            required
            value={form.clie_name}
            onChange={v => setForm(f => ({ ...f, clie_name: v }))}
            inputProps={{
              placeholder: "거래처명",
              maxLength: 200,
            }}
          />
        </div>

        {/* 업종 */}
        <TextField
          label="업종"
          value={form.indu_type}
          onChange={v => setForm(f => ({ ...f, indu_type: v }))}
          inputProps={{
            placeholder: "업종 입력",
          }}
        />

        {/* 사업자번호 */}
        <BusinessNumberField
          label="사업자번호"
          value={bizNo}
          onChange={v => setForm(f => ({ ...f, bizn_numb: v }))}
          error={bizNoError}
          inputProps={{
            placeholder: "숫자 10자리",
            maxLength: 10,
          }}
        />

        {/* 주소 (1줄 전체) */}
        <div className="sm:col-span-2">
          <TextField
            label="주소"
            value={form.clie_addr}
            onChange={v => setForm(f => ({ ...f, clie_addr: v }))}
            inputProps={{
              placeholder: "주소 입력",
            }}
          />
        </div>

        {/* 메모 (1줄 전체) */}
        <div className="sm:col-span-2">
          <TextAreaField
            label="메모"
            value={form.clie_memo}
            onChange={v => setForm(f => ({ ...f, clie_memo: v }))}
            textareaProps={{
              rows: 6,
              placeholder: "메모 입력",
            }}
          />
        </div>
      </div>
    </Card>
  );
}
