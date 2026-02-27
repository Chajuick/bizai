import { int, varchar, uniqueIndex } from "drizzle-orm/mysql-core";
import { planCodeEnum } from "../common/enums";
import { auditColsNoUser } from "../common/default";
import { table } from "../common/table";

export const BILLING_PLAN = table(
  "BILLING_PLAN",
  {
    plan_idno: int("plan_idno").autoincrement().primaryKey(),     // 플랜 PK
    plan_code: planCodeEnum.notNull(),                             // 플랜 코드(free/pro/team/enterprise)
    plan_name: varchar("plan_name", { length: 80 }).notNull(),     // 플랜 표시명

    seat_limt: int("seat_limt").notNull(),                         // 좌석 제한(기본)
    tokn_mont: int("tokn_mont").notNull(),                          // 월 제공 AI 토큰(기본)

    ...auditColsNoUser(),                                           // crea_date / modi_date
  },
  (t) => [
    uniqueIndex("ux_billing_plan_code").on(t.plan_code),      // 코드 유니크
  ]
);

export type Plan = typeof BILLING_PLAN.$inferSelect;
export type InsertPlan = typeof BILLING_PLAN.$inferInsert;