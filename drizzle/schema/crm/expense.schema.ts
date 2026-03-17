import { int, varchar, text, boolean, decimal, timestamp, index } from "drizzle-orm/mysql-core";
import { table } from "../common/table";
import { companyCols, auditCols } from "../common/default";

/**
 * CRM_EXPENSE — 지출 내역
 *
 * expe_type: receipt(영수증) | invoice(세금계산서/명세서) | contract(계약서) | other(기타)
 * paym_meth: card(카드) | cash(현금) | transfer(계좌이체) | other(기타)
 * recr_type: none(일회성) | daily | weekly | monthly | yearly
 */
export const CRM_EXPENSE = table(
  "CRM_EXPENSE",
  {
    expe_idno: int("expe_idno").autoincrement().primaryKey(),
    ...companyCols(),

    // 거래처 연결 (선택)
    clie_idno: int("clie_idno"),
    clie_name: varchar("clie_name", { length: 200 }),

    // 지출 기본 정보
    expe_name: varchar("expe_name", { length: 200 }).notNull(), // 지출명/항목
    expe_date: timestamp("expe_date").notNull(),                // 지출 일시
    expe_amnt: decimal("expe_amnt", { precision: 18, scale: 2 }).notNull(), // 금액
    expe_type: varchar("expe_type", { length: 20 }).default("receipt").notNull(),
    // 'receipt' | 'invoice' | 'contract' | 'other'

    paym_meth: varchar("paym_meth", { length: 20 }).default("card").notNull(),
    // 'card' | 'cash' | 'transfer' | 'other'

    // 반복 지출
    recr_type: varchar("recr_type", { length: 20 }).default("none").notNull(),
    // 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
    recr_ends: timestamp("recr_ends"),                         // 반복 종료일 (null=무기한)

    // AI 분석 결과
    ai_categ: varchar("ai_categ", { length: 100 }),            // AI 추출 카테고리 (식비, 교통비 등)
    ai_vendor: varchar("ai_vendor", { length: 200 }),          // AI 추출 판매처
    ai_raw: text("ai_raw"),                                    // AI 원본 응답 JSON

    // 첨부 파일 (영수증 이미지 URL — R2)
    file_url: text("file_url"),
    file_key: varchar("file_key", { length: 500 }),

    expe_memo: text("expe_memo"),                              // 메모
    enab_yesn: boolean("enab_yesn").default(true).notNull(),

    ...auditCols(),
  },
  (t) => [
    index("ix_expense_comp").on(t.comp_idno),
    index("ix_expense_clie").on(t.clie_idno),
    index("ix_expense_date").on(t.expe_date),
  ]
);

export type Expense = typeof CRM_EXPENSE.$inferSelect;
export type InsertExpense = typeof CRM_EXPENSE.$inferInsert;
