import { Brain } from "lucide-react";
import { Card } from "../../common/ui/card";

type Props = {
  aiSummary: string;
  aiExtracted?: any;
  onKeywordClick: (kw: string) => void;
};

export default function SalesLogAISummaryCard({ aiSummary, aiExtracted, onKeywordClick }: Props) {
  const extracted = (aiExtracted ?? {}) as any;

  return (
    <Card className="border-violet-100 bg-gradient-to-b from-violet-50/60 to-white">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center">
            <Brain size={16} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">AI 요약</p>
            <p className="text-xs text-slate-500">핵심 내용과 다음 액션을 정리했어요</p>
          </div>
        </div>

        {extracted?.amount ? (
          <span className="text-sm font-black text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-2xl">
            {Number(extracted.amount).toLocaleString()}원
          </span>
        ) : null}
      </div>

      <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
        {aiSummary}
      </p>

      {Array.isArray(extracted?.nextActions) && extracted.nextActions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-violet-100">
          <p className="text-xs font-extrabold tracking-[0.16em] text-violet-700 uppercase mb-2">
            NEXT ACTIONS
          </p>
          <ul className="space-y-2">
            {extracted.nextActions.map((action: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="w-6 text-right text-xs font-black text-violet-700 pt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(extracted?.keywords) && extracted.keywords.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {extracted.keywords.map((kw: string) => (
            <button
              key={kw}
              type="button"
              onClick={() => onKeywordClick(kw)}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-violet-100 text-violet-700 hover:bg-violet-50 transition"
              title={`"${kw}"로 영업일지 검색`}
            >
              #{kw}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}