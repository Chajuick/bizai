import { int, varchar, json, timestamp, index } from "drizzle-orm/mysql-core";
import { aiFeatureEnum, ledgerReasonEnum } from "../common/enums";
import { companyCols } from "../common/default";
import { table } from "../common/table";

export const AI_TOKEN_LEDGER = table(
  "AI_TOKEN_LEDGER",
  {
    ldgr_idno: int("ldgr_idno").autoincrement().primaryKey(),     // 원장 PK
    ...companyCols(),                                            // comp_idno (회사 키)

    actv_user: int("actv_user"),                                 // 사용 주체(사용자) (nullable)
    resn_code: ledgerReasonEnum.notNull(),                       // 원장 사유(월지급/차감/충전 등)
    feat_code: aiFeatureEnum,                                    // 기능(chat/stt/llm) (nullable: 차감일 때만)

    delt_tokn: int("delt_tokn").notNull(),                       // 토큰 변화량(+충전 / -차감)
    year_mont: int("year_mont").notNull(),                       // 월(집계/월지급 트래킹) ex) 202602

    refe_type: varchar("refe_type", { length: 40 }),             // 참조 타입(예: sale_info 등)
    refe_idno: int("refe_idno"),                                 // 참조 ID

    meta_json: json("meta_json"),                                // 상세 메타({tokensIn,tokensOut,model...})
    crea_date: timestamp("crea_date").defaultNow().notNull(),    // 발생 시각(생성 시각)
  },
  (t) => [
    index("ix_ai_ledger_comp_crea").on(t.comp_idno, t.crea_date), // 회사별 시간순 조회(최신 N개)
    index("ix_ai_ledger_comp_mont").on(t.comp_idno, t.year_mont), // 회사별 월 집계/조회
    index("ix_ai_ledger_comp_user").on(t.comp_idno, t.actv_user), // 회사+사용자 기준 조회
  ]
);

export type AiTokenLedger = typeof AI_TOKEN_LEDGER.$inferSelect;
export type InsertAiTokenLedger = typeof AI_TOKEN_LEDGER.$inferInsert;