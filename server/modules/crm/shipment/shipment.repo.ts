// server/modules/crm/shipment/shipment.repo.ts

// #region Imports
import { and, asc, desc, eq, like, sql } from "drizzle-orm";

import { CRM_SHIPMENT, type InsertShipment } from "../../../../drizzle/schema";
import { escapeLike } from "../shared/like";
import { getInsertId } from "../../../core/db";
import type { DbOrTx } from "../../../core/db/tx";
// #endregion

// #region Types
type RepoDeps = { db: DbOrTx };
// #endregion

export const shipmentRepo = {
  // #region list
  async list(
    { db }: RepoDeps,
    params: {
      comp_idno: number;
      orde_idno?: number;
      stat_code?: "pending" | "delivered" | "invoiced" | "paid";
      search?: string;

      limit: number;
      offset: number;

      sort?: { field: string; dir: "asc" | "desc" };
    }
  ) {
    const where = and(
      eq(CRM_SHIPMENT.comp_idno, params.comp_idno),
      eq(CRM_SHIPMENT.enab_yesn, true),
      params.orde_idno ? eq(CRM_SHIPMENT.orde_idno, params.orde_idno) : undefined,
      params.stat_code ? eq(CRM_SHIPMENT.stat_code, params.stat_code) : undefined,
      params.search ? like(CRM_SHIPMENT.clie_name, `%${escapeLike(params.search)}%`) : undefined
    );

    // sort field 안전 처리(화이트리스트)
    const sortField = params.sort?.field;
    const dir = (params.sort?.dir ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";
    const dirFn = dir === "asc" ? asc : desc;

    const orderByExpr =
      sortField === "ship_date" ? dirFn(CRM_SHIPMENT.ship_date) :
      sortField === "paid_date" ? dirFn(CRM_SHIPMENT.paid_date) :
      sortField === "invc_date" ? dirFn(CRM_SHIPMENT.invc_date) :
      sortField === "crea_date" ? dirFn(CRM_SHIPMENT.crea_date) :
      sortField === "modi_date" ? dirFn(CRM_SHIPMENT.modi_date) :
      desc(CRM_SHIPMENT.crea_date);

    return db
      .select()
      .from(CRM_SHIPMENT)
      .where(where)
      .orderBy(orderByExpr)
      .limit(params.limit + 1)
      .offset(params.offset);
  },
  // #endregion

  // #region get
  async getById(
    { db }: RepoDeps,
    params: { comp_idno: number; ship_idno: number; includeDisabled?: boolean }
  ) {
    const conditions = [
      eq(CRM_SHIPMENT.comp_idno, params.comp_idno),
      eq(CRM_SHIPMENT.ship_idno, params.ship_idno),
    ];

    if (!params.includeDisabled) {
      conditions.push(eq(CRM_SHIPMENT.enab_yesn, true));
    }

    const [row] = await db
      .select()
      .from(CRM_SHIPMENT)
      .where(and(...conditions))
      .limit(1);

    return row ?? null;
  },
  // #endregion

  // #region create
  async create({ db }: RepoDeps, data: InsertShipment) {
    const res = await db.insert(CRM_SHIPMENT).values(data);
    return { ship_idno: getInsertId(res) };
  },
  // #endregion

  // #region update
  async update({ db }: RepoDeps, params: { comp_idno: number; ship_idno: number; data: Partial<InsertShipment> }) {
    await db
      .update(CRM_SHIPMENT)
      .set(params.data)
      .where(
        and(
          eq(CRM_SHIPMENT.comp_idno, params.comp_idno),
          eq(CRM_SHIPMENT.ship_idno, params.ship_idno),
          eq(CRM_SHIPMENT.enab_yesn, true),
        )
      );
  },
  // #endregion

  // #region remove (soft: enab_yesn=false)
  async disable({ db }: RepoDeps, params: { comp_idno: number; ship_idno: number; data: Partial<InsertShipment> }) {
    await db
      .update(CRM_SHIPMENT)
      .set(params.data)
      .where(and(eq(CRM_SHIPMENT.comp_idno, params.comp_idno), eq(CRM_SHIPMENT.ship_idno, params.ship_idno)));
  },
  // #endregion
} as const;