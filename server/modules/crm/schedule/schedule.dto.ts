// server/modules/crm/schedule/schedule.dto.ts

// #region Imports
import { z } from "zod";
import { SCHEDULE_STATUSES } from "../../../../drizzle/schema/common/enums";
import { PaginationInput } from "../shared/pagination";
import { makeSortInput } from "../shared/sort";
// #endregion

// #region Sort
const ScheduleSortInput = makeSortInput(["modi_date", "crea_date", "sche_date"] as const);
type ScheduleSortField = z.infer<typeof ScheduleSortInput>["field"];
// #endregion

// #region Inputs
export const ScheduleListInput = z
  .object({
    stat_code: z.enum(SCHEDULE_STATUSES).optional(),
    upcoming: z.boolean().optional(),

    page: PaginationInput.optional(),
    sort: ScheduleSortInput.optional(),

    // legacy compatibility
    limit: z.number().int().positive().max(200).optional(),
  })
  .optional();

export const ScheduleIdInput = z.object({
  sche_idno: z.number().int().positive(),
});

export const ScheduleCreateInput = z.object({
  sale_idno: z.number().int().positive().optional(),
  clie_idno: z.number().int().positive().optional(),
  clie_name: z.string().optional(),

  sche_name: z.string().min(1),
  sche_desc: z.string().optional(),

  sche_pric: z.number().positive().optional(),
  sche_date: z.string(), // ISO string
});

export const ScheduleUpdateInput = z.object({
  sche_idno: z.number().int().positive(),

  sche_name: z.string().min(1).optional(),
  sche_desc: z.string().nullable().optional(),

  sche_pric: z.number().positive().nullable().optional(),
  sche_date: z.string().nullable().optional(),

  stat_code: z.enum(SCHEDULE_STATUSES).optional(),
  clie_name: z.string().nullable().optional(),

  enab_yesn: z.boolean().optional(),
});

export const ScheduleDeleteInput = z.object({
  sche_idno: z.number().int().positive(),
});
// #endregion

// #region Outputs
export const ScheduleItemOutput = z.object({
  sche_idno: z.number().int().positive(),
  comp_idno: z.number().int(),
  owne_idno: z.number().int(),

  sale_idno: z.number().int().nullable().optional(),
  clie_idno: z.number().int().nullable().optional(),
  clie_name: z.string().nullable().optional(),

  sche_name: z.string(),
  sche_desc: z.string().nullable().optional(),

  sche_pric: z.union([z.string(), z.number()]).nullable().optional(),
  sche_date: z.date(),

  stat_code: z.enum(SCHEDULE_STATUSES),
  remd_sent: z.boolean().optional(),
  auto_gene: z.boolean().optional(),
  enab_yesn: z.boolean().optional(),

  crea_idno: z.number().int().optional(),
  crea_date: z.date().optional(),
  modi_idno: z.number().int().nullable().optional(),
  modi_date: z.date().nullable().optional(),
});

export type ScheduleItem = z.infer<typeof ScheduleItemOutput>;

export const ScheduleListOutput = z.object({
  items: z.array(ScheduleItemOutput),
  page: z.object({
    limit: z.number().int(),
    offset: z.number().int(),
    hasMore: z.boolean(),
  }),
});
export type ScheduleListOutput = z.infer<typeof ScheduleListOutput>;
// #endregion

// #region Service Contracts
export type ScheduleCreatePayload = z.infer<typeof ScheduleCreateInput>;
export type ScheduleUpdatePayload = Omit<z.infer<typeof ScheduleUpdateInput>, "sche_idno">;
export type ScheduleSort = { field: ScheduleSortField; dir: "asc" | "desc" };
// #endregion