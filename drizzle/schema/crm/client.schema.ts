import { int, varchar, text, boolean, index, uniqueIndex } from "drizzle-orm/mysql-core";
import { table } from "../common/table";
import { companyCols, auditCols } from "../common/default";

export const CRM_CLIENT = table(
  "CRM_CLIENT",
  {
    clie_idno: int("clie_idno").autoincrement().primaryKey(),   // 고객 PK
    ...companyCols(),                                           // comp_idno (회사 키)

    clie_name: varchar("clie_name", { length: 200 }).notNull(), // 고객사명
    indu_type: varchar("indu_type", { length: 100 }),           // 업종

    cont_name: varchar("cont_name", { length: 100 }),           // 담당자명
    cont_tele: varchar("cont_tele", { length: 50 }),            // 담당자 연락처
    cont_mail: varchar("cont_mail", { length: 320 }),           // 담당자 이메일

    clie_addr: text("clie_addr"),                               // 주소
    clie_memo: text("clie_memo"),                               // 메모

    enab_yesn: boolean("enab_yesn").default(true).notNull(),    // 활성 여부

    ...auditCols(),                                             // crea_*/modi_* 감사
  },
  (t) => [
    index("ix_client_comp").on(t.comp_idno),                               // 회사 기준 조회
    uniqueIndex("ux_client_comp_name").on(t.comp_idno, t.clie_name),      // 회사 내 고객명 중복 방지
  ]
);

export type Client = typeof CRM_CLIENT.$inferSelect;
export type InsertClient = typeof CRM_CLIENT.$inferInsert;