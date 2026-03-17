// client/src/components/focuswin/page/expense/detail/EditFormCard.tsx
// 지출 상세 수정 폼 (인라인 편집 모드)

import { cn } from "@/lib/utils";
import { TextField, TextAreaField } from "@/components/focuswin/common/form";
import { Card } from "@/components/focuswin/common/ui/card";
import type { ExpenseFormState } from "@/hooks/focuswin/expense/useExpenseCreateVM";

type SetForm = React.Dispatch<React.SetStateAction<ExpenseFormState>>;

const EXPENSE_TYPE_OPTIONS = [
  { value: "receipt",  label: "영수증" },
  { value: "invoice",  label: "명세서" },
  { value: "contract", label: "계약서" },
  { value: "other",    label: "기타" },
] as const;

const PAYM_METH_OPTIONS = [
  { value: "card",     label: "카드" },
  { value: "cash",     label: "현금" },
  { value: "transfer", label: "계좌이체" },
  { value: "other",    label: "기타" },
] as const;

const RECUR_TYPE_OPTIONS = [
  { value: "none",    label: "일회성" },
  { value: "monthly", label: "매월" },
  { value: "yearly",  label: "매년" },
  { value: "weekly",  label: "매주" },
  { value: "daily",   label: "매일" },
] as const;

export default function ExpenseEditFormCard({
  form,
  setForm,
}: {
  form: ExpenseFormState;
  setForm: SetForm;
}) {
  return (
    <Card>
      <div className="space-y-4">
        <TextField
          label="지출명"
          required
          value={form.expe_name}
          onChange={(v) => setForm((f) => ({ ...f, expe_name: v }))}
          inputProps={{ placeholder: "점심 식대, 사무용품 등" }}
        />

        <TextField
          label="금액 (원)"
          required
          value={form.expe_amnt}
          onChange={(v) => setForm((f) => ({ ...f, expe_amnt: v.replace(/[^0-9]/g, "") }))}
          inputProps={{ placeholder: "50000", inputMode: "numeric" }}
        />

        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">
            지출 일시 <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={form.expe_date}
            onChange={(e) => setForm((f) => ({ ...f, expe_date: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          />
        </div>

        <TextField
          label="거래처 (선택)"
          value={form.clie_name}
          onChange={(v) => setForm((f) => ({ ...f, clie_name: v, clie_idno: undefined }))}
          inputProps={{ placeholder: "거래처명 입력" }}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">증빙 유형</label>
            <select
              value={form.expe_type}
              onChange={(e) => setForm((f) => ({ ...f, expe_type: e.target.value as ExpenseFormState["expe_type"] }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {EXPENSE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">결제 방법</label>
            <select
              value={form.paym_meth}
              onChange={(e) => setForm((f) => ({ ...f, paym_meth: e.target.value as ExpenseFormState["paym_meth"] }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {PAYM_METH_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">반복 주기</label>
          <div className="flex flex-wrap gap-2">
            {RECUR_TYPE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, recr_type: o.value as ExpenseFormState["recr_type"] }))}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                  form.recr_type === o.value
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {form.recr_type !== "none" && (
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">반복 종료일 (선택)</label>
            <input
              type="date"
              value={form.recr_ends}
              onChange={(e) => setForm((f) => ({ ...f, recr_ends: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        )}

        <TextAreaField
          label="메모 (선택)"
          value={form.expe_memo}
          onChange={(v) => setForm((f) => ({ ...f, expe_memo: v }))}
          textareaProps={{ rows: 3, placeholder: "추가 메모" }}
        />
      </div>
    </Card>
  );
}
