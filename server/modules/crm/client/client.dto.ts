// server/modules/crm/client/client.dto.ts

// #region Imports
import { z } from "zod";
import { PaginationInput } from "../shared/pagination";
import { makeSortInput } from "../shared/sort";
import { IsoDateTime, IsoDateTimeNullable } from "../shared/dto";
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
  bizn_numb: z.string().regex(/^\d{10}$/, "사업자번호는 숫자 10자리여야 합니다.").optional(),
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
  bizn_numb: z.string().regex(/^\d{10}$/, "사업자번호는 숫자 10자리여야 합니다.").nullable().optional(),
  indu_type: z.string().nullable().optional(),
  cont_name: z.string().nullable().optional(),
  cont_tele: z.string().nullable().optional(),
  cont_mail: z.string().nullable().optional(),
  clie_addr: z.string().nullable().optional(),
  clie_memo: z.string().nullable().optional(),

  enab_yesn: z.boolean().optional(),
});

export const ClientDeleteInput = z.object({
  clie_idno: z.number().int().positive(),
});

export const ClientSyncContactInput = z.object({
  clie_idno: z.number().int().positive(),
  cont_name: z.string().optional(),
  cont_tele: z.string().optional(),
  cont_mail: z.string().optional(),
});

// AI 추출 담당자 항목 (복수)
export const AiContactItemInput = z.object({
  cont_name: z.string().min(1),
  cont_role: z.string().nullable().optional(),   // "실무담당" | "의사결정자" | 기타 자유 문자열
  cont_tele: z.string().nullable().optional(),
  cont_mail: z.string().nullable().optional(),
});
export type AiContactItem = z.infer<typeof AiContactItemInput>;

export const ClientSyncContactsInput = z.object({
  clie_idno: z.number().int().positive(),
  contacts: z.array(AiContactItemInput).min(1).max(10),
});

// #region Contact CRUD
export const ClientContactIdInput = z.object({
  cont_idno: z.number().int().positive(),
});

export const ClientContactListInput = z.object({
  clie_idno: z.number().int().positive(),
});

export const ClientContactCreateInput = z.object({
  clie_idno: z.number().int().positive(),
  cont_name: z.string().min(1),
  cont_role: z.string().optional(),
  cont_tele: z.string().optional(),
  cont_mail: z.string().email().optional().or(z.literal("")),
  cont_memo: z.string().optional(),
  main_yesn: z.boolean().default(false),
});

export const ClientContactUpdateInput = z.object({
  cont_idno: z.number().int().positive(),
  cont_name: z.string().min(1).optional(),
  cont_role: z.string().optional(),
  cont_tele: z.string().optional(),
  cont_mail: z.string().email().optional().or(z.literal("")),
  cont_memo: z.string().optional(),
  main_yesn: z.boolean().optional(),
});

export const ClientContactDeleteInput = z.object({
  cont_idno: z.number().int().positive(),
});
// #endregion

// #region Outputs
export const ClientItemOutput = z.object({
  clie_idno: z.number().int().positive(),
  clie_name: z.string(),
  bizn_numb: z.string().nullable().optional(),

  indu_type: z.string().nullable().optional(),
  cont_name: z.string().nullable().optional(),
  cont_tele: z.string().nullable().optional(),
  cont_mail: z.string().nullable().optional(),
  clie_addr: z.string().nullable().optional(),
  clie_memo: z.string().nullable().optional(),

  enab_yesn: z.boolean().optional(),

  crea_date: IsoDateTime.optional(),
  modi_date: IsoDateTimeNullable.optional(),
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

export const ClientContactItemOutput = z.object({
  cont_idno: z.number().int().positive(),
  clie_idno: z.number().int().positive(),
  cont_name: z.string(),
  cont_role: z.string().nullable(),
  cont_tele: z.string().nullable(),
  cont_mail: z.string().nullable(),
  cont_memo: z.string().nullable(),
  main_yesn: z.boolean(),
  enab_yesn: z.boolean(),
  crea_date: IsoDateTime,
  modi_date: IsoDateTimeNullable,
});
export type ClientContactItem = z.infer<typeof ClientContactItemOutput>;

export const ClientContactListOutput = z.array(ClientContactItemOutput);
// #endregion

// #region Aggregate Inputs
export const ContactCreateItemInput = z.object({
  cont_name: z.string().min(1),
  cont_role: z.string().optional(),
  cont_tele: z.string().optional(),
  cont_mail: z.string().email().optional().or(z.literal("")),
  cont_memo: z.string().optional(),
  main_yesn: z.boolean().default(false),
});

export const ContactSaveItemInput = z.object({
  cont_idno: z.number().int().positive().optional(),
  cont_name: z.string().min(1),
  cont_role: z.string().optional(),
  cont_tele: z.string().optional(),
  cont_mail: z.string().email().optional().or(z.literal("")),
  cont_memo: z.string().optional(),
  main_yesn: z.boolean().default(false),
  _state: z.enum(["keep", "new", "update", "delete"]),
});

export const ClientCreateWithContactsInput = z.object({
  client: ClientCreateInput,
  contacts: z.array(ContactCreateItemInput).optional(),
});

export const ClientSaveWithContactsInput = z.object({
  client: ClientUpdateInput,
  contacts: z.array(ContactSaveItemInput).optional(),
});
// #endregion

// #region Upload
export const ClientUploadInput = z.object({
  fileBase64: z.string().min(1),
  fileName: z.string().min(1),
});

export const ClientUploadRowError = z.object({
  row: z.number().int(),    // 엑셀 데이터 행 번호 (1-based, 헤더 제외)
  reason: z.string(),       // 실패 사유 (한국어)
});

export const ClientUploadOutput = z.object({
  inserted: z.number().int(),
  updated: z.number().int(),
  failed: z.number().int(),
  errors: z.array(ClientUploadRowError),
});

export type ClientUploadOutput = z.infer<typeof ClientUploadOutput>;
export type ClientUploadRowError = z.infer<typeof ClientUploadRowError>;
// #endregion

// #region Service Contracts (Type Helpers)
export type ClientCreatePayload = z.infer<typeof ClientCreateInput>;
export type ClientUpdatePayload = Omit<z.infer<typeof ClientUpdateInput>, "clie_idno">;
export type ClientSort = { field: ClientSortField; dir: "asc" | "desc" };

export type ClientContactCreatePayload = z.infer<typeof ClientContactCreateInput>;
export type ClientContactUpdatePayload = z.infer<typeof ClientContactUpdateInput>;
// #endregion