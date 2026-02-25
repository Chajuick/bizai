import { Building2 } from "lucide-react";
import UiCard from "./ui-card";
import UiField from "./ui-field";
import { Input } from "@/components/ui/input";
import ClientNameInput from "@/components/ClientNameInput";

type FormState = {
  clientName: string;
  clientId?: number;
  contactPerson: string;
  location: string;
  visitedAt: string;
  audioUrl: string;
};

export default function SalesLogNewBasicCard({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<any>>;
}) {
  return (
    <UiCard title="기본 정보" desc="필수는 아니지만, 입력하면 검색/정리가 훨씬 쉬워져요." icon={Building2}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UiField label="고객사">
          <ClientNameInput
            value={form.clientName}
            clientId={form.clientId}
            onChange={(name, id) => setForm((f: any) => ({ ...f, clientName: name, clientId: id }))}
            placeholder="(주)삼성전자"
          />
        </UiField>

        <UiField label="담당자">
          <Input
            value={form.contactPerson}
            onChange={(e) => setForm((f: any) => ({ ...f, contactPerson: e.target.value }))}
            placeholder="홍길동 부장"
            className="rounded-2xl bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-200"
          />
        </UiField>

        <UiField label="방문 일시">
          <Input
            type="datetime-local"
            value={form.visitedAt}
            onChange={(e) => setForm((f: any) => ({ ...f, visitedAt: e.target.value }))}
            className="rounded-2xl bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-200"
          />
        </UiField>

        <UiField label="장소 (선택)">
          <Input
            value={form.location}
            onChange={(e) => setForm((f: any) => ({ ...f, location: e.target.value }))}
            placeholder="서울 강남구"
            className="rounded-2xl bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-200"
          />
        </UiField>
      </div>

      {form.audioUrl ? (
        <div className="mt-4 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">첨부됨:</span> 음성 파일 URL 저장됨
        </div>
      ) : null}
    </UiCard>
  );
}