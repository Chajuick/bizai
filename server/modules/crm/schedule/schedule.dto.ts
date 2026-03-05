// server/modules/crm/schedule/schedule.dto.ts

// #region Imports
import { z } from "zod";
import { ACTION_OWNERS, SCHEDULE_STATUSES } from "../../../../drizzle/schema/common/enums";
import { PaginationInput } from "../shared/pagination";
import { makeSortInput } from "../shared/sort";
import { IsoDateTime, IsoDateTimeNullable, DecimalLikeNullable } from "../shared/dto";
// #endregion

// #region Sort
const ScheduleSortInput = makeSortInput(["modi_date", "crea_date", "sche_date"] as const);
type ScheduleSortField = z.infer<typeof ScheduleSortInput>["field"];
// #endregion

// #region Tab
export const SCHEDULE_TAB_KEYS = ["all", "scheduled", "overdue", "imminent", "completed", "canceled"] as const;
export type ScheduleTabKey = (typeof SCHEDULE_TAB_KEYS)[number];
// #endregion

// #region Inputs
export const ScheduleListInput = z
  .object({
    tab: z.enum(SCHEDULE_TAB_KEYS).optional(),

    page: PaginationInput.optional(),
    sort: ScheduleSortInput.optional(),
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

  sche_pric: DecimalLikeNullable.optional(), // ✅ 기존 union/string/number를 공용으로
  sche_date: IsoDateTime,                   // ✅ z.date() → ISO string

  stat_code: z.enum(SCHEDULE_STATUSES),
  actn_ownr: z.enum(ACTION_OWNERS).nullable().optional(),
  remd_sent: z.boolean().optional(),
  auto_gene: z.boolean().optional(),
  enab_yesn: z.boolean().optional(),

  crea_idno: z.number().int().optional(),
  crea_date: IsoDateTime.optional(),        // ✅ z.date() → ISO string
  modi_idno: z.number().int().nullable().optional(),
  modi_date: IsoDateTimeNullable.optional(), // ✅ z.date() → ISO string

  // ✅ 서버 계산 파생 플래그
  overdue: z.boolean(),
  imminent: z.boolean(),
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

// ✅ 탭 카운트(전체 기준) 전용 output
export const ScheduleStatsOutput = z.object({
  all: z.number().int().nonnegative(),
  imminent: z.number().int().nonnegative(),
  overdue: z.number().int().nonnegative(),
  scheduled: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  canceled: z.number().int().nonnegative(),
});
export type ScheduleStatsOutput = z.infer<typeof ScheduleStatsOutput>;
// #endregion

// #region Service Contracts
export type ScheduleListInputType = z.infer<typeof ScheduleListInput>;
export type ScheduleCreatePayload = z.infer<typeof ScheduleCreateInput>;
export type ScheduleUpdatePayload = Omit<z.infer<typeof ScheduleUpdateInput>, "sche_idno">;
export type ScheduleSort = { field: ScheduleSortField; dir: "asc" | "desc" };
// #endregion