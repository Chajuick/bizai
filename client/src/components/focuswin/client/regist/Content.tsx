// src/components/focuswin/client/regist/Content.tsx

import { useClientRegistVM } from "@/hooks/focuswin/client/useClientRegistVM";
import ContactEditor from "@/components/focuswin/client/common/ContactEditor";

type Props = { vm: ReturnType<typeof useClientRegistVM> };

export default function ClientRegistContent({ vm }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* 고객사 기본정보 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          disabled={vm.isSaving}
          value={vm.clientForm.clie_name}
          onChange={(e) => vm.setClientForm((p) => ({ ...p, clie_name: e.target.value }))}
          placeholder="고객사명 *"
          className="focuswin-input sm:col-span-2"
        />
        <input
          disabled={vm.isSaving}
          value={vm.clientForm.indu_type}
          onChange={(e) => vm.setClientForm((p) => ({ ...p, indu_type: e.target.value }))}
          placeholder="업종"
          className="focuswin-input"
        />
        <input
          disabled={vm.isSaving}
          value={vm.clientForm.clie_addr}
          onChange={(e) => vm.setClientForm((p) => ({ ...p, clie_addr: e.target.value }))}
          placeholder="주소"
          className="focuswin-input"
        />
        <textarea
          disabled={vm.isSaving}
          value={vm.clientForm.clie_memo}
          onChange={(e) => vm.setClientForm((p) => ({ ...p, clie_memo: e.target.value }))}
          placeholder="메모"
          className="focuswin-textarea sm:col-span-2"
          rows={4}
        />
      </section>
      {/* 담당자 */}
      <ContactEditor
        contacts={vm.contactsDraft}
        onAdd={vm.addContact}
        onChange={vm.updateContact}
        onRemove={vm.removeContact}
        disabled={vm.isSaving}
      />
    </div>
  );
}
