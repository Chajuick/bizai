// src/components/focuswin/client/regist/Content.tsx

import { useClientRegistVM } from "@/hooks/focuswin/client/useClientRegistVM";
import ContactEditor from "@/components/focuswin/page/client/common/ContactEditor";

import { TextField, TextAreaField } from "@/components/focuswin/common/form";
import BusinessNumberField from "@/components/focuswin/common/form/business-number-field";

type Props = { vm: ReturnType<typeof useClientRegistVM> };

export default function ClientRegistContent({ vm }: Props) {
  const bizNoError =
    vm.clientForm.bizr_numb.length > 0 && vm.clientForm.bizr_numb.length !== 10
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

        <BusinessNumberField
          value={vm.clientForm.bizr_numb}
          onChange={(v) => vm.setClientForm((p) => ({ ...p, bizr_numb: v }))}
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
