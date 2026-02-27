// server/modules/crm/client/client.repo.ts

// #region Imports
import { and, asc, desc, eq, like } from "drizzle-orm";

import { CRM_CLIENT } from "../../../../drizzle/schema";
import { getInsertId } from "../../../core/db";
import type { DbOrTx } from "../../../core/db/tx";
// #endregion

// #region Types
type RepoDeps = { db: DbOrTx };

export type ClientRow = typeof CRM_CLIENT.$inferSelect;
export type ClientInsert = typeof CRM_CLIENT.$inferInsert;

type ClientSortField = "modi_date" | "crea_date" | "clie_name";
type ClientSortDir = "asc" | "desc";
// #endregion

// #region Utils
function orderByFor(sort?: { field: ClientSortField; dir: ClientSortDir }) {
  if (!sort) return [desc(CRM_CLIENT.modi_date), desc(CRM_CLIENT.crea_date)] as const;

  const dirFn = sort.dir === "asc" ? asc : desc;

  switch (sort.field) {
    case "modi_date":
      return [dirFn(CRM_CLIENT.modi_date)] as const;
    case "crea_date":
      return [dirFn(CRM_CLIENT.crea_date)] as const;
    case "clie_name":
      return [dirFn(CRM_CLIENT.clie_name)] as const;
    default:
      return [desc(CRM_CLIENT.modi_date), desc(CRM_CLIENT.crea_date)] as const;
  }
}

function buildWhere(params: { comp_idno: number; search?: string; onlyEnabled?: boolean }) {
  const conditions = [eq(CRM_CLIENT.comp_idno, params.comp_idno)];

  // ✅ soft disable 정책: 기본 활성만
  if (params.onlyEnabled !== false) {
    conditions.push(eq(CRM_CLIENT.enab_yesn, true));
  }

  if (params.search) {
    conditions.push(like(CRM_CLIENT.clie_name, `%${params.search}%`));
  }

  return and(...conditions);
}
// #endregion

export const clientRepo = {
  // #region list
  async list(
    { db }: RepoDeps,
    params: {
      comp_idno: number;
      search?: string;
      limit: number;
      offset: number;
      sort?: { field: ClientSortField; dir: ClientSortDir };
      onlyEnabled?: boolean; // default true
    }
  ): Promise<ClientRow[]> {
    const where = buildWhere({
      comp_idno: params.comp_idno,
      search: params.search,
      onlyEnabled: params.onlyEnabled,
    });

    const orderBy = orderByFor(params.sort);

    return db
      .select()
      .from(CRM_CLIENT)
      .where(where)
      .orderBy(...orderBy)
      .limit(params.limit + 1)
      .offset(params.offset);
  },
  // #endregion

  // #region listNames (for matching)
  async listNames(
    { db }: RepoDeps,
    params: { comp_idno: number }
  ): Promise<Array<Pick<ClientRow, "clie_idno" | "clie_name">>> {
    return db
      .select({
        clie_idno: CRM_CLIENT.clie_idno,
        clie_name: CRM_CLIENT.clie_name,
      })
      .from(CRM_CLIENT)
      .where(and(eq(CRM_CLIENT.comp_idno, params.comp_idno), eq(CRM_CLIENT.enab_yesn, true)));
  },
  // #endregion

  // #region getById
  async getById(
    { db }: RepoDeps,
    params: { comp_idno: number; clie_idno: number; includeDisabled?: boolean }
  ): Promise<ClientRow | null> {
    const conditions = [
      eq(CRM_CLIENT.comp_idno, params.comp_idno),
      eq(CRM_CLIENT.clie_idno, params.clie_idno),
    ];

    if (!params.includeDisabled) {
      conditions.push(eq(CRM_CLIENT.enab_yesn, true));
    }

    const [row] = await db
      .select()
      .from(CRM_CLIENT)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  },
  // #endregion

  // #region create
  async create({ db }: RepoDeps, data: ClientInsert) {
    const res = await db.insert(CRM_CLIENT).values(data);
    return { clie_idno: getInsertId(res) };
  },
  // #endregion

  // #region update
  async update(
    { db }: RepoDeps,
    params: { comp_idno: number; clie_idno: number; data: Partial<ClientInsert> }
  ) {
    await db
      .update(CRM_CLIENT)
      .set(params.data)
      .where(
        and(
          eq(CRM_CLIENT.comp_idno, params.comp_idno),
          eq(CRM_CLIENT.clie_idno, params.clie_idno)
        )
      );
  },
  // #endregion

  // #region disable (soft)
  async disable(
    { db }: RepoDeps,
    params: { comp_idno: number; clie_idno: number; data: Partial<ClientInsert> }
  ) {
    await db
      .update(CRM_CLIENT)
      .set({
        ...params.data,
        enab_yesn: false,
      })
      .where(
        and(
          eq(CRM_CLIENT.comp_idno, params.comp_idno),
          eq(CRM_CLIENT.clie_idno, params.clie_idno)
        )
      );
  },
  // #endregion

  // #region findByExactName
  async findByExactName(
    { db }: RepoDeps,
    params: { comp_idno: number; name: string; includeDisabled?: boolean }
  ): Promise<ClientRow | null> {
    const conditions = [
      eq(CRM_CLIENT.comp_idno, params.comp_idno),
      eq(CRM_CLIENT.clie_name, params.name),
    ];

    if (!params.includeDisabled) {
      conditions.push(eq(CRM_CLIENT.enab_yesn, true));
    }

    const [row] = await db
      .select()
      .from(CRM_CLIENT)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  },
  // #endregion
} as const;