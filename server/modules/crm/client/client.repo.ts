// server/modules/crm/client/client.repo.ts

// #region Imports
import { and, asc, desc, eq, like } from "drizzle-orm";

import { CRM_CLIENT, CRM_CLIENT_CONT } from "../../../../drizzle/schema";
import { escapeLike } from "../shared/like";
import { getInsertId } from "../../../core/db";
import type { DbOrTx } from "../../../core/db/tx";
// #endregion

// #region Types
type RepoDeps = { db: DbOrTx };

export type ClientRow = typeof CRM_CLIENT.$inferSelect;
export type ClientInsert = typeof CRM_CLIENT.$inferInsert;

export type ClientContactRow = typeof CRM_CLIENT_CONT.$inferSelect;
export type ClientContactInsert = typeof CRM_CLIENT_CONT.$inferInsert;

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
    conditions.push(like(CRM_CLIENT.clie_name, `%${escapeLike(params.search)}%`));
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
    params: { comp_idno: number; limit?: number }
  ): Promise<Array<Pick<ClientRow, "clie_idno" | "clie_name">>> {
    return db
      .select({
        clie_idno: CRM_CLIENT.clie_idno,
        clie_name: CRM_CLIENT.clie_name,
      })
      .from(CRM_CLIENT)
      .where(and(eq(CRM_CLIENT.comp_idno, params.comp_idno), eq(CRM_CLIENT.enab_yesn, true)))
      .limit(params.limit ?? 2000); // 방어적 cap: fuzzy matching 대상이 2000+ 이면 별도 색인 전략 필요
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
          eq(CRM_CLIENT.clie_idno, params.clie_idno),
          eq(CRM_CLIENT.enab_yesn, true),
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

  // #region syncContact — 빈 필드만 채움 (사용자 수동 입력 우선) + CRM_CLIENT_CONT upsert
  async syncContact(
    { db }: RepoDeps,
    params: {
      comp_idno: number;
      clie_idno: number;
      cont_name?: string | null;
      cont_tele?: string | null;
      cont_mail?: string | null;
      crea_idno: number;
    }
  ): Promise<void> {
    const client = await clientRepo.getById({ db }, { comp_idno: params.comp_idno, clie_idno: params.clie_idno });
    if (!client) return;

    // 1. CRM_CLIENT 캐시 업데이트 (빈 필드만)
    const cacheUpdates: Partial<ClientInsert> = {};
    if (!client.cont_name && params.cont_name) cacheUpdates.cont_name = params.cont_name;
    if (!client.cont_tele && params.cont_tele) cacheUpdates.cont_tele = params.cont_tele;
    if (!client.cont_mail && params.cont_mail) cacheUpdates.cont_mail = params.cont_mail;

    if (Object.keys(cacheUpdates).length > 0) {
      await clientRepo.update({ db }, { comp_idno: params.comp_idno, clie_idno: params.clie_idno, data: cacheUpdates });
    }

    // 2. CRM_CLIENT_CONT — main_yesn=true 담당자가 없으면 insert
    if (!params.cont_name) return; // 이름 없으면 담당자 생성 불가

    const [existingMain] = await db
      .select()
      .from(CRM_CLIENT_CONT)
      .where(
        and(
          eq(CRM_CLIENT_CONT.comp_idno, params.comp_idno),
          eq(CRM_CLIENT_CONT.clie_idno, params.clie_idno),
          eq(CRM_CLIENT_CONT.main_yesn, true),
          eq(CRM_CLIENT_CONT.enab_yesn, true)
        )
      )
      .limit(1);

    if (!existingMain) {
      // 대표 담당자 없음 → AI 추출 담당자를 대표로 insert
      await db.insert(CRM_CLIENT_CONT).values({
        comp_idno: params.comp_idno,
        clie_idno: params.clie_idno,
        cont_name: params.cont_name,
        cont_tele: params.cont_tele ?? null,
        cont_mail: params.cont_mail ?? null,
        main_yesn: true,
        enab_yesn: true,
        crea_idno: params.crea_idno,
        crea_date: new Date(),
        modi_idno: params.crea_idno,
        modi_date: new Date(),
      });
    } else {
      // 대표 담당자 있음 → 빈 필드만 보완
      const contUpdates: Partial<ClientContactInsert> = {};
      if (!existingMain.cont_tele && params.cont_tele) contUpdates.cont_tele = params.cont_tele;
      if (!existingMain.cont_mail && params.cont_mail) contUpdates.cont_mail = params.cont_mail;

      if (Object.keys(contUpdates).length > 0) {
        await db
          .update(CRM_CLIENT_CONT)
          .set(contUpdates)
          .where(eq(CRM_CLIENT_CONT.cont_idno, existingMain.cont_idno));
      }
    }
  },
  // #endregion

  // #region listContacts — 고객사 담당자 목록
  async listContacts(
    { db }: RepoDeps,
    params: { comp_idno: number; clie_idno: number }
  ): Promise<ClientContactRow[]> {
    return db
      .select()
      .from(CRM_CLIENT_CONT)
      .where(
        and(
          eq(CRM_CLIENT_CONT.comp_idno, params.comp_idno),
          eq(CRM_CLIENT_CONT.clie_idno, params.clie_idno),
          eq(CRM_CLIENT_CONT.enab_yesn, true)
        )
      )
      .orderBy(desc(CRM_CLIENT_CONT.main_yesn), asc(CRM_CLIENT_CONT.cont_idno));
  },
  // #endregion

  // #region getMainContact — main_yesn=true 대표 담당자 (없으면 null)
  async getMainContact(
    { db }: RepoDeps,
    params: { comp_idno: number; clie_idno: number }
  ): Promise<ClientContactRow | null> {
    const [row] = await db
      .select()
      .from(CRM_CLIENT_CONT)
      .where(
        and(
          eq(CRM_CLIENT_CONT.comp_idno, params.comp_idno),
          eq(CRM_CLIENT_CONT.clie_idno, params.clie_idno),
          eq(CRM_CLIENT_CONT.main_yesn, true),
          eq(CRM_CLIENT_CONT.enab_yesn, true)
        )
      )
      .limit(1);

    return row ?? null;
  },
  // #endregion

  // #region getContactById
  async getContactById(
    { db }: RepoDeps,
    params: { comp_idno: number; cont_idno: number }
  ): Promise<ClientContactRow | null> {
    const [row] = await db
      .select()
      .from(CRM_CLIENT_CONT)
      .where(
        and(
          eq(CRM_CLIENT_CONT.comp_idno, params.comp_idno),
          eq(CRM_CLIENT_CONT.cont_idno, params.cont_idno),
          eq(CRM_CLIENT_CONT.enab_yesn, true)
        )
      )
      .limit(1);
    return row ?? null;
  },
  // #endregion

  // #region createContact
  async createContact(
    { db }: RepoDeps,
    data: ClientContactInsert
  ): Promise<{ cont_idno: number }> {
    const res = await db.insert(CRM_CLIENT_CONT).values(data);
    return { cont_idno: getInsertId(res) };
  },
  // #endregion

  // #region updateContact
  async updateContact(
    { db }: RepoDeps,
    params: { comp_idno: number; cont_idno: number; data: Partial<ClientContactInsert> }
  ): Promise<void> {
    await db
      .update(CRM_CLIENT_CONT)
      .set(params.data)
      .where(
        and(
          eq(CRM_CLIENT_CONT.comp_idno, params.comp_idno),
          eq(CRM_CLIENT_CONT.cont_idno, params.cont_idno),
          eq(CRM_CLIENT_CONT.enab_yesn, true)
        )
      );
  },
  // #endregion

  // #region clearMainContact — clie_idno 내 모든 main_yesn=false 처리
  async clearMainContact(
    { db }: RepoDeps,
    params: { comp_idno: number; clie_idno: number }
  ): Promise<void> {
    await db
      .update(CRM_CLIENT_CONT)
      .set({ main_yesn: false })
      .where(
        and(
          eq(CRM_CLIENT_CONT.comp_idno, params.comp_idno),
          eq(CRM_CLIENT_CONT.clie_idno, params.clie_idno),
          eq(CRM_CLIENT_CONT.enab_yesn, true)
        )
      );
  },
  // #endregion

  // #region disableContact (soft delete)
  async disableContact(
    { db }: RepoDeps,
    params: { comp_idno: number; cont_idno: number; modi_idno: number }
  ): Promise<void> {
    await db
      .update(CRM_CLIENT_CONT)
      .set({ enab_yesn: false, modi_idno: params.modi_idno, modi_date: new Date() })
      .where(
        and(
          eq(CRM_CLIENT_CONT.comp_idno, params.comp_idno),
          eq(CRM_CLIENT_CONT.cont_idno, params.cont_idno)
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