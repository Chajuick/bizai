import {
  int,
  varchar,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

import { companyCols, auditCols } from "../common/default";
import { companyRoleEnum, inviteKindEnum, inviteStatusEnum } from "../common/enums";
import { table } from "../common/table";

export const CORE_COMPANY_INVITE = table(
  "CORE_COMPANY_INVITE",
  {
    ...companyCols(), // comp_idno

    invt_idno: int("invt_idno").autoincrement().primaryKey(), // 초대 PK

    kind_code: inviteKindEnum.notNull(),                      // link | email
    stat_code: inviteStatusEnum.default("active").notNull(),  // active | used | revoked | expired

    // 링크/메일 공통 토큰 (서버에서 랜덤 생성)
    token_key: varchar("token_key", { length: 128 }).notNull(),

    // 이메일 초대일 때만 설정(링크 초대면 null)
    mail_idno: varchar("mail_idno", { length: 320 }),

    // 수락 시 부여할 역할
    role_code: companyRoleEnum.default("member").notNull(),

    // 만료 시간 (Pro 링크는 24h로 서버에서 설정)
    expi_date: timestamp("expi_date").notNull(),

    // 사용 처리(수락 완료)
    used_date: timestamp("used_date"),
    used_user: int("used_user"), // 수락한 user_idno

    ...auditCols(), // crea_idno/crea_date/modi_idno/modi_date
  },
  (t) => [
    uniqueIndex("ux_company_invite_token").on(t.token_key),
    index("ix_company_invite_comp_stat").on(t.comp_idno, t.stat_code),
    index("ix_company_invite_mail").on(t.mail_idno),
    index("ix_company_invite_expi").on(t.expi_date),
  ]
);

export type CompanyInvite = typeof CORE_COMPANY_INVITE.$inferSelect;
export type InsertCompanyInvite = typeof CORE_COMPANY_INVITE.$inferInsert;