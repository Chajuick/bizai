import { int, varchar, text, json, boolean, timestamp, index } from "drizzle-orm/mysql-core";
import { companyCols, auditCols } from "../_common/default";
import { table } from "../_common/table";

export const CRM_SALE = table(
  "CRM_SALE",
  {
    sale_idno: int("sale_idno").autoincrement().primaryKey(),      // 영업일지 PK
    ...companyCols(),                                              // comp_idno (회사 키)

    owne_idno: int("owne_idno").notNull(),                         // 작성자 user_idno
    clie_idno: int("clie_idno"),                                   // 고객 ID(옵션)
    clie_name: varchar("clie_name", { length: 200 }),              // 고객명(스냅샷/자유입력)
    cont_name: varchar("cont_name", { length: 100 }),              // 담당자명(스냅샷)
    sale_loca: varchar("sale_loca", { length: 200 }),              // 방문/미팅 장소

    vist_date: timestamp("vist_date").notNull(),                   // 방문일시
    orig_memo: text("orig_memo").notNull(),                        // 원문(사용자 입력/음성 텍스트)
    aiex_summ: text("aiex_summ"),                                  // AI 요약 결과
    aiex_text: json("aiex_text"),                                  // AI 추출(json)
    audi_addr: text("audi_addr"),                                  // 음성 파일 URL(옵션) *가능하면 file_link로 이동 추천
    sttx_text: text("sttx_text"),                                  // STT 결과 텍스트(옵션)
    aiex_done: boolean("aiex_done").default(false).notNull(),      // AI 처리 완료 여부

    ...auditCols(),                                                // crea_*/modi_* 감사
  },
  (t) => [
    index("ix_sale_comp_vist").on(t.comp_idno, t.vist_date),                 // 회사별 타임라인
    index("ix_sale_comp_owne_vist").on(t.comp_idno, t.owne_idno, t.vist_date), // 작성자별 타임라인
    index("ix_sale_comp_clie_vist").on(t.comp_idno, t.clie_idno, t.vist_date), // 고객별 타임라인(필요 시)
  ]
);

export type SaleInfo = typeof CRM_SALE.$inferSelect;
export type InsertSaleInfo = typeof CRM_SALE.$inferInsert;