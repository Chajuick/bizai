// server/modules/crm/expense/expense.dto.ts

import { z } from "zod";
import { PaginationInput } from "../shared/pagination";
import { IsoDateTime, IsoDateTimeNullable } from "../shared/dto";

// #region Enums
export const ExpenseTypeEnum = z.enum(["receipt", "invoice", "contract", "other"]);
export const PaymentMethodEnum = z.enum(["card", "cash", "transfer", "other"]);
export const RecurTypeEnum = z.enum(["none", "daily", "weekly", "monthly", "yearly"]);

export type ExpenseType = z.infer<typeof ExpenseTypeEnum>;
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;
export type RecurType = z.infer<typeof RecurTypeEnum>;
// #endregion

// #region Inputs
export const ExpenseListInput = z
  .object({
    clie_idno: z.number().int().positive().optional(),
    expe_type: ExpenseTypeEnum.optional(),
    recr_type: RecurTypeEnum.optional(),
    search: z.string().optional(),
    page: PaginationInput.optional(),
  })
  .optional();

export const ExpenseIdInput = z.object({
  expe_idno: z.number().int().positive(),
});

export const ExpenseCreateInput = z.object({
  clie_idno: z.number().int().positive().optional(),
  clie_name: z.string().optional(),
  expe_name: z.string().min(1, "지출명을 입력해주세요."),
  expe_date: z.string().min(1, "지출 일시를 입력해주세요."),
  expe_amnt: z.number().positive("금액은 0보다 커야 합니다."),
  expe_type: ExpenseTypeEnum.default("receipt"),
  paym_meth: PaymentMethodEnum.default("card"),
  recr_type: RecurTypeEnum.default("none"),
  recr_ends: z.string().optional(), // ISO date string
  expe_memo: z.string().optional(),
  file_url: z.string().optional(),
  file_key: z.string().optional(),
});

export const ExpenseUpdateInput = z.object({
  expe_idno: z.number().int().positive(),
  clie_idno: z.number().int().positive().nullable().optional(),
  clie_name: z.string().nullable().optional(),
  expe_name: z.string().min(1).optional(),
  expe_date: z.string().optional(),
  expe_amnt: z.number().positive().optional(),
  expe_type: ExpenseTypeEnum.optional(),
  paym_meth: PaymentMethodEnum.optional(),
  recr_type: RecurTypeEnum.optional(),
  recr_ends: z.string().nullable().optional(),
  expe_memo: z.string().nullable().optional(),
  file_url: z.string().nullable().optional(),
  file_key: z.string().nullable().optional(),
});

// AI 영수증 분석 입력
export const ExpenseAnalyzeReceiptInput = z.object({
  imageBase64: z.string().min(1, "이미지 데이터가 없습니다."),
  mimeType: z.string().default("image/jpeg"),
});
// #endregion

// #region Outputs
export const ExpenseItemOutput = z.object({
  expe_idno: z.number().int(),
  clie_idno: z.number().int().nullable().optional(),
  clie_name: z.string().nullable().optional(),
  expe_name: z.string(),
  expe_date: IsoDateTime,
  expe_amnt: z.string(), // decimal as string
  expe_type: ExpenseTypeEnum,
  paym_meth: PaymentMethodEnum,
  recr_type: RecurTypeEnum,
  recr_ends: IsoDateTimeNullable.optional(),
  ai_categ: z.string().nullable().optional(),
  ai_vendor: z.string().nullable().optional(),
  file_url: z.string().nullable().optional(),
  file_key: z.string().nullable().optional(),
  expe_memo: z.string().nullable().optional(),
  enab_yesn: z.boolean(),
  crea_date: IsoDateTime,
  modi_date: IsoDateTimeNullable.optional(),
});

export type ExpenseItem = z.infer<typeof ExpenseItemOutput>;

export const ExpenseListOutput = z.object({
  items: z.array(ExpenseItemOutput),
  page: z.object({
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
});

export const ExpenseCreateOutput = z.object({
  expe_idno: z.number().int(),
});

// AI 분석 결과
export const ReceiptAnalysisOutput = z.object({
  expe_name: z.string().nullable(),    // 지출명/항목
  expe_amnt: z.number().nullable(),    // 금액
  expe_date: z.string().nullable(),    // 날짜 (YYYY-MM-DD)
  expe_type: ExpenseTypeEnum.nullable(), // 영수증 유형 추천
  paym_meth: PaymentMethodEnum.nullable(), // 결제 방법
  ai_categ: z.string().nullable(),     // 카테고리 (식비, 교통비 등)
  ai_vendor: z.string().nullable(),    // 판매처
  clie_name: z.string().nullable(),    // 거래처명 (인식된 경우)
  recr_type: RecurTypeEnum.nullable(), // 반복 여부 추천
  summary: z.string().nullable(),      // AI 요약 설명
});
export type ReceiptAnalysis = z.infer<typeof ReceiptAnalysisOutput>;
// #endregion

// #region Service Types
export type ExpenseCreatePayload = z.infer<typeof ExpenseCreateInput>;
export type ExpenseUpdatePayload = Omit<z.infer<typeof ExpenseUpdateInput>, "expe_idno">;
export type ExpenseListInputType = z.infer<typeof ExpenseListInput>;
// #endregion
