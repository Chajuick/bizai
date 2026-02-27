// server/modules/crm/schedule/schedule.repo.ts

// #region Imports
import { and, asc, desc, eq, gte } from "drizzle-orm";

import { CRM_SCHEDULE } from "../../../../drizzle/schema";
import { getInsertId } from "../../../core/db";
import type { DbOrTx } from "../../../core/db/tx";
// #endregion

// #region Types
type RepoDeps = { db: DbOrTx };

export type ScheduleRow = typeof CRM_SCHEDULE.$inferSelect;
export type ScheduleInsert = typeof CRM_SCHEDULE.$inferInsert;

export type ScheduleUpdate = Partial<
  Omit<
    ScheduleInsert,
    | "comp_idno"
    | "sche_idno"
    | "crea_idno"
    | "crea_date"
  >
>;

type SortField = "modi_date" | "crea_date" | "sche_date";
type SortDir = "asc" | "desc";
// #endregion

// #region Utils
function orderByFor(sort?: { field: SortField; dir: SortDir }) {
  if (!sort) return [desc(CRM_SCHEDULE.sche_date)] as const;

  const dirFn = sort.dir === "asc" ? asc : desc;

  switch (sort.field) {
    case "modi_date":
      return [dirFn(CRM_SCHEDULE.modi_date)] as const;
    case "crea_date":
      return [dirFn(CRM_SCHEDULE.crea_date)] as const;
    case "sche_date":
      return [dirFn(CRM_SCHEDULE.sche_date)] as const;
    default:
      return [desc(CRM_SCHEDULE.sche_date)] as const;
  }
}

function buildWhere(params: {
  comp_idno: number;
  stat_code?: "scheduled" | "completed" | "canceled" | "overdue";
  upcoming?: boolean;
  onlyEnabled?: boolean;
}) {
  const conditions = [eq(CRM_SCHEDULE.comp_idno, params.comp_idno)];

  if (params.onlyEnabled !== false) {
    conditions.push(eq(CRM_SCHEDULE.enab_yesn, true));
  }

  if (params.stat_code) {
    conditions.push(eq(CRM_SCHEDULE.stat_code, params.stat_code));
  }

  if (params.upcoming) {
    conditions.push(gte(CRM_SCHEDULE.sche_date, new Date()));
  }

  return and(...conditions);
}
// #endregion

export const scheduleRepo = {
  // #region list
  async list(
    { db }: RepoDeps,
    params: {
      comp_idno: number;
      stat_code?: "scheduled" | "completed" | "canceled" | "overdue";
      upcoming?: boolean;

      limit: number;
      offset: number;

      sort?: { field: SortField; dir: SortDir };
      onlyEnabled?: boolean;
    }
  ): Promise<ScheduleRow[]> {
    const where = buildWhere(params);
    const orderBy = orderByFor(params.sort);

    return db
      .select()
      .from(CRM_SCHEDULE)
      .where(where)
      .orderBy(...orderBy)
      .limit(params.limit + 1)
      .offset(params.offset);
  },
  // #endregion

  // #region getById
  async getById(
    { db }: RepoDeps,
    params: { comp_idno: number; sche_idno: number; includeDisabled?: boolean }
  ): Promise<ScheduleRow | null> {
    const conditions = [
      eq(CRM_SCHEDULE.comp_idno, params.comp_idno),
      eq(CRM_SCHEDULE.sche_idno, params.sche_idno),
    ];

    if (!params.includeDisabled) {
      conditions.push(eq(CRM_SCHEDULE.enab_yesn, true));
    }

    const [row] = await db
      .select()
      .from(CRM_SCHEDULE)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  },
  // #endregion

  // #region create
  async create({ db }: RepoDeps, data: ScheduleInsert) {
    const res = await db.insert(CRM_SCHEDULE).values(data);
    return { sche_idno: getInsertId(res) };
  },
  // #endregion

  // #region update
  async update(
    { db }: RepoDeps,
    params: { comp_idno: number; sche_idno: number; data: ScheduleUpdate }
  ) {
    await db
      .update(CRM_SCHEDULE)
      .set(params.data)
      .where(
        and(
          eq(CRM_SCHEDULE.comp_idno, params.comp_idno),
          eq(CRM_SCHEDULE.sche_idno, params.sche_idno)
        )
      );
  },
  // #endregion

  // #region disable (soft)
  async disable(
    { db }: RepoDeps,
    params: { comp_idno: number; sche_idno: number; data: ScheduleUpdate }
  ) {
    await db
      .update(CRM_SCHEDULE)
      .set({ ...params.data, enab_yesn: false })
      .where(
        and(
          eq(CRM_SCHEDULE.comp_idno, params.comp_idno),
          eq(CRM_SCHEDULE.sche_idno, params.sche_idno)
        )
      );
  },
  // #endregion
} as const;