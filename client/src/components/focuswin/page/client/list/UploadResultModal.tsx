import { CheckCircle2, XCircle } from "lucide-react";
import Modal from "@/components/focuswin/common/ui/modal";
import { Button } from "@/components/focuswin/common/ui/button";
import type { RouterOutputs } from "@/types/router";

type UploadResult = RouterOutputs["crm"]["client"]["upload"];

export default function ClientUploadResultModal({
  result,
  onClose,
}: {
  result: UploadResult | null;
  onClose: () => void;
}) {
  const hasErrors = (result?.errors.length ?? 0) > 0;

  return (
    <Modal
      open={!!result}
      onOpenChange={(open) => { if (!open) onClose(); }}
      maxWidthClassName="max-w-lg"
    >
      {result && (
        <>
          <p className="text-base font-black text-slate-900 mb-4">엑셀 업로드 결과</p>

          {/* 요약 */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <SummaryTile label="신규 등록" value={result.inserted} tone="emerald" />
            <SummaryTile label="업데이트" value={result.updated} tone="blue" />
            <SummaryTile label="실패" value={result.failed} tone={result.failed > 0 ? "red" : "slate"} />
          </div>

          {/* 실패 목록 */}
          {hasErrors && (
            <div className="rounded-2xl border border-red-100 bg-red-50 overflow-hidden mb-4">
              <div className="px-4 py-2.5 border-b border-red-100 flex items-center gap-2">
                <XCircle size={14} className="text-red-500" />
                <span className="text-xs font-black text-red-700">실패 목록</span>
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-red-100">
                {result.errors.map((err) => (
                  <div key={err.row} className="px-4 py-2 flex items-start gap-3 text-xs">
                    <span className="shrink-0 font-black text-red-500 w-12">{err.row}행</span>
                    <span className="text-slate-600">{err.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasErrors && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold mb-4">
              <CheckCircle2 size={16} />
              모든 행이 성공적으로 처리되었습니다.
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-2xl">
              닫기
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone: "emerald" | "blue" | "red" | "slate" }) {
  const colors = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    blue:    "bg-blue-50 border-blue-100 text-blue-700",
    red:     "bg-red-50 border-red-100 text-red-700",
    slate:   "bg-slate-50 border-slate-100 text-slate-500",
  };

  return (
    <div className={`rounded-2xl border px-3 py-3 flex flex-col items-center gap-1 ${colors[tone]}`}>
      <span className="text-xl font-black">{value}</span>
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}
