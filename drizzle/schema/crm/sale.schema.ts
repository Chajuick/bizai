import { int, varchar, text, json, boolean, timestamp, decimal, index } from "drizzle-orm/mysql-core";
import { companyCols, auditCols } from "../common/default";
import { table } from "../common/table";
import { aiStatusEnum } from "../common/enums";

export const CRM_SALE = table(
  "CRM_SALE",
  {
    sale_idno: int("sale_idno").autoincrement().primaryKey(),      // 영업일지 PK
    ...companyCols(),                                              // comp_idno (회사 키)

    owne_idno: int("owne_idno").notNull(),                         // 작성자 user_idno
    clie_idno: int("clie_idno"),                                   // 고객 ID(옵션)
    clie_name: varchar("clie_name", { length: 200 }),              // 고객명(자유입력 or CLIENT 연동)
    cont_name: varchar("cont_name", { length: 100 }),              // 담당자명(스냅샷)
    cont_role: varchar("cont_role", { length: 100 }),              // 업무/직책
    cont_tele: varchar("cont_tele", { length: 50 }),               // 연락처
    cont_mail: varchar("cont_mail", { length: 320 }),              // 이메일
    sale_loca: varchar("sale_loca", { length: 200 }),              // 방문/미팅 장소

    vist_date: timestamp("vist_date").notNull(),                   // 방문일시
    sale_pric: decimal("sale_pric", { precision: 15, scale: 2 }),  // AI/수동 입력 금액(옵션)
    orig_memo: text("orig_memo").notNull(),                        // 원문(사용자 입력/음성 텍스트)
    aiex_summ: text("aiex_summ"),                                  // AI 요약 결과
    aiex_text: json("aiex_text"),                                  // AI 추출(json)
    sttx_text: text("sttx_text"),                                  // STT 원본 텍스트 (변경 불가, 참조용)
    edit_text: text("edit_text"),                                  // 사용자 수정 텍스트 (STT 후 편집 시 저장, null=미수정)
    aiex_done: boolean("aiex_done").default(false).notNull(),      // AI 처리 완료 여부
    ai_status: aiStatusEnum.default("pending").notNull(),          // AI 분석 상태

    enab_yesn: boolean("enab_yesn").default(true).notNull(),       // 활성 여부

    ...auditCols(),                                                // crea_*/modi_* 감사
  },
  (t) => [
    index("ix_sale_comp_vist").on(t.comp_idno, t.vist_date),                   // 회사별 타임라인
    index("ix_sale_comp_owne_vist").on(t.comp_idno, t.owne_idno, t.vist_date), // 작성자별 타임라인
    index("ix_sale_comp_clie_vist").on(t.comp_idno, t.clie_idno, t.vist_date), // 고객별 타임라인
    index("ix_sale_comp_cont").on(t.comp_idno, t.cont_name),                   // 담당자별 타임라인
  ]
);

export type SaleInfo = typeof CRM_SALE.$inferSelect;
export type InsertSaleInfo = typeof CRM_SALE.$inferInsert;