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
  // #region Summary
  getSummary: protectedProcedure
    .output(BillingSummaryOutput)
    .query(({ ctx }) => billingService.getSummary(svcCtxFromTrpc(ctx))),
  // #endregion

  // #region Plans
  listPlans: protectedProcedure
    .output(z.array(PlanItemOutput))
    .query(() => billingService.listPlans()),
  // #endregion

  // #region Change plan (fake — 결제 연동 시 교체)
  changePlanFake: companyAdminProcedure
    .input(ChangePlanInput)
    .mutation(({ ctx, input }) =>
      billingService.changePlanFake(svcCtxFromTrpc(ctx), input.plan_code),
    ),
  // #endregion

  // #region Usage summary
  getUsageSummary: protectedProcedure
    .output(UsageSummaryOutput)
    .query(({ ctx }) => billingService.getUsageSummary(svcCtxFromTrpc(ctx))),
  // #endregion

  // #region Cancel at period end
  cancelSubscription: companyAdminProcedure
    .output(CancelSubscriptionOutput)
    .mutation(({ ctx }) => billingService.cancelSubscription(svcCtxFromTrpc(ctx))),
  // #endregion
});