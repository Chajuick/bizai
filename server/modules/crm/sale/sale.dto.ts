// server/modules/crm/sale/sale.dto.ts

// #region Imports

import { z } from "zod";
import { PaginationInput } from "../shared/pagination";
import { makeSortInput } from "../shared/sort";
import { FILE_PURP_TYPES, AI_STATUSES } from "../../../../drizzle/schema";
import { IsoDateTime, DecimalLikeNullable } from "../shared/dto";

// #endregion

// #region Sort / Inputs Common

const SaleSortInput = makeSortInput(["vist_date", "modi_date", "crea_date"] as const);

const VistDateInput = z.union([
  z.number().int(), // timestamp ms
  z.string().datetime({ offset: true }), // ISO 8601
]);

const FilePurpTypeZ = z.enum(FILE_PURP_TYPES);

// #endregion

// #region Attachment Input

export const SaleAttachmentInput = z.object({
  file_idno: z.number().int().positive(),
  purp_type: FilePurpTypeZ.optional(),
  sort_orde: z.number().int().optional(),
});
export type SaleAttachmentInput = z.infer<typeof SaleAttachmentInput>;

// #endregion

// #region Inputs

export const SaleListInput = z.object({
  clie_idno: z.number().int().positive().optional(),
  search: z.string().optional(),

  page: PaginationInput.optional(),
  sort: SaleSortInput.optional(),
});

export const SaleIdInput = z.object({
  sale_idno: z.number().int().positive(),
});

export const SaleCreateInput = z.object({
  clie_idno: z.number().int().positive().optional(),
  clie_name: z.string().optional(),
  cont_name: z.string().optional(),
  sale_loca: z.string().optional(),

  vist_date: VistDateInput,
  sale_pric: z.number().nonnegative().optional(),
  orig_memo: z.string().min(1),

  attachments: z.array(SaleAttachmentInput).optional(),

  sttx_text: z.string().optional(),
  edit_text: z.string().optional(),
});

export const SaleUpdateInput = z.object({
  sale_idno: z.number().int().positive(),

  clie_idno: z.number().int().positive().nullable().optional(),
  clie_name: z.string().nullable().optional(),
  cont_name: z.string().nullable().optional(),
  sale_loca: z.string().nullable().optional(),

  vist_date: VistDateInput.nullable().optional(),
  sale_pric: z.number().nonnegative().nullable().optional(),
  orig_memo: z.string().nullable().optional(),

  sttx_text: z.string().nullable().optional(),
  edit_text: z.string().nullable().optional(),
});

export const SaleDeleteInput = z.object({
  sale_idno: z.number().int().positive(),
});

export const SaleAnalyzeInput = z.object({
  sale_idno: z.number().int().positive(),
  file_idno: z.number().int().positive().optional(),
});

export const SaleTranscribeInput = z.object({
  sale_idno: z.number().int().positive(),
  file_idno: z.number().int().positive(),
  language: z.string().optional(),
});

export const SalePatchScheduleClientInput = z.object({
  sale_idno: z.number().int().positive(),
  clie_idno: z.number().int().positive(),
  clie_name: z.string().optional(),
});

// #endregion

// #region Outputs: AI Core

const AiCoreAppointmentOutput = z.object({
  title: z.string(),
  date: z.string().nullable(),
  desc: z.string(),
  action_owner: z.enum(["self", "client", "shared"]),
  key: z.string(), // ✅ schedule.aiex_keys와 매칭하는 키
});

const AiCorePricingEntryOutput = z.object({
  amount: z.number().int().nullable(),
  min: z.number().int().nullable(),
  max: z.number().int().nullable(),
  type: z.enum(["one_time", "monthly", "yearly"]),
  vat: z.enum(["included", "excluded", "unknown"]),
  approximate: z.boolean(),
  inferred: z.boolean(),
  label: z.string(),
});

const AiCorePricingOutput = z.object({
  primary: AiCorePricingEntryOutput.nullable(),
  alternatives: z.array(AiCorePricingEntryOutput),
  final: AiCorePricingEntryOutput.nullable(),
}).nullable();

export const AiCoreOutput = z.object({
  pricing: AiCorePricingOutput,
  notes: z.string(),
  appointments: z.array(AiCoreAppointmentOutput),
});

// #endregion

// #region Outputs: Sale List/Get

export const SaleItemOutput = z.object({
  sale_idno: z.number().int().positive(),

  clie_idno: z.number().int().nullable(),
  clie_name: z.string().nullable(),
  cont_name: z.string().nullable(),
  sale_loca: z.string().nullable(),

  vist_date: IsoDateTime, // Date (superjson) or ISO string
  sale_pric: DecimalLikeNullable, // decimal → string|null from Drizzle
  orig_memo: z.string(),

  aiex_done: z.boolean(),
  aiex_summ: z.string().nullable(),
  aiex_stat: z.enum(AI_STATUSES),
});

export const SaleListOutput = z.object({
  items: z.array(SaleItemOutput),
  page: z.object({
    limit: z.number().int(),
    offset: z.number().int(),
    hasMore: z.boolean(),
  }),
});

export const ScheduleSummaryOutput = z.object({
  sche_idno: z.number().int().positive(),
  sche_name: z.string(),
  sche_date: z.string(), // ISO
  sche_desc: z.string().nullable().optional(),
  sche_stat: z.string(),
  actn_ownr: z.string().nullable(),
  auto_gene: z.boolean(),
  aiex_keys: z.string().nullable(),
});

export const SaleGetOutput = z.object({
  sale: z.object({
    sale_idno: z.number().int().positive(),

    clie_idno: z.number().int().nullable(),
    clie_name: z.string().nullable(),

    cont_name: z.string().nullable(),
    cont_role: z.string().nullable(),
    cont_mail: z.string().nullable(),
    cont_tele: z.string().nullable(),

    sale_loca: z.string().nullable(),

    vist_date: IsoDateTime,
    sale_pric: DecimalLikeNullable,
    orig_memo: z.string(),

    sttx_text: z.string().nullable(),
    edit_text: z.string().nullable(),

    aiex_done: z.boolean(),
    aiex_summ: z.string().nullable(),
    aiex_stat: z.enum(AI_STATUSES),

    aiex_core: AiCoreOutput.nullable(),
  }),

  client_contact: z
    .object({
      cont_name: z.string().nullable(),
      cont_tele: z.string().nullable(),
      cont_mail: z.string().nullable(),
      clie_addr: z.string().nullable(),
    })
    .nullable(),

  attachments: z.array(
    z.object({
      file_idno: z.number().int().positive(),
      purp_type: FilePurpTypeZ.nullable(),
      sort_orde: z.number().int(),
    })
  ),

  schedules: z.array(ScheduleSummaryOutput), // ✅ 후속조치 생성여부 판단용
});

// #endregion

// #region Outputs: Analyze/Transcribe

export const AiContactOutput = z.object({
  cont_name: z.string(),
  cont_role: z.string().nullable().optional(),
  cont_tele: z.string().nullable().optional(),
  cont_mail: z.string().nullable().optional(),
});
export type AiContactOutput = z.infer<typeof AiContactOutput>;

/** analyze 뮤테이션 즉시 응답 (큐 등록만 확인) */
export const SaleAnalyzeOutput = z.object({
  jobs_idno: z.number().int().positive(),
  jobs_stat: z.string(),
});

/** analyzeResult 쿼리 입력 */
export const SaleAnalyzeResultInput = z.object({
  sale_idno: z.number().int().positive(),
});

/** analyzeResult 쿼리 응답 (워커 완료 후 조회) */
export const SaleAnalyzeResultOutput = z.object({
  aiex_stat: z.enum(AI_STATUSES),
  jobs_stat: z.string().nullable(),

  summary: z.string().nullable(),
  schedule_idno: z.number().int().nullable(),

  ai_client_name: z.string().nullable(),
  matched_client_idno: z.number().int().nullable(),
  matched_client_name: z.string().nullable(),

  ai_contacts: z.array(AiContactOutput),

  ai_contact_person: z.string().nullable(),
  ai_contact_phone: z.string().nullable(),
  ai_contact_email: z.string().nullable(),
});

export const SaleTranscribeOutput = z.object({
  jobs_idno: z.number().int().positive(),
  jobs_stat: z.string(),
});

/** transcribeResult 쿼리 입력 — jobs_idno 기준 (transcribe 뮤테이션이 반환한 값 사용) */
export const SaleTranscribeResultInput = z.object({
  jobs_idno: z.number().int().positive(),
});

/** transcribeResult 쿼리 응답 (워커 완료 후 polling) */
export const SaleTranscribeResultOutput = z.object({
  jobs_stat: z.enum(["queued", "running", "done", "failed"]).nullable(),
  sttx_text: z.string().nullable(),
  fail_mess: z.string().nullable(),
});

// #endregion

// #region Types

export type SaleCreatePayload = z.infer<typeof SaleCreateInput>;
export type SaleUpdatePayload = Omit<z.infer<typeof SaleUpdateInput>, "sale_idno">;

// #endregion