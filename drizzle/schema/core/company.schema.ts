import { int, varchar, index, uniqueIndex, tinyint } from "drizzle-orm/mysql-core";
import { auditColsNoUser } from "../common/default";
import { table } from "../common/table";

export const CORE_COMPANY = table(
  "CORE_COMPANY",
  {
    comp_idno: int("comp_idno").autoincrement().primaryKey(),
    comp_name: varchar("comp_name", { length: 200 }).notNull(),

    // 사업자번호: PK 말고 UNIQUE 권장
    bizn_numb: varchar("bizn_numb", { length: 10 }).notNull(),

    // MVP 정책 컬럼(빠른 방식 - 추후 필요시 policy 테이블 별도 생성)
    need_appr: tinyint("need_appr").default(0).notNull(),        // 승인 필요(0/1)
    mail_doma: varchar("mail_doma", { length: 120 }),        // 도메인 제한(없으면 null)
    link_yesn: tinyint("link_yesn").default(1).notNull(),  // 링크 초대 허용
    mail_yesn: tinyint("mail_yesn").default(0).notNull(),  // 이메일 초대 허용

    ...auditColsNoUser(),
  },
  (t) => [
    index("ix_company_name").on(t.comp_name),
    uniqueIndex("ux_company_bizn_numb").on(t.bizn_numb),
    index("ix_company_mail_domain").on(t.mail_doma),
  ]
);

export type Company = typeof CORE_COMPANY.$inferSelect;
export type InsertCompany = typeof CORE_COMPANY.$inferInsert;