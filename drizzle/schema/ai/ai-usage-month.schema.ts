import { int, primaryKey, index, timestamp } from "drizzle-orm/mysql-core";
import { aiFeatureEnum } from "../_common/enums";
import { companyCols } from "../_common/default";
import { table } from "../_common/table";

export const AI_USAGE_MONTH = table(
  "AI_USAGE_MONTH",
  {
    ...companyCols(),                                              // comp_idno (회사 키)

    year_mont: int("year_mont").notNull(),                         // 월(YYYYMM)
    feat_code: aiFeatureEnum.notNull(),                            // 기능(chat/stt/llm)
    call_usag: int("call_usag").default(0).notNull(),              // 월 사용 횟수(Free 제한용)

    modi_date: timestamp("modi_date").onUpdateNow(),               // 갱신 시각
  },
  (t) => [
    primaryKey({                                                               // 회사+월+기능 PK
      name: "pk_ai_usage_month",
      columns: [t.comp_idno, t.year_mont, t.feat_code],
    }),          
    index("ix_ai_mo_comp_mont").on(t.comp_idno, t.year_mont),                  // 회사+월 조회
    index("ix_ai_mo_comp_feat_mont").on(t.comp_idno, t.feat_code, t.year_mont) // 회사+기능+월 조회
  ]
);

export type AiUsageMonth = typeof AI_USAGE_MONTH.$inferSelect;
export type InsertAiUsageMonth = typeof AI_USAGE_MONTH.$inferInsert;