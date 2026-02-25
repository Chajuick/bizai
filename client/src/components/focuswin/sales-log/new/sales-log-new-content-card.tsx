import { Brain } from "lucide-react";
import UiCard from "./ui-card";
import { Textarea } from "@/components/ui/textarea";

export default function SalesLogNewContentCard({
  rawContent,
  onChangeRaw,
}: {
  rawContent: string;
  onChangeRaw: (v: string) => void;
}) {
  return (
    <UiCard title="내용" desc="텍스트로 기록하면 AI가 고객/일정/금액/다음 액션을 자동 추출해요." icon={Brain}>
      <Textarea
        value={rawContent}
        onChange={(e) => onChangeRaw(e.target.value)}
        placeholder='예: "오늘 삼성전자 홍길동 부장님과 미팅. 다음 주 화요일 오전 10시에 제안서 발표. 예산 5천만원."'
        rows={9}
        className="rounded-2xl bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-200 resize-none"
      />
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-slate-500">
          팁: "언제/누구/무엇/다음 일정/금액"이 들어가면 분석 정확도가 좋아져요.
        </p>
        <p className="text-[11px] font-semibold text-slate-400">
          {rawContent.length.toLocaleString()} chars
        </p>
      </div>
    </UiCard>
  );
}