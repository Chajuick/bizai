import { int, varchar, timestamp, index, uniqueIndex } from "drizzle-orm/mysql-core";
import { subStatusEnum } from "../common/enums";
import { companyCols, auditCols } from "../common/default";
import { table } from "../common/table";

export const BILLING_SUBSCRIPTION = table(
  "BILLING_SUBSCRIPTION",
  {
    subs_idno: int("subs_idno").autoincrement().primaryKey(),  // 구독 PK
    ...companyCols(),                                          // comp_idno (회사 키)

    plan_idno: int("plan_idno").notNull(),                     // 적용 플랜 ID
    subs_stat: subStatusEnum.default("active").notNull(),      // 구독 상태(active/trialing/canceled/past_due/inactive)

    prov_name: varchar("prov_name", { length: 40 }),           // 결제 프로바이더(예: stripe)
    prov_subs: varchar("prov_subs", { length: 120 }),          // 프로바이더 구독 ID

    seat_ovrr: int("seat_ovrr"),                               // 좌석 수 override(엔터프라이즈 커스텀)
    tokn_ovrr: int("tokn_ovrr"),                               // 월 AI 토큰 override

    star_date: timestamp("star_date").notNull(),               // 현재 결제기간 시작
    ends_date: timestamp("ends_date").notNull(),               // 현재 결제기간 종료

    ...auditCols(),                                            // crea_idno/crea_date/modi_idno/modi_date
  },
  (t) => [
    index("ix_billing_sub_comp").on(t.comp_idno),                        // 회사 기준 조회
    index("ix_billing_sub_plan").on(t.plan_idno),                         // 플랜 기준 조회
    index("ix_billing_sub_stat").on(t.comp_idno, t.subs_stat),            // 회사 + 상태 조회
    index("ix_billing_sub_comp_stat_end").on(t.comp_idno, t.subs_stat, t.ends_date), // 활성 구독 탐색 최적화

    uniqueIndex("ux_billing_sub_prov").on(t.prov_name, t.prov_subs),      // 프로바이더 구독ID 중복 방지
  ]
);

export type Subscription = typeof BILLING_SUBSCRIPTION.$inferSelect;
export type InsertSubscription = typeof BILLING_SUBSCRIPTION.$inferInsert;