// src/components/focuswin/client/detail/EditFormCard.tsx

// #region Imports
import { cn } from "@/lib/utils";
import { Card } from "@/components/focuswin/common/ui/card";

import { TextField, TextAreaField } from "@/components/focuswin/common/form";

import BusinessNumberField from "@/components/focuswin/common/form/business-number-field";

import type { ClientDraft, ClientType } from "@/types/client";
// #endregion

// #region Types
type Props = {
  form: ClientDraft;
  setForm: React.Dispatch<React.SetStateAction<ClientDraft>>;
};

const CLIENT_TYPE_OPTIONS: { value: ClientType; label: string; desc: string }[] = [
  { value: "sales", label: "매출사", desc: "수주·납품 대상 거래처" },
  { value: "purchase", label: "매입사", desc: "비용·지출 대상 거래처" },
  { value: "both", label: "둘 다", desc: "매출 + 매입 거래처" },
];
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

        {/* 거래처 유형 (1줄 전체) */}
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold text-slate-500 mb-2">거래처 유형</p>
          <div className="grid grid-cols-3 gap-2">
            {CLIENT_TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, clie_type: opt.value }))}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2.5 text-center transition-colors",
                  form.clie_type === opt.value
                    ? "border-blue-400 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <span className="text-sm font-bold">{opt.label}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</span>
              </button>
            ))}
          </div>
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
