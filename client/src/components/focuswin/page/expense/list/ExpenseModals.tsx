// src/components/focuswin/page/expense/list/ExpenseModals.tsx

// #region Imports
import * as React from "react";
import { useRef } from "react";
import { Loader2, Receipt, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

import FormDialog from "@/components/focuswin/common/overlays/form-dialog";
import ConfirmActionDialog from "@/components/focuswin/common/overlays/confirm-action-dialog";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Button } from "@/components/focuswin/common/ui/button";
import { ClientNameField, DateField, DateTimeField, MoneyField, SelectField, TextAreaField, TextField } from "@/components/focuswin/common/form";

import type { ConfirmState } from "@/types/";
import type { ExpenseFormState } from "@/hooks/focuswin/expense/useExpenseCreateVM";
// #endregion

// #region Types
type ReceiptAnalysis = {
  expe_name: string | null;
  expe_amnt: number | null;
  expe_date: string | null;
  expe_type: string | null;
  paym_meth: string | null;
  ai_categ: string | null;
  ai_vendor: string | null;
  clie_name: string | null;
  recr_type: string | null;
  summary: string | null;
};

export type ExpenseModalsProps = {
  showForm: boolean;
  onFormOpenChange: (open: boolean) => void;
  editingId: number | null;

  form: ExpenseFormState;
  setForm: React.Dispatch<React.SetStateAction<ExpenseFormState>>;
  onFormSubmit: (e: React.FormEvent) => void;
  isFormSubmitting: boolean;

  confirm: ConfirmState;
  setConfirm: React.Dispatch<React.SetStateAction<ConfirmState>>;
  onConfirm: (c: NonNullable<ConfirmState>) => Promise<void>;

  showReceiptAnalysis: boolean;
  onReceiptAnalysisOpenChange: (open: boolean) => void;
  receiptAnalysis: ReceiptAnalysis | null;
  onApplyAnalysis: () => void;

  onAnalyzeReceipt: (imageBase64: string, mimeType: string) => Promise<void>;
  isAnalyzing: boolean;
};

type ExpenseListFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;

  form: ExpenseFormState;
  setForm: React.Dispatch<React.SetStateAction<ExpenseFormState>>;

  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;

  onAnalyzeReceipt: (imageBase64: string, mimeType: string) => Promise<void>;
  isAnalyzing: boolean;
};

type ReceiptAnalysisModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptAnalysis: ReceiptAnalysis | null;
  onApplyAnalysis: () => void;
};
// #endregion

// #region Constants
const EXPENSE_TYPE_OPTIONS = [
  { value: "receipt", label: "영수증" },
  { value: "invoice", label: "명세서" },
  { value: "contract", label: "계약서" },
  { value: "other", label: "기타" },
];

const PAYM_METH_OPTIONS = [
  { value: "card", label: "카드" },
  { value: "cash", label: "현금" },
  { value: "transfer", label: "계좌이체" },
  { value: "other", label: "기타" },
];

const RECUR_TYPE_OPTIONS = [
  { value: "none", label: "일회성" },
  { value: "monthly", label: "매월" },
  { value: "yearly", label: "매년" },
  { value: "weekly", label: "매주" },
  { value: "daily", label: "매일" },
];
// #endregion

// #region Main Component
export function ExpenseModals(props: ExpenseModalsProps) {
  return (
    <>
      <ExpenseListFormModal
        open={props.showForm}
        onOpenChange={props.onFormOpenChange}
        editing={!!props.editingId}
        form={props.form}
        setForm={props.setForm}
        onSubmit={props.onFormSubmit}
        isSubmitting={props.isFormSubmitting}
        onAnalyzeReceipt={props.onAnalyzeReceipt}
        isAnalyzing={props.isAnalyzing}
      />

      <ExpenseReceiptAnalysisModal open={props.showReceiptAnalysis} onOpenChange={props.onReceiptAnalysisOpenChange} receiptAnalysis={props.receiptAnalysis} onApplyAnalysis={props.onApplyAnalysis} />

      <ConfirmActionDialog confirm={props.confirm} setConfirm={props.setConfirm} onConfirm={props.onConfirm} />
    </>
  );
}
// #endregion

// #region ExpenseListFormModal
function ExpenseListFormModal({ open, onOpenChange, editing, form, setForm, onSubmit, isSubmitting, onAnalyzeReceipt, isAnalyzing }: ExpenseListFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      toast.error("파일 크기가 4MB를 초과합니다.");
      e.target.value = "";
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!validTypes.includes(file.type)) {
      toast.error("JPG, PNG, WebP, HEIC 이미지만 지원됩니다.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (!base64) return;
      await onAnalyzeReceipt(base64, file.type);
    };
    reader.readAsDataURL(file);

    // 같은 파일 재선택 가능하게 초기화
    e.target.value = "";
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          <Receipt size={18} className="text-orange-500" />
          {editing ? "지출 수정" : "지출 등록"}
        </span>
      }
      actionLabel={editing ? "수정" : "등록"}
      actionTone="primary"
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
      contentClassName="max-w-md"
    >
      <div className="space-y-4">
        {/* AI 영수증 분석 */}
        {!editing ? (
          <div className="flex items-center gap-2 rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 p-3">
            <Sparkles size={14} className="shrink-0 text-orange-500" />
            <p className="flex-1 text-xs text-slate-600">영수증 이미지로 자동 입력</p>

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={handleFileSelect} />

            <Button size="sm" variant="outline" type="button" onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing} className="text-xs">
              {isAnalyzing ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Upload size={12} className="mr-1" />}
              {isAnalyzing ? "분석 중…" : "이미지 업로드"}
            </Button>
          </div>
        ) : null}

        {/* 지출명 */}
        <TextField
          label="지출명"
          required
          value={form.expe_name}
          onChange={v => setForm(f => ({ ...f, expe_name: v }))}
          inputProps={{
            required: true,
            placeholder: "점심 식대, 사무용품 등",
            maxLength: 200,
          }}
        />

        {/* 금액 */}
        <MoneyField
          label="금액(원)"
          required
          value={form.expe_amnt ?? ""}
          onChange={v =>
            setForm(f => ({
              ...f,
              expe_amnt: v ? v.replace(/,/g, "") : "",
            }))
          }
          inputProps={{
            required: true,
            placeholder: "50000",
            maxLength: 13,
          }}
        />

        {/* 지출 일시 */}
        <DateTimeField label="지출 일시" required value={form.expe_date} onChange={v => setForm(f => ({ ...f, expe_date: v }))} inputProps={{ required: true }} />

        {/* 거래처 */}
        <ClientNameField
          label="거래처"
          value={form.clie_name}
          clientId={form.clie_idno}
          onChange={(name, id) =>
            setForm(f => ({
              ...f,
              clie_name: name,
              clie_idno: id,
            }))
          }
          placeholder="거래처명 입력"
        />

        <div className="grid grid-cols-2 gap-3">
          {/* 증빙 유형 */}
          <SelectField
            label="증빙 유형"
            value={form.expe_type}
            onChange={v =>
              setForm(f => ({
                ...f,
                expe_type: v as ExpenseFormState["expe_type"],
              }))
            }
            options={EXPENSE_TYPE_OPTIONS}
            triggerClassName="w-full border-slate-200 px-3"
          />

          {/* 결제 방법 */}
          <SelectField
            label="결제 방법"
            value={form.paym_meth}
            onChange={v =>
              setForm(f => ({
                ...f,
                paym_meth: v as ExpenseFormState["paym_meth"],
              }))
            }
            options={PAYM_METH_OPTIONS}
            triggerClassName="w-full border-slate-200 px-3"
          />
        </div>

        {/* 반복 주기 */}
        <SelectField
          label="반복 주기"
          value={form.recr_type}
          onChange={v =>
            setForm(f => ({
              ...f,
              recr_type: v as ExpenseFormState["recr_type"],
            }))
          }
          options={RECUR_TYPE_OPTIONS}
          triggerClassName="w-full border-slate-200 px-3"
        />

        {/* 반복 종료일 */}
        {form.recr_type !== "none" ? <DateField label="반복 종료일" value={form.recr_ends ?? ""} onChange={v => setForm(f => ({ ...f, recr_ends: v }))} /> : null}

        {/* 메모 */}
        <TextAreaField
          label="메모"
          value={form.expe_memo ?? ""}
          onChange={v => setForm(f => ({ ...f, expe_memo: v }))}
          textareaProps={{
            rows: 3,
            placeholder: "추가 메모",
          }}
        />
      </div>
    </FormDialog>
  );
}
// #endregion

// #region ExpenseReceiptAnalysisModal
function ExpenseReceiptAnalysisModal({ open, onOpenChange, receiptAnalysis, onApplyAnalysis }: ReceiptAnalysisModalProps) {
  if (!receiptAnalysis) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-orange-500" />
            AI 분석 결과
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          {receiptAnalysis.summary ? <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">{receiptAnalysis.summary}</p> : null}

          <div className="grid grid-cols-2 gap-2">
            {receiptAnalysis.expe_name ? <AnalysisRow label="항목" value={receiptAnalysis.expe_name} /> : null}

            {receiptAnalysis.expe_amnt != null ? <AnalysisRow label="금액" value={`${receiptAnalysis.expe_amnt.toLocaleString()}원`} /> : null}

            {receiptAnalysis.expe_date ? <AnalysisRow label="날짜" value={receiptAnalysis.expe_date} /> : null}

            {receiptAnalysis.ai_categ ? <AnalysisRow label="카테고리" value={receiptAnalysis.ai_categ} /> : null}

            {receiptAnalysis.ai_vendor ? <AnalysisRow label="판매처" value={receiptAnalysis.ai_vendor} /> : null}

            {receiptAnalysis.clie_name ? <AnalysisRow label="거래처" value={receiptAnalysis.clie_name} /> : null}

            {receiptAnalysis.expe_type ? (
              <AnalysisRow
                label="유형"
                value={receiptAnalysis.expe_type === "receipt" ? "영수증" : receiptAnalysis.expe_type === "invoice" ? "명세서" : receiptAnalysis.expe_type === "contract" ? "계약서" : "기타"}
              />
            ) : null}

            {receiptAnalysis.recr_type && receiptAnalysis.recr_type !== "none" ? (
              <AnalysisRow
                label="반복"
                value={
                  receiptAnalysis.recr_type === "monthly"
                    ? "매월"
                    : receiptAnalysis.recr_type === "yearly"
                      ? "매년"
                      : receiptAnalysis.recr_type === "weekly"
                        ? "매주"
                        : receiptAnalysis.recr_type === "daily"
                          ? "매일"
                          : receiptAnalysis.recr_type
                }
              />
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
          <Button onClick={onApplyAnalysis}>
            <Sparkles size={13} className="mr-1.5" />
            폼에 적용
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
// #endregion

// #region Sub Components
function AnalysisRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase text-slate-400">{label}</p>
      <p className="truncate text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}
// #endregion
