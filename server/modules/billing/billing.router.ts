// server/modules/billing/billing.router.ts

// #region Imports
import { z } from "zod";
import { companyAdminProcedure, protectedProcedure, router } from "../../core/trpc";
import { svcCtxFromTrpc } from "../../core/svcCtx";
import {
  BillingSummaryOutput,
  CancelSubscriptionOutput,
  ChangePlanInput,
  PlanItemOutput,
  UsageSummaryOutput,
} from "./billing.dto";
import { billingService } from "./billing.service";
// #endregion

export const billingRouter = router({
  // 현재 회사 구독 요약
  getSummary: protectedProcedure
    .output(BillingSummaryOutput)
    .query(({ ctx }) => billingService.getSummary(svcCtxFromTrpc(ctx))),

  // 전체 플랜 목록 (공개)
  listPlans: protectedProcedure
    .output(z.array(PlanItemOutput))
    .query(() => billingService.listPlans()),

  // 플랜 변경 (fake — 나중에 결제 연동 시 applyPlanChange로 교체)
  changePlanFake: companyAdminProcedure
    .input(ChangePlanInput)
    .mutation(({ ctx, input }) =>
      billingService.changePlanFake(svcCtxFromTrpc(ctx), input.plan_code),
    ),

  // AI 사용량 요약
  getUsageSummary: protectedProcedure
    .output(UsageSummaryOutput)
    .query(({ ctx }) => billingService.getUsageSummary(svcCtxFromTrpc(ctx))),

  // 플랜 해지 (canceled 상태로 전환, ends_date까지 유예)
  cancelSubscription: companyAdminProcedure
    .output(CancelSubscriptionOutput)
    .mutation(({ ctx }) => billingService.cancelSubscription(svcCtxFromTrpc(ctx))),
});
