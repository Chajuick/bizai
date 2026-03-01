import { Card } from "../../common/ui/card";
import ClientNameInput from "@/components/ClientNameInput";
import type { SalesLogEditForm } from "@/types/salesLog";

type Props = {
  form: SalesLogEditForm;
  setForm: React.Dispatch<React.SetStateAction<SalesLogEditForm>>;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs font-semibold text-slate-500 mb-1.5 block">{label}</span>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white";

export default function SalesLogEditFormCard({ form, setForm }: Props) {
  return (
    <Card>
      <p className="text-xs font-extrabold tracking-[0.14em] text-slate-400 uppercase mb-4">
        편집 모드
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="고객사">
          <ClientNameInput
            value={form.clie_name}
            clientId={form.clie_idno}
            onChange={(name, id) => setForm(f => ({ ...f, clie_name: name, clie_idno: id }))}
            placeholder="(주)삼성전자"
          />
        </Field>

        <Field label="담당자">
          <input
            type="text"
            value={form.cont_name}
            onChange={e => setForm(f => ({ ...f, cont_name: e.target.value }))}
            placeholder="홍길동 부장"
            className={inputCls}
          />
        </Field>

        <Field label="방문일시">
          <input
            type="datetime-local"
            value={form.vist_date}
            onChange={e => setForm(f => ({ ...f, vist_date: e.target.value }))}
            className={inputCls}
          />
        </Field>

        <Field label="장소">
          <input
            type="text"
            value={form.sale_loca}
            onChange={e => setForm(f => ({ ...f, sale_loca: e.target.value }))}
            placeholder="서울 강남구"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="내용">
          <textarea
            value={form.orig_memo}
            onChange={e => setForm(f => ({ ...f, orig_memo: e.target.value }))}
            rows={8}
            className={`${inputCls} resize-none`}
          />
        </Field>
      </div>
    </Card>
  );
}
