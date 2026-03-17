// client/src/hooks/focuswin/expense/useExpenseCreateVM.ts

import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { handleApiError } from "@/lib/handleApiError";

// #region Types
export type ExpenseType = "receipt" | "invoice" | "contract" | "other";
export type PaymentMethod = "card" | "cash" | "transfer" | "other";
export type RecurType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export type ExpenseFormState = {
  clie_idno?: number;
  clie_name: string;
  expe_name: string;
  expe_date: string;   // datetime-local
  expe_amnt: string;   // string for controlled input
  expe_type: ExpenseType;
  paym_meth: PaymentMethod;
  recr_type: RecurType;
  recr_ends: string;
  expe_memo: string;
  file_url: string;
  file_key: string;
};

type ReceiptAnalysis = {
  expe_name: string | null;
  expe_amnt: number | null;
  expe_date: string | null;
  expe_type: ExpenseType | null;
  paym_meth: PaymentMethod | null;
  ai_categ: string | null;
  ai_vendor: string | null;
  clie_name: string | null;
  recr_type: RecurType | null;
  summary: string | null;
};
// #endregion

const EMPTY_FORM: ExpenseFormState = {
  clie_name: "",
  expe_name: "",
  expe_date: "",
  expe_amnt: "",
  expe_type: "receipt",
  paym_meth: "card",
  recr_type: "none",
  recr_ends: "",
  expe_memo: "",
  file_url: "",
  file_key: "",
};

export function useExpenseCreateVM() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // #region State
  const [form, setForm] = useState<ExpenseFormState>(EMPTY_FORM);
  const [showReceiptAnalysis, setShowReceiptAnalysis] = useState(false);
  const [receiptAnalysis, setReceiptAnalysis] = useState<ReceiptAnalysis | null>(null);
  // #endregion

  // #region Mutations
  const createMut = trpc.crm.expense.create.useMutation();
  const analyzeReceiptMut = trpc.crm.expense.analyzeReceipt.useMutation();
  // #endregion

  // #region Submit
  const submit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.expe_name || !form.expe_date || !form.expe_amnt) {
      return toast.error("지출명, 날짜, 금액을 입력해주세요.");
    }
    try {
      const res = await createMut.mutateAsync({
        clie_idno: form.clie_idno,
        clie_name: form.clie_name || undefined,
        expe_name: form.expe_name,
        expe_date: form.expe_date,
        expe_amnt: Number(form.expe_amnt),
        expe_type: form.expe_type,
        paym_meth: form.paym_meth,
        recr_type: form.recr_type,
        recr_ends: form.recr_ends || undefined,
        expe_memo: form.expe_memo || undefined,
        file_url: form.file_url || undefined,
        file_key: form.file_key || undefined,
      });
      toast.success("지출이 등록되었습니다.");
      await utils.crm.expense.list.invalidate();
      navigate(`/expe-list/${res.expe_idno}`);
    } catch (e) {
      handleApiError(e);
    }
  }, [form, createMut, utils, navigate]);
  // #endregion

  // #region AI Receipt Analysis
  const handleAnalyzeReceipt = useCallback(async (imageBase64: string, mimeType: string) => {
    try {
      const result = await analyzeReceiptMut.mutateAsync({ imageBase64, mimeType });
      setReceiptAnalysis(result as ReceiptAnalysis);
      setShowReceiptAnalysis(true);
    } catch (e) {
      handleApiError(e);
    }
  }, [analyzeReceiptMut]);

  const applyReceiptAnalysis = useCallback(() => {
    if (!receiptAnalysis) return;
    setForm(prev => ({
      ...prev,
      expe_name: receiptAnalysis.expe_name ?? prev.expe_name,
      expe_amnt: receiptAnalysis.expe_amnt ? String(receiptAnalysis.expe_amnt) : prev.expe_amnt,
      expe_date: receiptAnalysis.expe_date ? `${receiptAnalysis.expe_date}T09:00` : prev.expe_date,
      expe_type: receiptAnalysis.expe_type ?? prev.expe_type,
      paym_meth: receiptAnalysis.paym_meth ?? prev.paym_meth,
      recr_type: receiptAnalysis.recr_type ?? prev.recr_type,
      clie_name: receiptAnalysis.clie_name ?? prev.clie_name,
    }));
    setShowReceiptAnalysis(false);
  }, [receiptAnalysis]);
  // #endregion

  const goList = () => navigate("/expe-list");

  return {
    form,
    setForm,
    submit,
    isSubmitting: createMut.isPending,

    showReceiptAnalysis,
    setShowReceiptAnalysis,
    receiptAnalysis,
    handleAnalyzeReceipt,
    applyReceiptAnalysis,
    isAnalyzing: analyzeReceiptMut.isPending,

    goList,
  };
}
