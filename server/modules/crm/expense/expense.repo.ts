// server/modules/crm/expense/expense.repo.ts

import { and, desc, eq, like, gte, lte, count } from "drizzle-orm";
import { CRM_EXPENSE } from "../../../../drizzle/schema";
import { getInsertId } from "../../../core/db";
import type { DbOrTx } from "../../../core/db/tx";

type RepoDeps = { db: DbOrTx };

export type ExpenseRow = typeof CRM_EXPENSE.$inferSelect;
export type ExpenseInsert = typeof CRM_EXPENSE.$inferInsert;

export const expenseRepo = {
  // #region list
  async list(
    { db }: RepoDeps,
    params: {
      comp_idno: number;
      clie_idno?: number;
      expe_type?: string;
      recr_type?: string;
      search?: string;
      limit: number;
      offset: number;
    }
  ): Promise<ExpenseRow[]> {
    const conditions = [
      eq(CRM_EXPENSE.comp_idno, params.comp_idno),
      eq(CRM_EXPENSE.enab_yesn, true),
    ];

    if (params.clie_idno) conditions.push(eq(CRM_EXPENSE.clie_idno, params.clie_idno));
    if (params.expe_type) conditions.push(eq(CRM_EXPENSE.expe_type, params.expe_type));
    if (params.recr_type) conditions.push(eq(CRM_EXPENSE.recr_type, params.recr_type));
    if (params.search) conditions.push(like(CRM_EXPENSE.expe_name, `%${params.search}%`));

    return db
      .select()
      .from(CRM_EXPENSE)
      .where(and(...conditions))
      .orderBy(desc(CRM_EXPENSE.expe_date), desc(CRM_EXPENSE.expe_idno))
      .limit(params.limit + 1)
      .offset(params.offset);
  },
  // #endregion

  // #region getById
  async getById(
    { db }: RepoDeps,
    params: { comp_idno: number; expe_idno: number }
  ): Promise<ExpenseRow | null> {
    const [row] = await db
      .select()
      .from(CRM_EXPENSE)
      .where(
        and(
          eq(CRM_EXPENSE.comp_idno, params.comp_idno),
          eq(CRM_EXPENSE.expe_idno, params.expe_idno),
          eq(CRM_EXPENSE.enab_yesn, true)
        )
      )
      .limit(1);
    return row ?? null;
  },
  // #endregion

  // #region create
  async create({ db }: RepoDeps, data: ExpenseInsert): Promise<{ expe_idno: number }> {
    const res = await db.insert(CRM_EXPENSE).values(data);
    return { expe_idno: getInsertId(res) };
  },
  // #endregion

  // #region update
  async update(
    { db }: RepoDeps,
    params: { comp_idno: number; expe_idno: number; data: Partial<ExpenseInsert> }
  ): Promise<void> {
    await db
      .update(CRM_EXPENSE)
      .set(params.data)
      .where(
        and(
          eq(CRM_EXPENSE.comp_idno, params.comp_idno),
          eq(CRM_EXPENSE.expe_idno, params.expe_idno),
          eq(CRM_EXPENSE.enab_yesn, true)
        )
      );
  },
  // #endregion

  // #region disable (soft delete)
  async disable(
    { db }: RepoDeps,
    params: { comp_idno: number; expe_idno: number; modi_idno: number }
  ): Promise<void> {
    await db
      .update(CRM_EXPENSE)
      .set({ enab_yesn: false, modi_idno: params.modi_idno, modi_date: new Date() })
      .where(
        and(
          eq(CRM_EXPENSE.comp_idno, params.comp_idno),
          eq(CRM_EXPENSE.expe_idno, params.expe_idno)
        )
      );
  },
  // #endregion

  // #region sumByClient
  async sumByClient(
    { db }: RepoDeps,
    params: { comp_idno: number; clie_idno: number }
  ): Promise<number> {
    const rows = await db
      .select({ expe_amnt: CRM_EXPENSE.expe_amnt })
      .from(CRM_EXPENSE)
      .where(
        and(
          eq(CRM_EXPENSE.comp_idno, params.comp_idno),
          eq(CRM_EXPENSE.clie_idno, params.clie_idno),
          eq(CRM_EXPENSE.enab_yesn, true)
        )
      );
    return rows.reduce((sum, r) => sum + Number(r.expe_amnt || 0), 0);
  },
  // #endregion

  // #region listRecurring (반복 지출 워커용)
  async listRecurring(
    { db }: RepoDeps,
    params: { comp_idno?: number; before?: Date }
  ): Promise<ExpenseRow[]> {
    const conditions = [
      eq(CRM_EXPENSE.enab_yesn, true),
    ];

    if (params.comp_idno) conditions.push(eq(CRM_EXPENSE.comp_idno, params.comp_idno));

    // recr_type != 'none'
    // We filter in JS for simplicity (list will be small)
    const rows = await db
      .select()
      .from(CRM_EXPENSE)
      .where(and(...conditions));

    return rows.filter((r) => r.recr_type && r.recr_type !== "none");
  },
  // #endregion
} as const;
