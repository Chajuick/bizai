import { int, varchar, text, boolean, index, uniqueIndex } from "drizzle-orm/mysql-core";
import { table } from "../common/table";
import { companyCols, auditCols } from "../common/default";

export const CRM_CLIENT_CONT = table(
  "CRM_CLIENT_CONT",
  {
    cont_idno: int("cont_idno").autoincrement().primaryKey(), // 담당자 PK
    ...companyCols(), // comp_idno

    clie_idno: int("clie_idno").notNull(), // 고객사 PK(FK 논리키)

    cont_name: varchar("cont_name", { length: 100 }).notNull(), // 담당자명
    cont_role: varchar("cont_role", { length: 100 }),           // 직함/직책
    cont_tele: varchar("cont_tele", { length: 50 }),            // 연락처
    cont_mail: varchar("cont_mail", { length: 320 }),           // 이메일
    cont_memo: text("cont_memo"),                               // 담당자 메모

    main_yesn: boolean("main_yesn").default(false).notNull(),   // 대표 담당자 여부
    enab_yesn: boolean("enab_yesn").default(true).notNull(),    // 활성 여부(소프트 삭제)

    ...auditCols(),
  },
  (t) => [
    // 조회 최적화
    index("ix_cont_comp_client").on(t.comp_idno, t.clie_idno),
    index("ix_cont_comp_name").on(t.comp_idno, t.cont_name),

    // 중복 방지(연락처/이메일 기반)
    uniqueIndex("ux_cont_comp_client_mail").on(t.comp_idno, t.clie_idno, t.cont_mail),
    uniqueIndex("ux_cont_comp_client_tele").on(t.comp_idno, t.clie_idno, t.cont_tele),
  ]
);

export type ClientContact = typeof CRM_CLIENT_CONT.$inferSelect;
export type InsertClientContact = typeof CRM_CLIENT_CONT.$inferInsert;