import { Card } from "../../common/ui/card";

type EditForm = {
  clie_name: string;
  cont_name: string;
  sale_loca: string;
  vist_date: string;
  orig_memo: string;
};

type Props = {
  form: EditForm;
  setForm: React.Dispatch<React.SetStateAction<EditForm>>;
};

export default function SalesLogEditFormCard({ form, setForm }: Props) {
  return (
    <Card>
      <p className="text-xs font-extrabold tracking-[0.14em] text-slate-400 uppercase mb-4">
        편집 모드
      </p>

      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-slate-500 mb-1 block">방문일시</span>
          <input
            type="datetime-local"
            value={form.vist_date}
            onChange={e => setForm(f => ({ ...f, vist_date: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500 mb-1 block">고객사</span>
          <input
            type="text"
            value={form.clie_name}
            onChange={e => setForm(f => ({ ...f, clie_name: e.target.value }))}
            placeholder="고객사명"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500 mb-1 block">담당자</span>
          <input
            type="text"
            value={form.cont_name}
            onChange={e => setForm(f => ({ ...f, cont_name: e.target.value }))}
            placeholder="담당자명"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500 mb-1 block">장소</span>
          <input
            type="text"
            value={form.sale_loca}
            onChange={e => setForm(f => ({ ...f, sale_loca: e.target.value }))}
            placeholder="방문 장소"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500 mb-1 block">내용</span>
          <textarea
            value={form.orig_memo}
            onChange={e => setForm(f => ({ ...f, orig_memo: e.target.value }))}
            rows={8}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
          />
        </label>
      </div>
    </Card>
  );
}