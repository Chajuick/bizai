// src/components/focuswin/client/detail/EditFormCard.tsx

// #region Imports
import { Card } from "../../common/ui/card";
import { Input } from "@/components/focuswin/common/ui/input";
import type { ClientDraft } from "@/types/client";
// #endregion

// #region Types
type Props = {
  form: ClientDraft;
  setForm: React.Dispatch<React.SetStateAction<ClientDraft>>;
};
// #endregion

// #region Field
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs font-semibold text-slate-500 mb-1.5 block">{label}</span>
      {children}
    </div>
  );
}
// #endregion

export default function ClientDetailEditFormCard({ form, setForm }: Props) {
  return (
    <Card>
      <p className="text-xs font-extrabold tracking-[0.14em] text-slate-400 uppercase mb-4">편집 모드</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="고객사">
          <Input value={form.clie_name} onChange={e => setForm(f => ({ ...f, clie_name: e.target.value }))} />
        </Field>

        <Field label="업종">
          <Input value={form.indu_type} onChange={e => setForm(f => ({ ...f, indu_type: e.target.value }))} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="주소">
            <Input value={form.clie_addr} onChange={e => setForm(f => ({ ...f, clie_addr: e.target.value }))} />
          </Field>
        </div>
      </div>

      <div className="mt-3">
        <Field label="메모">
          <textarea
            value={form.clie_memo}
            onChange={e => setForm(f => ({ ...f, clie_memo: e.target.value }))}
            rows={6}
            className="w-full rounded-xl border border-border px-4 py-3 text-sm bg-background"
          />
        </Field>
      </div>
    </Card>
  );
}
