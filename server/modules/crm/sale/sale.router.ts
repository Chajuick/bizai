// server/modules/crm/sale/sale.router.ts

// #region Imports

import { protectedProcedure, router } from "../../../core/trpc";
import { svcCtxFromTrpc } from "../../../core/svcCtx";

import {
  SaleAnalyzeInput,
  SaleAnalyzeOutput,
  SaleAnalyzeResultInput,
  SaleAnalyzeResultOutput,
  SaleApplyReviewInput,
  SaleApplyReviewOutput,
  SaleCreateInput,
  SaleDeleteInput,
  SaleGetOutput,
  SaleIdInput,
  SaleListInput,
  SaleListOutput,
  SalePatchScheduleClientInput,
  SaleTranscribeInput,
  SaleTranscribeOutput,
  SaleTranscribeResultInput,
  SaleTranscribeResultOutput,
  SaleUpdateInput,
} from "./sale.dto";

import { saleService } from "./sale.service";

// #endregion

// #region Router

export const saleRouter = router({
  list: protectedProcedure
    .input(SaleListInput)
    .output(SaleListOutput)
    .query(({ ctx, input }) => saleService.listSales(svcCtxFromTrpc(ctx), input)),

  get: protectedProcedure
    .input(SaleIdInput)
    .output(SaleGetOutput.nullable())
    .query(({ ctx, input }) => saleService.getSale(svcCtxFromTrpc(ctx), input.sale_idno)),

  create: protectedProcedure
    .input(SaleCreateInput)
    .mutation(({ ctx, input }) => saleService.createSale(svcCtxFromTrpc(ctx), input)),

  update: protectedProcedure
    .input(SaleUpdateInput)
    .mutation(({ ctx, input }) => {
      const { sale_idno, ...patch } = input;
      return saleService.updateSale(svcCtxFromTrpc(ctx), sale_idno, patch);
    }),

  delete: protectedProcedure
    .input(SaleDeleteInput)
    .mutation(({ ctx, input }) => saleService.deleteSale(svcCtxFromTrpc(ctx), input.sale_idno)),

  analyze: protectedProcedure
    .input(SaleAnalyzeInput)
    .output(SaleAnalyzeOutput)
    .mutation(({ ctx, input }) => saleService.queueAnalyze(svcCtxFromTrpc(ctx), input.sale_idno, input.file_idno)),

  analyzeResult: protectedProcedure
    .input(SaleAnalyzeResultInput)
    .output(SaleAnalyzeResultOutput)
    .query(({ ctx, input }) => saleService.getAnalyzeJobResult(svcCtxFromTrpc(ctx), input.sale_idno)),

  transcribe: protectedProcedure
    .input(SaleTranscribeInput)
    .output(SaleTranscribeOutput)
    .mutation(({ ctx, input }) => saleService.transcribe(svcCtxFromTrpc(ctx), input)),

  // jobs_idno 기준 polling — transcribe 뮤테이션이 반환한 jobs_idno를 그대로 사용
  transcribeResult: protectedProcedure
    .input(SaleTranscribeResultInput)
    .output(SaleTranscribeResultOutput)
    .query(({ ctx, input }) => saleService.getTranscribeJobResultById(svcCtxFromTrpc(ctx), input.jobs_idno)),

  applyReview: protectedProcedure
    .input(SaleApplyReviewInput)
    .output(SaleApplyReviewOutput)
    .mutation(({ ctx, input }) => saleService.applyReview(svcCtxFromTrpc(ctx), input)),

  patchScheduleClient: protectedProcedure
    .input(SalePatchScheduleClientInput)
    .mutation(({ ctx, input }) =>
      saleService.patchScheduleClient(svcCtxFromTrpc(ctx), input.sale_idno, input.clie_idno, input.clie_name)
    ),
});

// #endregion