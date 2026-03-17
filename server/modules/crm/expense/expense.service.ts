// server/modules/crm/expense/expense.service.ts

import type { ServiceCtx } from "../../../core/serviceCtx";
import { getDb } from "../../../core/db";
import { withCreateAudit, withUpdateAudit } from "../shared/audit";
import { normalizePage } from "../shared/pagination";
import { throwAppError } from "../../../core/trpc/appError";

import type { ExpenseCreatePayload, ExpenseListInputType, ExpenseUpdatePayload } from "./expense.dto";
import { expenseRepo } from "./expense.repo";
import { analyzeReceiptImage } from "../../../core/vision";

export const expenseService = {
  // #region listExpenses
  async listExpenses(ctx: ServiceCtx, input?: ExpenseListInputType) {
    const db = getDb();
    const page = normalizePage(input?.page ?? { limit: 20, offset: 0 });

    const rows = await expenseRepo.list(
      { db },
      {
        comp_idno: ctx.comp_idno,
        clie_idno: input?.clie_idno,
        expe_type: input?.expe_type,
        recr_type: input?.recr_type,
        search: input?.search,
        limit: page.limit,
        offset: page.offset,
      }
    );

    const hasMore = rows.length > page.limit;

    return {
      items: hasMore ? rows.slice(0, page.limit) : rows,
      page: { ...page, hasMore },
    };
  },
  // #endregion

  // #region getExpense
  async getExpense(ctx: ServiceCtx, expe_idno: number) {
    const db = getDb();
    const row = await expenseRepo.getById({ db }, { comp_idno: ctx.comp_idno, expe_idno });
    if (!row) throwAppError({ tRPCCode: "NOT_FOUND", appCode: "EXPENSE_NOT_FOUND", message: "지출 내역을 찾을 수 없습니다.", displayType: "toast" });
    return row;
  },
  // #endregion

  // #region createExpense
  async createExpense(ctx: ServiceCtx, input: ExpenseCreatePayload) {
    const db = getDb();

    const data = withCreateAudit(ctx, {
      comp_idno: ctx.comp_idno,
      enab_yesn: true,
      clie_idno: input.clie_idno ?? null,
      clie_name: input.clie_name ?? null,
      expe_name: input.expe_name,
      expe_date: new Date(input.expe_date),
      expe_amnt: String(input.expe_amnt),
      expe_type: input.expe_type ?? "receipt",
      paym_meth: input.paym_meth ?? "card",
      recr_type: input.recr_type ?? "none",
      recr_ends: input.recr_ends ? new Date(input.recr_ends) : null,
      expe_memo: input.expe_memo ?? null,
      file_url: input.file_url ?? null,
      file_key: input.file_key ?? null,
    });

    return expenseRepo.create({ db }, data);
  },
  // #endregion

  // #region updateExpense
  async updateExpense(ctx: ServiceCtx, expe_idno: number, patch: ExpenseUpdatePayload) {
    const db = getDb();

    const existing = await expenseRepo.getById({ db }, { comp_idno: ctx.comp_idno, expe_idno });
    if (!existing) throwAppError({ tRPCCode: "NOT_FOUND", appCode: "EXPENSE_NOT_FOUND", message: "지출 내역을 찾을 수 없습니다.", displayType: "toast" });

    const data = withUpdateAudit(ctx, {
      ...(patch.clie_idno !== undefined && { clie_idno: patch.clie_idno }),
      ...(patch.clie_name !== undefined && { clie_name: patch.clie_name }),
      ...(patch.expe_name !== undefined && { expe_name: patch.expe_name }),
      ...(patch.expe_date !== undefined && { expe_date: new Date(patch.expe_date) }),
      ...(patch.expe_amnt !== undefined && { expe_amnt: String(patch.expe_amnt) }),
      ...(patch.expe_type !== undefined && { expe_type: patch.expe_type }),
      ...(patch.paym_meth !== undefined && { paym_meth: patch.paym_meth }),
      ...(patch.recr_type !== undefined && { recr_type: patch.recr_type }),
      ...(patch.recr_ends !== undefined && { recr_ends: patch.recr_ends ? new Date(patch.recr_ends) : null }),
      ...(patch.expe_memo !== undefined && { expe_memo: patch.expe_memo }),
      ...(patch.file_url !== undefined && { file_url: patch.file_url }),
      ...(patch.file_key !== undefined && { file_key: patch.file_key }),
    });

    await expenseRepo.update({ db }, { comp_idno: ctx.comp_idno, expe_idno, data });
    return { success: true as const };
  },
  // #endregion

  // #region deleteExpense (soft)
  async deleteExpense(ctx: ServiceCtx, expe_idno: number) {
    const db = getDb();
    await expenseRepo.disable({ db }, { comp_idno: ctx.comp_idno, expe_idno, modi_idno: ctx.user_idno });
    return { success: true as const };
  },
  // #endregion

  // #region analyzeReceipt (Gemini AI)
  async analyzeReceipt(_ctx: ServiceCtx, input: { imageBase64: string; mimeType: string }) {
    return analyzeReceiptImage({
      imageBase64: input.imageBase64,
      mimeType: input.mimeType,
    });
  },
  // #endregion
} as const;
