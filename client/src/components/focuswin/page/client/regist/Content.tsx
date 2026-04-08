// src/components/focuswin/client/regist/Content.tsx

import { useClientRegistVM } from "@/hooks/focuswin/client/useClientRegistVM";
import ContactEditor from "@/components/focuswin/page/client/common/ContactEditor";

import { TextField, TextAreaField } from "@/components/focuswin/common/form";
import BusinessNumberField from "@/components/focuswin/common/form/business-number-field";
import { cn } from "@/lib/utils";
import type { ClientType } from "@/types/client";

const CLIENT_TYPE_OPTIONS: { value: ClientType; label: string; desc: string }[] = [
  { value: "sales",    label: "매출사", desc: "수주·납품 대상" },
  { value: "purchase", label: "매입사", desc: "비용·지출 대상" },
  { value: "both",     label: "둘 다",  desc: "매출 + 매입" },
];

type Props = { vm: ReturnType<typeof useClientRegistVM> };

export default function ClientRegistContent({ vm }: Props) {
  const bizNoError =
    vm.clientForm.bizn_numb.length > 0 && vm.clientForm.bizn_numb.length !== 10
      ? "사업자번호는 숫자 10자리여야 합니다."
      : undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* 거래처 기본정보 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          label="거래처명"
          required
          value={vm.clientForm.clie_name}
          onChange={v => vm.setClientForm(p => ({ ...p, clie_name: v }))}
          className="sm:col-span-2"
          inputProps={{
            disabled: vm.isSaving,
            placeholder: "거래처명 입력",
            maxLength: 200,
            required: true,
          }}
        />

        {/* 거래처 유형 */}
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold text-slate-500 mb-2">거래처 유형</p>
          <div className="grid grid-cols-3 gap-2">
            {CLIENT_TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                disabled={vm.isSaving}
                onClick={() => vm.setClientForm(p => ({ ...p, clie_type: opt.value }))}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2.5 text-center transition-colors",
                  vm.clientForm.clie_type === opt.value
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

        <BusinessNumberField
          value={vm.clientForm.bizn_numb}
          onChange={(v) => vm.setClientForm((p) => ({ ...p, bizn_numb: v }))}
          error={bizNoError}
          inputProps={{
            disabled: vm.isSaving,
          }}
        />

        <TextField
          label="업종"
          value={vm.clientForm.indu_type}
          onChange={v => vm.setClientForm(p => ({ ...p, indu_type: v }))}
          inputProps={{
            disabled: vm.isSaving,
            placeholder: "업종 입력",
            maxLength: 100,
          }}
        />

        <TextField
          label="주소"
          value={vm.clientForm.clie_addr}
          onChange={v => vm.setClientForm(p => ({ ...p, clie_addr: v }))}
          className={"sm:col-span-2"}
          inputProps={{
            disabled: vm.isSaving,
            placeholder: "주소 입력",
            maxLength: 300,
          }}
        />

        <TextAreaField
          label="메모"
          value={vm.clientForm.clie_memo}
          onChange={v => vm.setClientForm(p => ({ ...p, clie_memo: v }))}
          className={"sm:col-span-2"}
          textareaProps={{
            disabled: vm.isSaving,
            placeholder: "메모 입력",
            rows: 4,
          }}
        />
      </section>

      {/* 담당자 */}
      <ContactEditor contacts={vm.contactsDraft} onAdd={vm.addContact} onChange={vm.updateContact} onRemove={vm.removeContact} disabled={vm.isSaving} />
    </div>
  );
}
