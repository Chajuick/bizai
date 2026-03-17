// client/src/pages/expense/ExpenseCreatePage.tsx

import { Check, Loader2, Sparkles, Upload, X } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import { useExpenseCreateVM } from "@/hooks/focuswin/expense/useExpenseCreateVM";
import PageScaffold from "@/components/focuswin/common/page/scaffold/page-scaffold";
import ExpenseEditFormCard from "@/components/focuswin/page/expense/detail/EditFormCard";
import ConfirmActionDialog from "@/components/focuswin/common/overlays/confirm-action-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/focuswin/common/ui/button";

export default function ExpenseCreatePage() {
  const vm = useExpenseCreateVM();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("파일 크기가 4MB를 초과합니다.");
      return;
    }
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!validTypes.includes(file.type)) {
      toast.error("JPG, PNG, WebP, HEIC 이미지만 지원됩니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      if (base64) await vm.handleAnalyzeReceipt(base64, file.type);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <>
      {/* AI 분석 결과 모달 */}
      {vm.receiptAnalysis && (
        <Dialog open={vm.showReceiptAnalysis} onOpenChange={vm.setShowReceiptAnalysis}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles size={18} className="text-orange-500" />
                AI 분석 결과
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              {vm.receiptAnalysis.summary && (
                <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 leading-relaxed">
                  {vm.receiptAnalysis.summary}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {vm.receiptAnalysis.expe_name && <AnalysisRow label="항목" value={vm.receiptAnalysis.expe_name} />}
                {vm.receiptAnalysis.expe_amnt != null && (
                  <AnalysisRow label="금액" value={`${vm.receiptAnalysis.expe_amnt.toLocaleString()}원`} />
                )}
                {vm.receiptAnalysis.expe_date && <AnalysisRow label="날짜" value={vm.receiptAnalysis.expe_date} />}
                {vm.receiptAnalysis.ai_categ && <AnalysisRow label="카테고리" value={vm.receiptAnalysis.ai_categ} />}
                {vm.receiptAnalysis.ai_vendor && <AnalysisRow label="판매처" value={vm.receiptAnalysis.ai_vendor} />}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => vm.setShowReceiptAnalysis(false)}>닫기</Button>
              <Button onClick={vm.applyReceiptAnalysis}>
                <Sparkles size={13} className="mr-1.5" />폼에 적용
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <PageScaffold
        kicker="NEW EXPENSE"
        title="지출 등록"
        description="지출 내역을 입력하세요."
        status="ready"
        onBack={vm.goList}
        primaryAction={{
          label: "등록",
          icon: vm.isSubmitting
            ? <Loader2 size={16} className="animate-spin" />
            : <Check size={16} />,
          onClick: () => vm.submit(),
          disabled: vm.isSubmitting,
          variant: "primary",
        }}
        actions={[
          {
            label: "취소",
            icon: <X size={16} />,
            onClick: vm.goList,
            variant: "outline",
          },
        ]}
      >
        <div className="space-y-4">
          {/* AI 영수증 분석 배너 */}
          <div className="flex items-center gap-2 p-3 rounded-2xl border border-dashed border-orange-200 bg-orange-50/50">
            <Sparkles size={14} className="text-orange-500 shrink-0" />
            <p className="text-xs text-slate-600 flex-1">영수증 이미지로 자동 입력</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={vm.isAnalyzing}
              className="text-xs"
            >
              {vm.isAnalyzing
                ? <Loader2 size={12} className="animate-spin mr-1" />
                : <Upload size={12} className="mr-1" />
              }
              {vm.isAnalyzing ? "분석 중…" : "이미지 업로드"}
            </Button>
          </div>

          <form onSubmit={(e) => vm.submit(e)}>
            <ExpenseEditFormCard form={vm.form} setForm={vm.setForm} />
          </form>
        </div>
      </PageScaffold>
    </>
  );
}

function AnalysisRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold text-slate-400 uppercase">{label}</p>
      <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
    </div>
  );
}
