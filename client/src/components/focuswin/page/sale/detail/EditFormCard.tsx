// src/components/.../SaleDetailEditFormCard.tsx

// #region Imports
import * as React from "react";

import { Card } from "@/components/focuswin/common/ui/card";
import { ClientNameField, TextField, DateTimeField, TextAreaField, TelField, RegexField, MoneyField } from "@/components/focuswin/common/form";

import type { SaleEditForm } from "@/types/sale";
// #endregion

// #region Types
type Props = {
  form: SaleEditForm;
  setForm: React.Dispatch<React.SetStateAction<SaleEditForm>>;
};
// #endregion

// #region Component
export default function SaleDetailEditFormCard({ form, setForm }: Props) {
  return (
    <Card>
      <p className="text-xs font-extrabold tracking-[0.14em] text-slate-400 uppercase mb-4">편집 모드</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 거래처 */}
        <ClientNameField label="거래처" value={form.clie_name} clientId={form.clie_idno} onChange={(name, id) => setForm(f => ({ ...f, clie_name: name, clie_idno: id }))} placeholder="(주)포커스윈" />

        {/* 담당자 */}
        <TextField label="담당자" value={form.cont_name ?? ""} onChange={v => setForm(f => ({ ...f, cont_name: v }))} inputProps={{ placeholder: "홍길동 부장", maxLength: 100 }} />

        {/* 업무 */}
        <TextField label="업무" value={form.cont_role ?? ""} onChange={v => setForm(f => ({ ...f, cont_role: v }))} inputProps={{ placeholder: "영업팀장", maxLength: 100 }} />

        {/* 연락처 */}
        <TelField label="연락처" value={form.cont_tele ?? ""} onChange={v => setForm(f => ({ ...f, cont_tele: v }))} inputProps={{ placeholder: "010-0000-0000" }} />

        {/* 이메일 */}
        <RegexField
          label="이메일"
          value={form.cont_mail ?? ""}
          onChange={v => setForm(f => ({ ...f, cont_mail: v }))}
          pattern={/^[^\s@]+@[^\s@]+\.[^\s@]+$/}
          errorMessage="이메일 형식이 올바르지 않습니다."
          validateMode="blur"
          normalize={v => v.trim()}
          inputProps={{ placeholder: "focuswin@focuswin.com", maxLength: 254 }}
        />

        {/* 방문일시 */}
        <DateTimeField label="방문일시" value={form.vist_date} onChange={v => setForm(f => ({ ...f, vist_date: v }))} />

        {/* 장소 */}
        <TextField label="장소" value={form.sale_loca} onChange={v => setForm(f => ({ ...f, sale_loca: v }))} inputProps={{ placeholder: "서울 강남구" }} />

        {/* 금액 */}
        <MoneyField
          label="금액 (원)"
          value={form.sale_pric ? String(form.sale_pric) : ""}
          onChange={v =>
            setForm(f => ({
              ...f,
              sale_pric: v ? Number(v.replace(/,/g, "")) : undefined,
            }))
          }
          inputProps={{ placeholder: "1000000", maxLength: 13 }}
        />
      </div>

      {/* memo */}
      <div className="mt-4">
        <TextAreaField label="내용" value={form.orig_memo} onChange={v => setForm(f => ({ ...f, orig_memo: v }))} textareaProps={{ rows: 8, placeholder: "메모를 입력하세요" }} />
      </div>
    </Card>
  );
}
// #endregion
