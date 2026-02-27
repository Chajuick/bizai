// server/modules/crm/shipment/shipment.dto.ts

// #region Imports
import { z } from "zod";
import { PaginationInput } from "../shared/pagination";
import { makeSortInput } from "../shared/sort";
// #endregion

// #region Sort
const ShipmentSortInput = makeSortInput(["modi_date", "crea_date", "ship_date", "paid_date", "invc_date"] as const);
type ShipmentSortField = z.infer<typeof ShipmentSortInput>["field"];
// #endregion

// #region Inputs
export const ShipmentListInput = z
  .object({
    orde_idno: z.number().int().positive().optional(),
    stat_code: z.enum(["pending", "delivered", "invoiced", "paid"]).optional(),
    search: z.string().optional(), // clie_name like

    page: PaginationInput.optional(),
    sort: ShipmentSortInput.optional(),

    // legacy compatibility
    limit: z.number().int().positive().max(200).optional(),
  })
  .optional();

export const ShipmentIdInput = z.object({
  ship_idno: z.number().int().positive(),
});

export const ShipmentCreateInput = z.object({
  orde_idno: z.number().int().positive(),
  clie_name: z.string().min(1),

  ship_pric: z.number().positive(), // number로 받되 service에서 string/decimal로 변환
  stat_code: z.enum(["pending", "delivered", "invoiced", "paid"]).default("pending"),

  ship_date: z.string().optional(), // ISO string (옵션)
  invc_date: z.string().optional(), // 청구일(옵션)
  paid_date: z.string().optional(), // 수금일(옵션)

  ship_memo: z.string().optional(),
});

export const ShipmentUpdateInput = z.object({
  ship_idno: z.number().int().positive(),

  clie_name: z.string().optional(),
  ship_pric: z.number().positive().optional(),
  ship_memo: z.string().optional(),

  // 상태 변경
  stat_code: z.enum(["pending", "delivered", "invoiced", "paid"]).optional(),

  // 날짜 직접 입력 옵션
  ship_date: z.string().optional(),
  invc_date: z.string().optional(),
  paid_date: z.string().optional(),

  enab_yesn: z.boolean().optional(),
});

export const ShipmentDeleteInput = z.object({
  ship_idno: z.number().int().positive(),
});
// #endregion

// #region Outputs
export const ShipmentItemOutput = z.object({
  ship_idno: z.number().int().positive(),
  comp_idno: z.number().int().positive(),

  owne_idno: z.number().int().positive(),
  orde_idno: z.number().int().positive(),
  clie_name: z.string(),

  stat_code: z.enum(["pending", "delivered", "invoiced", "paid"]),

  ship_date: z.date().nullable().optional(),
  invc_date: z.date().nullable().optional(),
  paid_date: z.date().nullable().optional(),

  ship_pric: z.any(), // decimal은 드라이버 반환 타입이 프로젝트마다 달라서 any (추측 금지)
  ship_memo: z.string().nullable().optional(),

  enab_yesn: z.boolean().optional(),

  crea_idno: z.number().int().positive().optional(),
  crea_date: z.date().optional(),
  modi_idno: z.number().int().positive().nullable().optional(),
  modi_date: z.date().nullable().optional(),
});

export type ShipmentItem = z.infer<typeof ShipmentItemOutput>;

export const ShipmentListOutput = z.object({
  items: z.array(ShipmentItemOutput),
  page: z.object({
    limit: z.number().int(),
    offset: z.number().int(),
    hasMore: z.boolean(),
  }),
});
export type ShipmentListOutput = z.infer<typeof ShipmentListOutput>;
// #endregion

// #region Service Contracts
export type ShipmentCreatePayload = z.infer<typeof ShipmentCreateInput>;
export type ShipmentUpdatePayload = Omit<z.infer<typeof ShipmentUpdateInput>, "ship_idno">;
export type ShipmentSort = { field: ShipmentSortField; dir: "asc" | "desc" };
// #endregion