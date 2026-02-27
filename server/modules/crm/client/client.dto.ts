// server/modules/crm/client/client.dto.ts

// #region Imports
import { z } from "zod";
import { PaginationInput } from "../shared/pagination";
import { makeSortInput } from "../shared/sort";
// #endregion

// #region List Sort (Standard)
const ClientSortInput = makeSortInput(["modi_date", "crea_date", "clie_name"] as const);
type ClientSortField = z.infer<typeof ClientSortInput>["field"];
// #endregion

// #region Inputs
/**
 * ClientListInput (standard)
 * - page + sort 표준 적용
 * - legacy: limit만 쓰던 코드는 page.limit로 흡수
 */
export const ClientListInput = z
  .object({
    search: z.string().optional(),

    page: PaginationInput.optional(),
    sort: ClientSortInput.optional(),

    // legacy compatibility
    limit: z.number().int().positive().max(200).optional(),
  })
  .optional();

export type ClientListInputType = z.infer<typeof ClientListInput>;

export const ClientIdInput = z.object({
  clie_idno: z.number().int().positive(),
});

export const ClientFindNameInput = z.object({
  name: z.string().min(1),
});

export const ClientCreateInput = z.object({
  clie_name: z.string().min(1),
  indu_type: z.string().optional(),
  cont_name: z.string().optional(),
  cont_tele: z.string().optional(),
  cont_mail: z.string().optional(),
  clie_addr: z.string().optional(),
  clie_memo: z.string().optional(),
});

export const ClientUpdateInput = z.object({
  clie_idno: z.number().int().positive(),

  clie_name: z.string().min(1).optional(),
  indu_type: z.string().optional(),
  cont_name: z.string().optional(),
  cont_tele: z.string().optional(),
  cont_mail: z.string().optional(),
  clie_addr: z.string().optional(),
  clie_memo: z.string().optional(),

  enab_yesn: z.boolean().optional(),
});

export const ClientDeleteInput = z.object({
  clie_idno: z.number().int().positive(),
});
// #endregion

// #region Outputs
export const ClientItemOutput = z.object({
  clie_idno: z.number().int().positive(),
  clie_name: z.string(),

  indu_type: z.string().nullable().optional(),
  cont_name: z.string().nullable().optional(),
  cont_tele: z.string().nullable().optional(),
  cont_mail: z.string().nullable().optional(),
  clie_addr: z.string().nullable().optional(),
  clie_memo: z.string().nullable().optional(),

  enab_yesn: z.boolean().optional(),

  crea_date: z.date().optional(),
  modi_date: z.date().nullable().optional(),
});

export type ClientItem = z.infer<typeof ClientItemOutput>;

export const ClientListOutput = z.object({
  items: z.array(ClientItemOutput),
  page: z.object({
    limit: z.number().int(),
    offset: z.number().int(),
    hasMore: z.boolean(),
  }),
});
export type ClientListOutput = z.infer<typeof ClientListOutput>;

export const ClientMatchOutput = z.object({
  clie_idno: z.number().int().positive(),
  clie_name: z.string(),
  confidence: z.number().min(0).max(1),
});
export type ClientMatch = z.infer<typeof ClientMatchOutput>;

export const ClientCreateOutput = z.object({
  clie_idno: z.number().int().positive(),
});
export type ClientCreateOutput = z.infer<typeof ClientCreateOutput>;
// #endregion

// #region Service Contracts (Type Helpers)
export type ClientCreatePayload = z.infer<typeof ClientCreateInput>;
export type ClientUpdatePayload = Omit<z.infer<typeof ClientUpdateInput>, "clie_idno">;
export type ClientSort = { field: ClientSortField; dir: "asc" | "desc" };
// #endregion