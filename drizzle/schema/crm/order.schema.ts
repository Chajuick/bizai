import { int, varchar, text, decimal, timestamp, index, boolean } from "drizzle-orm/mysql-core";
import { orderStatusEnum } from "../common/enums";
import { companyCols, auditCols } from "../common/default";
import { table } from "../common/table";

export const CRM_ORDER = table(
  "CRM_ORDER",
  {
    orde_idno: int("orde_idno").autoincrement().primaryKey(),        // 수주 PK
    ...companyCols(),                                                // comp_idno (회사 키)

    owne_idno: int("owne_idno").notNull(),                           // 담당자 user_idno
    clie_idno: int("clie_idno"),                                     // 고객 ID(옵션)
    sale_idno: int("sale_idno"),                                     // 영업일지 ID(옵션)

    clie_name: varchar("clie_name", { length: 200 }).notNull(),      // 고객명(스냅샷/자유입력) *필수
    prod_serv: varchar("prod_serv", { length: 300 }).notNull(),      // 제품/서비스명
    orde_pric: decimal("orde_pric", { precision: 15, scale: 2 }).notNull(), // 수주 금액

    stat_code: orderStatusEnum.default("proposal").notNull(),        // 단계(제안/협상/확정/취소)

    ctrt_date: timestamp("ctrt_date"),                               // 계약일(옵션)
    expd_date: timestamp("expd_date"),                               // 예상 납기(옵션)
    orde_memo: text("orde_memo"),                                    // 메모

    enab_yesn: boolean("enab_yesn").default(true).notNull(),         // 활성 여부

    ...auditCols(),                                                  // crea_*/modi_* 감사
  },
  (t) => [
    index("ix_ord_comp").on(t.comp_idno),                            // 회사 기준 조회(기본)
    index("ix_ord_comp_stat").on(t.comp_idno, t.stat_code),          // 회사+상태 필터
    index("ix_ord_comp_owne").on(t.comp_idno, t.owne_idno),          // 회사+담당자 필터

    // 화면/조회가 있으면 유용(없으면 빼도 됨)
    index("ix_ord_comp_ctrt").on(t.comp_idno, t.ctrt_date),          // 회사+계약일
    index("ix_ord_comp_expd").on(t.comp_idno, t.expd_date),          // 회사+예상납기
  ]
);

export type Order = typeof CRM_ORDER.$inferSelect;
export type InsertOrder = typeof CRM_ORDER.$inferInsert;