import { int, timestamp, primaryKey } from "drizzle-orm/mysql-core";
import { companyCols } from "../common/default";
import { table } from "../common/table";

export const AI_TOKEN_BALANCE = table(
  "AI_TOKEN_BALANCE",
  {
    ...companyCols(),                                            // comp_idno (회사 키)

    bala_tokn: int("bala_tokn").default(0).notNull(),            // 현재 토큰 잔액(캐시)
    modi_date: timestamp("modi_date").onUpdateNow(),             // 잔액 갱신 시각
  },
  (t) => [
    primaryKey({ columns: [t.comp_idno] }),                      // 회사당 1행 고정
  ]
);

export type AiTokenBalance = typeof AI_TOKEN_BALANCE.$inferSelect;
export type InsertAiTokenBalance = typeof AI_TOKEN_BALANCE.$inferInsert;