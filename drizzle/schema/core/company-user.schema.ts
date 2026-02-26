import { int, primaryKey, index } from "drizzle-orm/mysql-core";
import { companyRoleEnum, memberStatusEnum } from "../_common/enums";
import { companyCols, auditCols } from "../_common/default";
import { table } from "../_common/table";

export const CORE_COMPANY_USER = table(
  "CORE_COMPANY_USER",
  {
    ...companyCols(), // comp_idno

    user_idno: int("user_idno").notNull(), // 사용자 FK(논리)
    role_code: companyRoleEnum.default("member").notNull(), // owner/admin/member

    // ✅ 승인 필요 플로우 지원
    status_code: memberStatusEnum.default("active").notNull(), // active | pending | removed

    ...auditCols(), // crea_idno/crea_date/modi_idno/modi_date
  },
  (t) => [
    primaryKey({
      name: "pk_core_company_user",
      columns: [t.comp_idno, t.user_idno],
    }),
    index("ix_core_company_user_user").on(t.user_idno),
    index("ix_core_company_user_comp").on(t.comp_idno),
    index("ix_core_company_user_status").on(t.comp_idno, t.status_code),
  ]
);

export type CompUser = typeof CORE_COMPANY_USER.$inferSelect;
export type InsertCompUser = typeof CORE_COMPANY_USER.$inferInsert;