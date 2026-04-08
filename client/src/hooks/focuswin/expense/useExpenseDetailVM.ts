// client/src/hooks/focuswin/expense/useExpenseDetailVM.ts

import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { handleApiError } from "@/lib/handleApiError";
import { buildDeleteConfirm } from "@/lib/confirm";
import type { ConfirmState } from "@/types/";
import type { PageStatus } from "@/components/focuswin/common/page/scaffold/page-scaffold";
import type { ExpenseFormState } from "./useExpenseCreateVM";

export function useExpenseDetailVM() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const expenseId = Number(id);
  const isValidId = Number.isFinite(expenseId) && expenseId > 0;

  const goList = useCallback(() => window.history.back(), []);

  // #region Query
  const expenseGet = trpc.crm.expense.get.useQuery(
    { expe_idno: expenseId },
    { enabled: isValidId },
  );
  // #endregion

  // #region State
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ExpenseFormState>({
    clie_name: "", expe_name: "", expe_date: "", expe_amnt: "",
    expe_type: "receipt", paym_meth: "card", recr_type: "none",
    recr_ends: "", expe_memo: "", file_url: "", file_key: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  // #endregion

  // #region Mutations
  const updateMut = trpc.crm.expense.update.useMutation();
  const deleteMut = trpc.crm.expense.delete.useMutation();
  // #endregion

  // #region Derived
  const expense = expenseGet.data ?? null;
  const isLoading = expenseGet.isLoading;
  const status: PageStatus = isLoading ? "loading" : !expense ? "empty" : "ready";
  // #endregion

  // #region server → form sync
  useEffect(() => {
    if (!expense) return;
    setForm({
      clie_idno: expense.clie_idno ?? undefined,
      clie_name: expense.clie_name ?? "",
      expe_name: expense.expe_name,
      expe_date: expense.expe_date ? new Date(expense.expe_date).toISOString().slice(0, 16) : "",
      expe_amnt: String(Math.round(Number(expense.expe_amnt))),
      expe_type: expense.expe_type as ExpenseFormState["expe_type"],
      paym_meth: expense.paym_meth as ExpenseFormState["paym_meth"],
      recr_type: expense.recr_type as ExpenseFormState["recr_type"],
      recr_ends: expense.recr_ends ? new Date(expense.recr_ends).toISOString().slice(0, 10) : "",
      expe_memo: expense.expe_memo ?? "",
      file_url: expense.file_url ?? "",
      file_key: expense.file_key ?? "",
    });
  }, [expense]);
  // #endregion

  // #region Edit / Cancel
  const startEdit = () => setIsEditing(true);
  const cancelEdit = () => {
    if (expense) {
      setForm({
        clie_idno: expense.clie_idno ?? undefined,
        clie_name: expense.clie_name ?? "",
        expe_name: expense.expe_name,
        expe_date: expense.expe_date ? new Date(expense.expe_date).toISOString().slice(0, 16) : "",
        expe_amnt: String(Math.round(Number(expense.expe_amnt))),
        expe_type: expense.expe_type as ExpenseFormState["expe_type"],
        paym_meth: expense.paym_meth as ExpenseFormState["paym_meth"],
        recr_type: expense.recr_type as ExpenseFormState["recr_type"],
        recr_ends: expense.recr_ends ? new Date(expense.recr_ends).toISOString().slice(0, 10) : "",
        expe_memo: expense.expe_memo ?? "",
        file_url: expense.file_url ?? "",
        file_key: expense.file_key ?? "",
      });
    }
    setIsEditing(false);
  };
  // #endregion

  // #region Submit update
  const submit = useCallback(async () => {
    if (!form.expe_name || !form.expe_date || !form.expe_amnt) {
      toast.error("지출명, 날짜, 금액을 입력해주세요.");
      return;
    }
    try {
      setIsSaving(true);
      await updateMut.mutateAsync({
        expe_idno: expenseId,
        clie_idno: form.clie_idno ?? null,
        clie_name: form.clie_name || null,
        expe_name: form.expe_name,
        expe_date: form.expe_date,
        expe_amnt: Number(form.expe_amnt),
        expe_type: form.expe_type,
        paym_meth: form.paym_meth,
        recr_type: form.recr_type,
        recr_ends: form.recr_ends || null,
        expe_memo: form.expe_memo || null,
      });
      toast.success("저장했어요.");
      await expenseGet.refetch();
      setIsEditing(false);
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsSaving(false);
    }
  }, [form, expenseId, updateMut, expenseGet]);
  // #endregion

  // #region Delete
  const requestDelete = () => {
    if (!expense) return;
    setConfirm(buildDeleteConfirm({
      kind: "expense",
      id: expense.expe_idno,
      title: expense.expe_name,
      metas: [
        { label: "지출명", value: expense.expe_name },
        { label: "금액", value: `${Number(expense.expe_amnt).toLocaleString()}원` },
      ],
    }));
  };

  const handleConfirm = useCallback(async (c: NonNullable<ConfirmState>) => {
    if (c.intent !== "delete") return;
    try {
      await deleteMut.mutateAsync({ expe_idno: c.target.id });
      toast.success("삭제했어요.");
      setConfirm(null);
      await utils.crm.expense.list.invalidate();
      goList();
    } catch (e) {
      handleApiError(e);
    }
  }, [deleteMut, utils, goList]);
  // #endregion

  return {
    expenseId,
    expense,
    status,
    isLoading,
    isEditing,
    startEdit,
    cancelEdit,
    form,
    setForm,
    submit,
    isSaving,
    requestDelete,
    confirm,
    setConfirm,
    handleConfirm,
    goList,
  };
}
