import { int, varchar, json, timestamp, index } from "drizzle-orm/mysql-core";
import { aiFeatureEnum } from "../common/enums";
import { companyCols } from "../common/default";
import { table } from "../common/table";

export const AI_USAGE_EVENT = table(
  "AI_USAGE_EVENT",
  {
    evnt_idno: int("evnt_idno").autoincrement().primaryKey(),      // 이벤트 PK
    ...companyCols(),                                             // comp_idno (회사 키)

    user_idno: int("user_idno").notNull(),                        // 사용 사용자 ID
    feat_code: aiFeatureEnum.notNull(),                           // 기능(chat/stt/llm)

    mode_name: varchar("mode_name", { length: 80 }),              // 모델명
    tokn_inpt: int("tokn_inpt").default(0).notNull(),             // 입력 토큰
    tokn_outs: int("tokn_outs").default(0).notNull(),             // 출력 토큰
    tokn_tota: int("tokn_tota").default(0).notNull(),             // 합계 토큰

    meta_json: json("meta_json"),                                 // 상세 메타(stt면 audioSeconds 등)
    crea_date: timestamp("crea_date").defaultNow().notNull(),     // 이벤트 발생 시각
  },
  (t) => [
    index("ix_ai_event_comp_crea").on(t.comp_idno, t.crea_date),                 // 회사별 최신 이벤트
    index("ix_ai_event_comp_user_crea").on(t.comp_idno, t.user_idno, t.crea_date), // 회사+사용자 타임라인
    index("ix_ai_event_comp_feat_crea").on(t.comp_idno, t.feat_code, t.crea_date), // 회사+기능별 추적
  ]
);

export type AiUsageEvent = typeof AI_USAGE_EVENT.$inferSelect;
export type InsertAiUsageEvent = typeof AI_USAGE_EVENT.$inferInsert;