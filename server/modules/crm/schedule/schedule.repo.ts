// server/modules/crm/schedule/schedule.repo.ts

// #region Imports
import { and, asc, desc, eq, gte, lt, or, sql } from "drizzle-orm";

import { CRM_SCHEDULE } from "../../../../drizzle/schema";
import { getInsertId } from "../../../core/db";
import type { DbOrTx } from "../../../core/db/tx";
// #endregion

// #region Types
type RepoDeps = { db: DbOrTx };

export type ScheduleRow = typeof CRM_SCHEDULE.$inferSelect;
export type ScheduleInsert = typeof CRM_SCHEDULE.$inferInsert;

export type ScheduleUpdate = Partial<
  Omit<ScheduleInsert, "comp_idno" | "sche_idno" | "crea_idno" | "crea_date">
>;

type SortField = "modi_date" | "crea_date" | "sche_date";
type SortDir = "asc" | "desc";

/** 탭별 쿼리에 필요한 시간 경계값 (service에서 계산해서 전달) */
export type TabFilter = {
  type: "all" | "scheduled" | "overdue" | "imminent" | "completed" | "canceled";
  now: Date;
  kstMidnight: Date;
  imminentEnd: Date;
};
// #endregion

// #region Utils

function baseEnabledWhere(comp_idno: number, onlyEnabled?: boolean) {
  const conditions = [eq(CRM_SCHEDULE.comp_idno, comp_idno)];
  if (onlyEnabled !== false) conditions.push(eq(CRM_SCHEDULE.enab_yesn, true));
  return and(...conditions);
}

function buildTabWhere(comp_idno: number, tab: TabFilter) {
  const base = [eq(CRM_SCHEDULE.comp_idno, comp_idno), eq(CRM_SCHEDULE.enab_yesn, true)];

  switch (tab.type) {
    case "overdue":
      // sche_stat='scheduled' AND sche_date < KST 자정
      return and(...base, eq(CRM_SCHEDULE.sche_stat, "scheduled"), lt(CRM_SCHEDULE.sche_date, tab.kstMidnight));

    case "imminent":
      // sche_stat='scheduled' AND now <= sche_date < now+48h
      return and(
        ...base,
        eq(CRM_SCHEDULE.sche_stat, "scheduled"),
        gte(CRM_SCHEDULE.sche_date, tab.now),
        lt(CRM_SCHEDULE.sche_date, tab.imminentEnd)
      );

    case "scheduled":
      // sche_stat='scheduled', overdue/imminent 제외
      // = sche_date >= kstMidnight AND (sche_date < now OR sche_date >= imminentEnd)
      return and(
        ...base,
        eq(CRM_SCHEDULE.sche_stat, "scheduled"),
        gte(CRM_SCHEDULE.sche_date, tab.kstMidnight),
        or(lt(CRM_SCHEDULE.sche_date, tab.now), gte(CRM_SCHEDULE.sche_date, tab.imminentEnd))
      );

    case "completed":
      return and(...base, eq(CRM_SCHEDULE.sche_stat, "completed"));

    case "canceled":
      return and(...base, eq(CRM_SCHEDULE.sche_stat, "canceled"));

    case "all":
    default:
      return and(...base);
  }
}

function buildTabOrderBy(tab: TabFilter, sort?: { field: SortField; dir: SortDir }) {
  // 명시적 정렬 파라미터가 있으면 우선 적용
  if (sort) {
    const dirFn = sort.dir === "asc" ? asc : desc;
    switch (sort.field) {
      case "modi_date": return [dirFn(CRM_SCHEDULE.modi_date)];
      case "crea_date": return [dirFn(CRM_SCHEDULE.crea_date)];
      case "sche_date": return [dirFn(CRM_SCHEDULE.sche_date)];
      default: return [desc(CRM_SCHEDULE.sche_date)];
    }
  }

  switch (tab.type) {
    case "overdue":
    case "imminent":
    case "scheduled":
      // 날짜 오름차순: 가장 임박/지연된 항목 먼저
      return [asc(CRM_SCHEDULE.sche_date)];

    case "completed":
    case "canceled":
      // 최신순
      return [desc(CRM_SCHEDULE.sche_date)];

    case "all":
    default:
      // 우선순위: overdue(0) → imminent(1) → rest(2), 2차 날짜 오름차순
      return [
        sql`CASE
          WHEN ${CRM_SCHEDULE.sche_stat} = 'scheduled' AND ${CRM_SCHEDULE.sche_date} < ${tab.kstMidnight} THEN 0
          WHEN ${CRM_SCHEDULE.sche_stat} = 'scheduled' AND ${CRM_SCHEDULE.sche_date} >= ${tab.now} AND ${CRM_SCHEDULE.sche_date} < ${tab.imminentEnd} THEN 1
          ELSE 2
        END`,
        asc(CRM_SCHEDULE.sche_date),
      ];
  }
}

// #endregion

export const scheduleRepo = {
  // #region list
  async list(
    { db }: RepoDeps,
    params: {
      comp_idno: number;
      tab: TabFilter;
      limit: number;
      offset: number;
      sort?: { field: SortField; dir: SortDir };
    }
  ): Promise<ScheduleRow[]> {
    const where = buildTabWhere(params.comp_idno, params.tab);
    const orderBy = buildTabOrderBy(params.tab, params.sort);

    return db
      .select()
      .from(CRM_SCHEDULE)
      .where(where)
      .orderBy(...(orderBy as any[]))
      .limit(params.limit + 1)
      .offset(params.offset);
  },
  // #endregion

  // #region countByStatus
  async countByStatus(
    { db }: RepoDeps,
    params: { comp_idno: number; onlyEnabled?: boolean }
  ): Promise<Record<"scheduled" | "completed" | "canceled", number>> {
    const where = baseEnabledWhere(params.comp_idno, params.onlyEnabled);

    const rows = await db
      .select({
        sche_stat: CRM_SCHEDULE.sche_stat,
        cnt: sql<number>`count(*)`.mapWith(Number),
      })
      .from(CRM_SCHEDULE)
      .where(
        and(
          where,
          // ✅ overdue는 DB status로 쓰지 않는다는 전제 (현재 정책상 scheduled/completed/canceled만 세면 됨)
          sql`${CRM_SCHEDULE.sche_stat} in ('scheduled','completed','canceled')`
        )
      )
      .groupBy(CRM_SCHEDULE.sche_stat);

    const out: Record<"scheduled" | "completed" | "canceled", number> = {
      scheduled: 0,
      completed: 0,
      canceled: 0,
    };

    for (const r of rows) {
      if (r.sche_stat === "scheduled") out.scheduled = r.cnt;
      if (r.sche_stat === "completed") out.completed = r.cnt;
      if (r.sche_stat === "canceled") out.canceled = r.cnt;
    }

    return out;
  },
  // #endregion

  // #region countScheduledBefore (overdue)
  async countScheduledBefore(
    { db }: RepoDeps,
    params: { comp_idno: number; before: Date; onlyEnabled?: boolean }
  ): Promise<number> {
    const where = baseEnabledWhere(params.comp_idno, params.onlyEnabled);

    const [row] = await db
      .select({ cnt: sql<number>`count(*)`.mapWith(Number) })
      .from(CRM_SCHEDULE)
      .where(
        and(
          where,
          eq(CRM_SCHEDULE.sche_stat, "scheduled"),
          lt(CRM_SCHEDULE.sche_date, params.before)
        )
      )
      .limit(1);

    return row?.cnt ?? 0;
  },
  // #endregion

  // #region countScheduledBetween (imminent)
  async countScheduledBetween(
    { db }: RepoDeps,
    params: { comp_idno: number; from: Date; to: Date; onlyEnabled?: boolean }
  ): Promise<number> {
    const where = baseEnabledWhere(params.comp_idno, params.onlyEnabled);

    const [row] = await db
      .select({ cnt: sql<number>`count(*)`.mapWith(Number) })
      .from(CRM_SCHEDULE)
      .where(
        and(
          where,
          eq(CRM_SCHEDULE.sche_stat, "scheduled"),
          gte(CRM_SCHEDULE.sche_date, params.from),
          // to는 inclusive 처리를 원하면 lt 대신 <= 구현 필요
          lt(CRM_SCHEDULE.sche_date, params.to)
        )
      )
      .limit(1);

    return row?.cnt ?? 0;
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

    const [row] = await db.select().from(CRM_SCHEDULE).where(and(...conditions)).limit(1);
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
  async update({ db }: RepoDeps, params: { comp_idno: number; sche_idno: number; data: ScheduleUpdate }) {
    await db
      .update(CRM_SCHEDULE)
      .set(params.data)
      .where(and(eq(CRM_SCHEDULE.comp_idno, params.comp_idno), eq(CRM_SCHEDULE.sche_idno, params.sche_idno)));
  },
  // #endregion

  // #region disable (soft)
  async disable({ db }: RepoDeps, params: { comp_idno: number; sche_idno: number; data: ScheduleUpdate }) {
    await db
      .update(CRM_SCHEDULE)
      .set({ ...params.data, enab_yesn: false })
      .where(and(eq(CRM_SCHEDULE.comp_idno, params.comp_idno), eq(CRM_SCHEDULE.sche_idno, params.sche_idno)));
  },
  // #endregion
} as const;