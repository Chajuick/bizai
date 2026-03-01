import { Building2 } from "lucide-react";
import ChoiceDialog from "@/components/focuswin/common/choice-dialog";

/**
 * AI 분석 완료 후 고객사 연결 확인 다이얼로그
 *
 * 두 가지 모드:
 * A. 유사 고객사 있음 (matched_name 존재)
 *    "혹시 등록된 '○○'를 말씀하시는 건가요?"
 *    → 확인: 매칭 고객사에 연결  / 거부: AI 추출 이름으로 신규 등록 후 연결
 *
 * B. 유사 고객사 없음 (matched_name null)
 *    "AI가 '○○'를 고객사로 인식했습니다. 신규 등록하시겠습니까?"
 *    → 확인: 신규 등록 후 연결  / 거부: 건너뛰기
 */
type Props = {
  open: boolean;
  ai_client_name: string;
  matched_name?: string | null;
  onConfirm: () => Promise<void> | void;
  onDeny: () => Promise<void> | void;
};

export default function PostAnalyzeClientModal({
  open,
  ai_client_name,
  matched_name,
  onConfirm,
  onDeny,
}: Props) {
  if (!open) return null;

  const hasMatch = !!matched_name?.trim();
  const aiName = ai_client_name.trim() || "(미확인)";
  const matchName = matched_name?.trim() || "";

  if (hasMatch) {
    // A. 유사 고객사 있음
    return (
      <ChoiceDialog
        open
        onOpenChange={() => {}}
        requireChoice
        kicker="AI 고객사 인식"
        title={
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <Building2 size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-black text-slate-900 leading-snug">
                혹시 고객사에 등록된{" "}
                <span
                  className="text-blue-700 inline-block max-w-[18rem] align-bottom truncate"
                  title={matchName}
                >
                  '{matchName}'
                </span>
                을(를) 말씀하시는 건가요?
              </p>
            </div>
          </div>
        }
        body={
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-slate-400 w-24 shrink-0">AI가 인식한 이름</span>
              <span className="min-w-0 flex-1 font-semibold text-slate-700 truncate" title={aiName}>
                {aiName}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-400 w-24 shrink-0">등록된 고객사</span>
              <span className="min-w-0 flex-1 font-black text-blue-700 truncate" title={matchName}>
                {matchName}
              </span>
            </div>
          </div>
        }
        primary={{
          label: (
            <div className="flex flex-col items-center leading-tight gap-1">
              <span>맞아요, 연결할게요</span>
              <span className="text-[11px] opacity-90 truncate max-w-full px-2" title={matchName}>
                연결: {matchName}
              </span>
            </div>
          ),
          onClick: onConfirm,
        }}
        secondary={{
          label: (
            <div className="flex flex-col items-center leading-tight gap-1">
              <span>아니에요, 새로 등록할게요</span>
              <span className="text-[11px] text-slate-500 truncate max-w-full px-2" title={aiName}>
                신규: {aiName}
              </span>
            </div>
          ),
          onClick: onDeny,
        }}
      />
    );
  }

  // B. 유사 고객사 없음 → 신규 등록 제안
  return (
    <ChoiceDialog
      open
      onOpenChange={() => {}}
      requireChoice
      kicker="AI 고객사 인식"
      title={
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-700 shrink-0">
            <Building2 size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-base font-black text-slate-900 leading-snug">
              AI가{" "}
              <span
                className="text-violet-700 inline-block max-w-[18rem] align-bottom truncate"
                title={aiName}
              >
                '{aiName}'
              </span>
              을(를) 고객사로 인식했습니다.
              <br />
              <span className="font-medium text-slate-600 text-sm">신규 고객사로 등록하시겠습니까?</span>
            </p>
          </div>
        </div>
      }
      body={
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-slate-400 w-24 shrink-0">AI가 인식한 이름</span>
            <span className="min-w-0 flex-1 font-black text-violet-700 truncate" title={aiName}>
              {aiName}
            </span>
          </div>
          <p className="text-slate-400 pt-1">
            등록하면 고객사 목록에서 검색하고 관리할 수 있어요.
          </p>
        </div>
      }
      primary={{
        label: (
          <div className="flex flex-col items-center leading-tight gap-1">
            <span>등록할게요</span>
            <span className="text-[11px] opacity-90 truncate max-w-full px-2" title={aiName}>
              신규: {aiName}
            </span>
          </div>
        ),
        onClick: onConfirm,
      }}
      secondary={{
        label: "건너뛰기",
        onClick: onDeny,
      }}
    />
  );
}
