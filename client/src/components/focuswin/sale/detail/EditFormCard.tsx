// src/components/.../SaleDetailEditFormCard.tsx

// #region Imports
import { Card } from "../../common/ui/card";
import ClientNameInput from "@/components/ClientNameInput";
import { Input } from "@/components/focuswin/common/ui/input";
import type { SaleEditForm } from "@/types/sale";
// #endregion

type Props = {
  form: SaleEditForm;
  setForm: React.Dispatch<React.SetStateAction<SaleEditForm>>;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs font-semibold text-slate-500 mb-1.5 block">
        {label}
      </span>
      {children}
    </div>
  );
}

export default function SaleDetailEditFormCard({ form, setForm }: Props) {
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
            onChange={(name, id) =>
              setForm((f) => ({ ...f, clie_name: name, clie_idno: id }))
            }
            placeholder="(주)삼성전자"
          />
        </Field>

        <Field label="담당자">
          <Input
            value={form.cont_name ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, cont_name: e.target.value }))
            }
            placeholder="홍길동 부장"
          />
        </Field>

        <Field label="업무">
          <Input
            value={form.cont_role ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, cont_role: e.target.value }))
            }
            placeholder="영업팀장"
          />
        </Field>

        <Field label="연락처">
          <Input
            value={form.cont_tele ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, cont_tele: e.target.value }))
            }
            placeholder="010-0000-0000"
          />
        </Field>

        <Field label="이메일">
          <Input
            value={form.cont_mail ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, cont_mail: e.target.value }))
            }
            placeholder="example@company.com"
          />
        </Field>

        <Field label="방문일시">
          <Input
            type="datetime-local"
            value={form.vist_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, vist_date: e.target.value }))
            }
          />
        </Field>

        <Field label="장소">
          <Input
            value={form.sale_loca}
            onChange={(e) =>
              setForm((f) => ({ ...f, sale_loca: e.target.value }))
            }
            placeholder="서울 강남구"
          />
        </Field>

        <Field label="금액 (원)">
          <Input
            value={form.sale_pric ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                sale_pric: e.target.value
                  ? Number(e.target.value.replace(/,/g, ""))
                  : undefined,
              }))
            }
            placeholder="1000000"
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="내용">
          <textarea
            value={form.orig_memo}
            onChange={(e) =>
              setForm((f) => ({ ...f, orig_memo: e.target.value }))
            }
            rows={8}
            className="w-full rounded-xl border border-border px-4 py-3 text-sm bg-background"
          />
        </Field>
      </div>
    </Card>
  );
}