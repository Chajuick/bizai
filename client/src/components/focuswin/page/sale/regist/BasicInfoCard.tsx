import { Building2 } from "lucide-react";
import InfoCard from "@/components/focuswin/common/cards/info-card";
import { ClientNameField, TextField, DateTimeField } from "@/components/focuswin/common/form";

import type { SaleFormState } from "@/types/sale";

export default function SaleRegistBasicInfoCard({ form, setForm }: { form: SaleFormState; setForm: React.Dispatch<React.SetStateAction<SaleFormState>> }) {
  return (
    <InfoCard title="기본 정보" desc="필수는 아니지만, 입력하면 검색/정리가 훨씬 쉬워져요." icon={Building2}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ClientNameField className="sm:col-span-2" label="거래처" value={form.clie_name} clientId={form.clie_idno} onChange={(name, id) => setForm(f => ({ ...f, clie_name: name, clie_idno: id }))} placeholder="(주)삼성전자" />

        <TextField label="담당자" value={form.cont_name ?? ""} onChange={v => setForm(f => ({ ...f, cont_name: v }))} inputProps={{ placeholder: "홍길동 부장" }} />

        <DateTimeField label="방문 일시" value={form.vist_date ?? ""} onChange={v => setForm(f => ({ ...f, vist_date: v }))} />

        <TextField label="장소" className="sm:col-span-2" value={form.sale_loca ?? ""} onChange={v => setForm(f => ({ ...f, sale_loca: v }))} inputProps={{ placeholder: "서울 강남구" }} />
      </div>

      {form.audi_addr ? (
        <div className="mt-4 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">첨부됨:</span> 음성 파일 URL 저장됨
        </div>
      ) : null}
    </InfoCard>
  );
}
