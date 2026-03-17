// server/modules/crm/expense/expense.router.ts

import { protectedProcedure, router } from "../../../core/trpc";
import { svcCtxFromTrpc } from "../../../core/svcCtx";

import {
  ExpenseListInput,
  ExpenseIdInput,
  ExpenseCreateInput,
  ExpenseCreateOutput,
  ExpenseUpdateInput,
  ExpenseAnalyzeReceiptInput,
  ReceiptAnalysisOutput,
} from "./expense.dto";
import { z } from "zod";

import { expenseService } from "./expense.service";

export const expenseRouter = router({
  // #region list
  list: protectedProcedure
    .input(ExpenseListInput)
    .query(({ ctx, input }) => expenseService.listExpenses(svcCtxFromTrpc(ctx), input ?? undefined)),
  // #endregion

  // #region get
  get: protectedProcedure
    .input(ExpenseIdInput)
    .query(({ ctx, input }) => expenseService.getExpense(svcCtxFromTrpc(ctx), input.expe_idno)),
  // #endregion

  // #region create
  create: protectedProcedure
    .input(ExpenseCreateInput)
    .output(ExpenseCreateOutput)
    .mutation(({ ctx, input }) => expenseService.createExpense(svcCtxFromTrpc(ctx), input)),
  // #endregion

  // #region update
  update: protectedProcedure
    .input(ExpenseUpdateInput)
    .output(z.object({ success: z.literal(true) }))
    .mutation(({ ctx, input }) => {
      const { expe_idno, ...patch } = input;
      return expenseService.updateExpense(svcCtxFromTrpc(ctx), expe_idno, patch);
    }),
  // #endregion

  // #region delete
  delete: protectedProcedure
    .input(ExpenseIdInput)
    .output(z.object({ success: z.literal(true) }))
    .mutation(({ ctx, input }) => expenseService.deleteExpense(svcCtxFromTrpc(ctx), input.expe_idno)),
  // #endregion

  // #region analyzeReceipt (AI — Gemini 1.5 Flash)
  analyzeReceipt: protectedProcedure
    .input(ExpenseAnalyzeReceiptInput)
    .output(ReceiptAnalysisOutput)
    .mutation(({ ctx, input }) => expenseService.analyzeReceipt(svcCtxFromTrpc(ctx), input)),
  // #endregion
});
