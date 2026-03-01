// server/modules/ai/ai.repo.ts

import { and, eq, sql, sum } from "drizzle-orm";
import { AI_USAGE_EVENT, CORE_FILE } from "../../../drizzle/schema";
import type { InsertAiUsageEvent, CoreFile } from "../../../drizzle/schema";
import type { DbOrTx } from "../../core/db/tx";

type RepoDeps = { db: DbOrTx };

export const aiRepo = {
  // ───── CORE_FILE ─────

  async findFileById({ db }: RepoDeps, file_idno: number): Promise<CoreFile | null> {
    const rows = await db
      .select()
      .from(CORE_FILE)
      .where(eq(CORE_FILE.file_idno, file_idno))
      .limit(1);
    return rows[0] ?? null;
  },

  // ───── AI_USAGE_EVENT ─────

  async recordUsageEvent({ db }: RepoDeps, data: InsertAiUsageEvent): Promise<void> {
    await db.insert(AI_USAGE_EVENT).values(data);
  },

  async getMonthlyUsage(
    { db }: RepoDeps,
    comp_idno: number,
    year: number,
    month: number,
  ): Promise<{ total: number; chat: number; stt: number; llm: number }> {
    const rows = await db
      .select({
        feat_code: AI_USAGE_EVENT.feat_code,
        total: sum(AI_USAGE_EVENT.tokn_tota),
      })
      .from(AI_USAGE_EVENT)
      .where(
        and(
          eq(AI_USAGE_EVENT.comp_idno, comp_idno),
          sql`YEAR(${AI_USAGE_EVENT.crea_date}) = ${year}`,
          sql`MONTH(${AI_USAGE_EVENT.crea_date}) = ${month}`,
        ),
      )
      .groupBy(AI_USAGE_EVENT.feat_code);

    let chat = 0, stt = 0, llm = 0;
    for (const row of rows) {
      const val = Number(row.total ?? 0);
      if (row.feat_code === "chat") chat = val;
      else if (row.feat_code === "stt") stt = val;
      else if (row.feat_code === "llm") llm = val;
    }

    return { total: chat + stt + llm, chat, stt, llm };
  },
};
