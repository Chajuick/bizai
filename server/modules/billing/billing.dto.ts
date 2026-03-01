// server/modules/billing/billing.dto.ts

import { z } from "zod";
import { PLAN_CODES } from "../../../drizzle/schema";

// #region Inputs
export const ChangePlanInput = z.object({
  plan_code: z.enum(PLAN_CODES),
});
// #endregion

// #region Outputs
export const PlanItemOutput = z.object({
  plan_idno: z.number().int(),
  plan_code: z.enum(PLAN_CODES),
  plan_name: z.string(),
  seat_limt: z.number().int(),
  tokn_mont: z.number().int(),
});

export const BillingSummaryOutput = z.object({
  plan_code: z.enum(PLAN_CODES),
  plan_name: z.string(),
  subs_stat: z.string(),
  seat_limit: z.number().int(),   // seat_ovrr ?? plan.seat_limt
  token_month: z.number().int(),  // tokn_ovrr ?? plan.tokn_mont
  star_date: z.date(),
  ends_date: z.date(),
  member_count: z.number().int(),
  remaining_seats: z.number().int(),
});

export const UsageSummaryOutput = z.object({
  plan_code: z.string(),
  plan_name: z.string(),
  total_limit: z.number().int(),
  total_used: z.number().int(),
  remaining: z.number().int(),
  usage_by_feat: z.object({
    chat: z.number().int(),
    stt: z.number().int(),
    llm: z.number().int(),
  }),
  reset_date: z.date(),
  warning_level: z.enum(["ok", "warning", "exceeded"]),
});

export const CancelSubscriptionOutput = z.object({
  success: z.literal(true),
  ends_date: z.date(),
  message: z.string(),
});
// #endregion
