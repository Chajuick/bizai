import { int, varchar, text, decimal, timestamp, boolean, index } from "drizzle-orm/mysql-core";
import { scheduleStatusEnum } from "../common/enums";
import { companyCols, auditCols } from "../common/default";
import { table } from "../common/table";

export const CRM_SCHEDULE = table(
  "CRM_SCHEDULE",
  {
    sche_idno: int("sche_idno").autoincrement().primaryKey(),        // 약속 PK
    ...companyCols(),                                               // comp_idno (회사 키)

    owne_idno: int("owne_idno").notNull(),                          // 소유자/담당자 user_idno
    sale_idno: int("sale_idno"),                                    // 연결 영업일지(옵션)
    clie_idno: int("clie_idno"),                                    // 연결 고객(옵션)
    clie_name: varchar("clie_name", { length: 200 }),               // 고객명 스냅샷/자유입력

    sche_name: varchar("sche_name", { length: 300 }).notNull(),     // 제목
    sche_desc: text("sche_desc"),                                   // 설명
    sche_pric: decimal("sche_pric", { precision: 15, scale: 2 }),   // 금액(옵션)
    sche_date: timestamp("sche_date").notNull(),                    // 예정 일시

    stat_code: scheduleStatusEnum.default("scheduled").notNull(),   // 상태
    remd_sent: boolean("remd_sent").default(false).notNull(),       // 리마인드 발송 여부
    auto_gene: boolean("auto_gene").default(false).notNull(),       // AI 자동 생성 여부

    enab_yesn: boolean("enab_yesn").default(true).notNull(),        // 활성 여부

    ...auditCols(),                                                 // crea_*/modi_* 감사
  },
  (t) => [
    // 회사 기준 전체 일정 타임라인(최신순)
    index("ix_sche_comp_date").on(t.comp_idno, t.sche_date),

    // 담당자 기준 일정 타임라인(회사 내)
    index("ix_sche_comp_owne_date").on(t.comp_idno, t.owne_idno, t.sche_date),

    // 고객 기준 일정 조회(회사 내) - clie_idno를 실제로 쓸 거면 강추
    index("ix_sche_comp_clie_date").on(t.comp_idno, t.clie_idno, t.sche_date),
  ]
);

export type Schedule = typeof CRM_SCHEDULE.$inferSelect;
export type InsertSchedule = typeof CRM_SCHEDULE.$inferInsert;