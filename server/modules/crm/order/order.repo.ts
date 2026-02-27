// server/modules/crm/order/order.repo.ts

// #region Imports
import { and, asc, desc, eq, like } from "drizzle-orm";

import { CRM_ORDER } from "../../../../drizzle/schema";
import { getInsertId } from "../../../core/db";
import type { DbOrTx } from "../../../core/db/tx";
// #endregion

// #region Types
type RepoDeps = { db: DbOrTx };

export type OrderRow = typeof CRM_ORDER.$inferSelect;
export type OrderInsert = typeof CRM_ORDER.$inferInsert;

export type OrderUpdate = Partial<
  Omit<
    OrderInsert,
    | "comp_idno"
    | "orde_idno"
    | "crea_idno"
    | "crea_date"
  >
>;

type SortField = "modi_date" | "crea_date" | "ctrt_date" | "expd_date";
type SortDir = "asc" | "desc";
// #endregion

// #region Utils
function orderByFor(sort?: { field: SortField; dir: SortDir }) {
  if (!sort) return [desc(CRM_ORDER.crea_date)] as const;
  const dirFn = sort.dir === "asc" ? asc : desc;

  switch (sort.field) {
    case "modi_date":
      return [dirFn(CRM_ORDER.modi_date)] as const;
    case "crea_date":
      return [dirFn(CRM_ORDER.crea_date)] as const;
    case "ctrt_date":
      return [dirFn(CRM_ORDER.ctrt_date)] as const;
    case "expd_date":
      return [dirFn(CRM_ORDER.expd_date)] as const;
    default:
      return [desc(CRM_ORDER.crea_date)] as const;
  }
}

function buildWhere(params: {
  comp_idno: number;
  status?: "proposal" | "negotiation" | "confirmed" | "canceled";
  search?: string;
  onlyEnabled?: boolean;
}) {
  const conditions = [eq(CRM_ORDER.comp_idno, params.comp_idno)];

  if (params.onlyEnabled !== false) {
    conditions.push(eq(CRM_ORDER.enab_yesn, true));
  }

  if (params.status) {
    conditions.push(eq(CRM_ORDER.stat_code, params.status));
  }

  if (params.search) {
    // 검색어는 화면 요구대로: 고객명/제품명 중심
    conditions.push(
      like(CRM_ORDER.clie_name, `%${params.search}%`)
    );
    // NOTE: prod_serv까지 OR로 묶고 싶으면 sql/or 사용 필요
    // 지금은 확실히 "한 개 조건"만 걸어도 되고, 추후 확장 가능
  }

  return and(...conditions);
}
// #endregion

export const orderRepo = {
  // #region list
  async list(
    { db }: RepoDeps,
    params: {
      comp_idno: number;
      status?: "proposal" | "negotiation" | "confirmed" | "canceled";
      search?: string;

      limit: number;
      offset: number;

      sort?: { field: SortField; dir: SortDir };
      onlyEnabled?: boolean;
    }
  ): Promise<OrderRow[]> {
    const where = buildWhere(params);
    const orderBy = orderByFor(params.sort);

    return db
      .select()
      .from(CRM_ORDER)
      .where(where)
      .orderBy(...orderBy)
      .limit(params.limit + 1)
      .offset(params.offset);
  },
  // #endregion

  // #region getById
  async getById(
    { db }: RepoDeps,
    params: { comp_idno: number; orde_idno: number; includeDisabled?: boolean }
  ): Promise<OrderRow | null> {
    const conditions = [
      eq(CRM_ORDER.comp_idno, params.comp_idno),
      eq(CRM_ORDER.orde_idno, params.orde_idno),
    ];

    if (!params.includeDisabled) {
      conditions.push(eq(CRM_ORDER.enab_yesn, true));
    }

    const [row] = await db
      .select()
      .from(CRM_ORDER)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  },
  // #endregion

  // #region create
  async create({ db }: RepoDeps, data: OrderInsert) {
    const res = await db.insert(CRM_ORDER).values(data);
    return { orde_idno: getInsertId(res) };
  },
  // #endregion

  // #region update
  async update(
    { db }: RepoDeps,
    params: { comp_idno: number; orde_idno: number; data: OrderUpdate }
  ) {
    await db
      .update(CRM_ORDER)
      .set(params.data)
      .where(
        and(
          eq(CRM_ORDER.comp_idno, params.comp_idno),
          eq(CRM_ORDER.orde_idno, params.orde_idno)
        )
      );
  },
  // #endregion

  // #region disable (soft)
  async disable(
    { db }: RepoDeps,
    params: { comp_idno: number; orde_idno: number; data: OrderUpdate }
  ) {
    await db
      .update(CRM_ORDER)
      .set({
        ...params.data,
        enab_yesn: false,
      })
      .where(
        and(
          eq(CRM_ORDER.comp_idno, params.comp_idno),
          eq(CRM_ORDER.orde_idno, params.orde_idno)
        )
      );
  },
  // #endregion
} as const;