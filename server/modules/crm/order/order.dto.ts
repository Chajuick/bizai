// server/modules/crm/order/order.dto.ts

// #region Imports
import { z } from "zod";
import { ORDER_STATUSES } from "../../../../drizzle/schema/common/enums";
import { PaginationInput } from "../shared/pagination";
import { makeSortInput } from "../shared/sort";
import { IsoDateTime, IsoDateTimeNullable, DecimalLike } from "../shared/dto";
// #endregion

// #region Sort
const OrderSortInput = makeSortInput(["modi_date", "crea_date", "ctrt_date", "expd_date"] as const);
type OrderSortField = z.infer<typeof OrderSortInput>["field"];
// #endregion

// #region Inputs
export const OrderListInput = z
  .object({
    search: z.string().optional(),

    status: z.enum(ORDER_STATUSES).optional(),
    clie_idno: z.number().int().positive().optional(),

    // 날짜 범위 필터 (ISO string, 포함)
    from: z.string().optional(),
    to: z.string().optional(),

    page: PaginationInput.optional(),
    sort: OrderSortInput.optional(),

    // legacy compatibility
    limit: z.number().int().positive().max(200).optional(),
  })
  .optional();

export const OrderIdInput = z.object({
  orde_idno: z.number().int().positive(),
});

export const OrderCreateInput = z.object({
  clie_idno: z.number().int().positive().optional(),
  sale_idno: z.number().int().positive().optional(),

  clie_name: z.string().min(1),
  prod_serv: z.string().min(1),

  orde_pric: z.number().positive(),

  orde_stat: z.enum(ORDER_STATUSES).default("proposal"),

  ctrt_date: z.string().optional(),
  expd_date: z.string().optional(),
  orde_memo: z.string().optional(),
});

export const OrderUpdateInput = z.object({
  orde_idno: z.number().int().positive(),

  clie_idno: z.number().int().positive().nullable().optional(),
  sale_idno: z.number().int().positive().nullable().optional(),

  clie_name: z.string().min(1).optional(),
  prod_serv: z.string().min(1).optional(),

  orde_pric: z.number().positive().optional(),
  orde_stat: z.enum(ORDER_STATUSES).optional(),

  ctrt_date: z.string().nullable().optional(),
  expd_date: z.string().nullable().optional(),
  orde_memo: z.string().nullable().optional(),

  enab_yesn: z.boolean().optional(),
});

export const OrderDeleteInput = z.object({
  orde_idno: z.number().int().positive(),
});
// #endregion

// #region Outputs
export const OrderItemOutput = z.object({
  orde_idno: z.number().int().positive(),
  comp_idno: z.number().int(),
  owne_idno: z.number().int(),

  clie_idno: z.number().int().nullable().optional(),
  sale_idno: z.number().int().nullable().optional(),

  clie_name: z.string(),
  prod_serv: z.string(),

  // drizzle decimal은 보통 string으로 내려옴(정석)
  orde_pric: DecimalLike,
  orde_stat: z.enum(ORDER_STATUSES),

  ctrt_date: IsoDateTimeNullable.optional(), // ✅ z.date() → ISO
  expd_date: IsoDateTimeNullable.optional(),
  orde_memo: z.string().nullable().optional(),

  enab_yesn: z.boolean().optional(),

  crea_idno: z.number().int().optional(),
  crea_date: IsoDateTime.optional(),
  modi_idno: z.number().int().nullable().optional(),
  modi_date: IsoDateTimeNullable.optional(),
});

export type OrderItem = z.infer<typeof OrderItemOutput>;

export const OrderListOutput = z.object({
  items: z.array(OrderItemOutput),
  page: z.object({
    limit: z.number().int(),
    offset: z.number().int(),
    hasMore: z.boolean(),
  }),
});
export type OrderListOutput = z.infer<typeof OrderListOutput>;

export const OrderStatsOutput = z.object({
  all: z.number().int(),
  proposal: z.number().int(),
  negotiation: z.number().int(),
  confirmed: z.number().int(),
  canceled: z.number().int(),
  totalPipeline: z.number(),
  confirmedAmount: z.number(),
});
export type OrderStatsOutput = z.infer<typeof OrderStatsOutput>;
// #endregion

// #region Service Contracts
export type OrderCreatePayload = z.infer<typeof OrderCreateInput>;
export type OrderUpdatePayload = Omit<z.infer<typeof OrderUpdateInput>, "orde_idno">;
export type OrderSort = { field: OrderSortField; dir: "asc" | "desc" };
// #endregion