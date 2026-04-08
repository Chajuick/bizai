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
        <ReceiptAnalysisModal
          open={vm.showReceiptAnalysis}
          onOpenChange={vm.setShowReceiptAnalysis}
          data={vm.receiptAnalysis}
          onApply={vm.applyReceiptAnalysis}
        />
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
          <div className="flex items-center gap-2 p-3 rounded-2xl border border-dashed border-purple-200 bg-purple-50/50">
            <Sparkles size={14} className="text-purple-500 shrink-0" />
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

// #region ReceiptAnalysisModal

const EXPENSE_TYPE_LABEL: Record<string, string> = {
  receipt: "영수증", invoice: "명세서", contract: "계약서", other: "기타",
};
const PAYM_METH_LABEL: Record<string, string> = {
  card: "카드", cash: "현금", transfer: "계좌이체", other: "기타",
};
const RECUR_LABEL: Record<string, string> = {
  daily: "매일", weekly: "매주", monthly: "매월", yearly: "매년",
};

function fmtKRW(n: number): string {
  return `${n.toLocaleString()}원`;
}

type ReceiptAnalysisData = NonNullable<ReturnType<typeof useExpenseCreateVM>["receiptAnalysis"]>;

function ReceiptAnalysisModal({
  open, onOpenChange, data, onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: ReceiptAnalysisData;
  onApply: () => void;
}) {
  const rows: { label: string; value: string; wide?: boolean }[] = [
    data.expe_name ? { label: "항목",     value: data.expe_name, wide: true } : null,
    data.ai_vendor ? { label: "판매처",   value: data.ai_vendor } : null,
    data.clie_name ? { label: "거래처",   value: data.clie_name } : null,
    data.ai_categ  ? { label: "카테고리", value: data.ai_categ } : null,
    data.expe_date ? { label: "날짜",     value: data.expe_date } : null,
    data.expe_type ? { label: "유형",     value: EXPENSE_TYPE_LABEL[data.expe_type] ?? data.expe_type } : null,
    data.paym_meth ? { label: "결제",     value: PAYM_METH_LABEL[data.paym_meth]   ?? data.paym_meth } : null,
    data.recr_type && data.recr_type !== "none"
      ? { label: "반복", value: RECUR_LABEL[data.recr_type] ?? data.recr_type }
      : null,
  ].filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm overflow-hidden rounded-3xl border border-slate-100 bg-white p-0 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">

        {/* 상단 하이라이트 라인 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/70 to-transparent" />
        {/* 상단 바이올렛 워시 */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-50/40 via-white to-white" />

        <div className="relative px-6 pt-5 pb-6">
          {/* 헤더 */}
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 ring-1 ring-violet-100">
                <Sparkles size={16} className="text-violet-600" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-slate-900">AI 영수증 분석</p>
                <p className="mt-0.5 text-[12px] text-slate-400">이미지에서 인식한 정보입니다</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* 금액 강조 */}
          {data.expe_amnt != null && (
            <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3.5 ring-1 ring-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">인식 금액</p>
              <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                {fmtKRW(data.expe_amnt)}
              </p>
            </div>
          )}

          {/* AI 요약 */}
          {data.summary && (
            <p className="mb-4 rounded-2xl bg-violet-50/60 px-4 py-3 text-[13px] leading-relaxed text-slate-600 ring-1 ring-violet-100/80">
              {data.summary}
            </p>
          )}

          {/* 정보 그리드 */}
          {rows.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-5">
              {rows.map(row => (
                <div
                  key={row.label}
                  className={`rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100 ${row.wide ? "col-span-2" : ""}`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{row.label}</p>
                  <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-800">{row.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-2xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={onApply}
              className="flex flex-[2] items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm font-bold text-white transition"
              style={{ background: "rgb(37,99,235)", boxShadow: "0 10px 26px rgba(37,99,235,0.20)" }}
            >
              <Sparkles size={13} />
              폼에 적용
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
// #endregion
