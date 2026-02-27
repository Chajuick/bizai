// server/modules/crm/sale/sale.router.ts

import { protectedProcedure, router } from "../../../core/trpc";
import { svcCtxFromTrpc } from "../../../core/svcCtx";

import {
  SaleAnalyzeInput,
  SaleAnalyzeOutput,
  SaleCreateInput,
  SaleDeleteInput,
  SaleGetOutput,
  SaleIdInput,
  SaleListInput,
  SaleListOutput,
  SaleTranscribeInput,
  SaleTranscribeOutput,
  SaleUpdateInput,
} from "./sale.dto";

import { saleService } from "./sale.service";

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
    .mutation(({ ctx, input }) => saleService.analyzeSale(svcCtxFromTrpc(ctx), input.sale_idno, input.file_idno)),

  transcribe: protectedProcedure
    .input(SaleTranscribeInput)
    .output(SaleTranscribeOutput)
    .mutation(({ ctx, input }) => saleService.transcribe(svcCtxFromTrpc(ctx), input)),
});