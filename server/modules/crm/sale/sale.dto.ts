// server/modules/crm/sale/sale.dto.ts

import { z } from "zod";
import { PaginationInput } from "../shared/pagination";
import { makeSortInput } from "../shared/sort";
import { FILE_PURP_TYPES } from "../../../../drizzle/schema";

// Sort
const SaleSortInput = makeSortInput(["vist_date", "modi_date", "crea_date"] as const);

// vist_date: ISO 8601 string 또는 timestamp(ms) 정수만 허용
// "x:38" 같은 애매한 문자열 → Zod 레벨에서 400 BAD_REQUEST
const VistDateInput = z.union([
  z.number().int(),                        // timestamp ms
  z.string().datetime({ offset: true }),   // ISO 8601 (UTC or +offset)
]);

// Attachment input
const FilePurpTypeZ = z.enum(FILE_PURP_TYPES);

export const SaleAttachmentInput = z.object({
  file_idno: z.number().int().positive(),
  purp_type: FilePurpTypeZ.optional(),
  sort_orde: z.number().int().optional(),
});
export type SaleAttachmentInput = z.infer<typeof SaleAttachmentInput>;

// Inputs
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

  // legacy (keep but discouraged)
  audi_addr: z.string().url().optional(),
  sttx_text: z.string().optional(),
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

  audi_addr: z.string().url().nullable().optional(),
  sttx_text: z.string().nullable().optional(),
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

// Outputs
export const SaleItemOutput = z.object({
  sale_idno: z.number().int().positive(),

  clie_idno: z.number().int().nullable(),
  clie_name: z.string().nullable(),
  cont_name: z.string().nullable(),
  sale_loca: z.string().nullable(),

  vist_date: z.string(), // ISO
  orig_memo: z.string(),

  aiex_done: z.boolean(),
  aiex_summ: z.string().nullable(),
});

export const SaleListOutput = z.object({
  items: z.array(SaleItemOutput),
  page: z.object({
    limit: z.number().int(),
    offset: z.number().int(),
    hasMore: z.boolean(),
  }),
});

export const SaleGetOutput = z.object({
  sale: z.object({
    sale_idno: z.number().int().positive(),

    clie_idno: z.number().int().nullable(),
    clie_name: z.string().nullable(),
    cont_name: z.string().nullable(),
    sale_loca: z.string().nullable(),

    vist_date: z.string(),
    sale_pric: z.union([z.string(), z.number()]).nullable(),
    orig_memo: z.string(),

    // legacy
    audi_addr: z.string().nullable(),
    sttx_text: z.string().nullable(),

    aiex_done: z.boolean(),
    aiex_summ: z.string().nullable(),
  }),

  // 연결된 고객사의 공식 연락처 (clie_idno가 있을 때만)
  client_contact: z.object({
    cont_name: z.string().nullable(),
    cont_tele: z.string().nullable(),
    cont_mail: z.string().nullable(),
    clie_addr: z.string().nullable(),
  }).nullable(),

  attachments: z.array(
    z.object({
      file_idno: z.number().int().positive(),
      purp_type: FilePurpTypeZ.nullable(),
      sort_orde: z.number().int(),
    })
  ),
});

export const AiContactOutput = z.object({
  cont_name: z.string(),
  cont_role: z.string().nullable().optional(),
  cont_tele: z.string().nullable().optional(),
  cont_mail: z.string().nullable().optional(),
});
export type AiContactOutput = z.infer<typeof AiContactOutput>;

export const SaleAnalyzeOutput = z.object({
  jobs_idno: z.number().int().positive(),
  jobs_stat: z.string(),
  summary: z.string().nullable().optional(),
  schedule_idno: z.number().int().nullable().optional(),
  // AI가 추출한 원본 고객사명 (사용자 확인 전)
  ai_client_name: z.string().nullable().optional(),
  // DB 퍼지 매칭 결과 (신뢰도 ≥ 0.7)
  matched_client_idno: z.number().int().nullable().optional(),
  matched_client_name: z.string().nullable().optional(),
  // AI가 추출한 담당자 목록 (고객사 연결 확정 시 sync에 사용)
  ai_contacts: z.array(AiContactOutput).optional(),
  // 하위 호환: 첫 번째(대표) 담당자 단일 필드
  ai_contact_person: z.string().nullable().optional(),
  ai_contact_phone: z.string().nullable().optional(),
  ai_contact_email: z.string().nullable().optional(),
});

export const SaleTranscribeOutput = z.object({
  jobs_idno: z.number().int().positive(),
  jobs_stat: z.string(),
  sttx_text: z.string().nullable().optional(),
});

// Types
export type SaleCreatePayload = z.infer<typeof SaleCreateInput>;
export type SaleUpdatePayload = Omit<z.infer<typeof SaleUpdateInput>, "sale_idno">;