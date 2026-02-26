import { int, varchar, text, decimal, timestamp, index } from "drizzle-orm/mysql-core";
import { shipStatusEnum } from "../_common/enums";
import { companyCols, auditCols } from "../_common/default";
import { table } from "../_common/table";

export const CRM_SHIPMENT = table(
  "CRM_SHIPMENT",
  {
    ship_idno: int("ship_idno").autoincrement().primaryKey(),        // 납품/매출 PK
    ...companyCols(),                                                // comp_idno (회사 키)

    owne_idno: int("owne_idno").notNull(),                           // 담당자 user_idno
    orde_idno: int("orde_idno").notNull(),                           // 수주 ID(필수)
    clie_name: varchar("clie_name", { length: 200 }).notNull(),      // 고객명 스냅샷

    stat_code: shipStatusEnum.default("pending").notNull(),          // 상태(pending/delivered/invoiced/paid)
    ship_date: timestamp("ship_date"),                               // 납품일(옵션)
    ship_pric: decimal("ship_pric", { precision: 15, scale: 2 }).notNull(), // 매출 금액
    ship_memo: text("ship_memo"),                                    // 메모

    ...auditCols(),                                                  // crea_*/modi_* 감사
  },
  (t) => [
    index("ix_ship_comp").on(t.comp_idno),                           // 회사 기준 조회(기본)
    index("ix_ship_comp_orde").on(t.comp_idno, t.orde_idno),         // 회사+수주 기준 조회
    index("ix_ship_comp_stat").on(t.comp_idno, t.stat_code),         // 회사+상태 필터
    index("ix_ship_comp_owne").on(t.comp_idno, t.owne_idno),         // 회사+담당자 필터
    index("ix_ship_comp_date").on(t.comp_idno, t.ship_date),         // 회사+납품일 정렬/조회
  ]
);

export type Shipment = typeof CRM_SHIPMENT.$inferSelect;
export type InsertShipment = typeof CRM_SHIPMENT.$inferInsert;