// server/modules/crm/sale/sale.repo.ts

import { and, asc, desc, eq, like } from "drizzle-orm";
import { escapeLike } from "../shared/like";
import {
  CRM_SALE,
  CRM_SCHEDULE,
  CRM_SALE_AUDIO_JOB,
  CORE_FILE_LINK,
} from "../../../../drizzle/schema";

import { getInsertId } from "../../../core/db";
import type { DbClient } from "../../../core/db";

type SaleRepoDeps = { db: DbClient };

export type SaleRow = typeof CRM_SALE.$inferSelect;
export type InsertSale = typeof CRM_SALE.$inferInsert;

export type InsertSchedule = typeof CRM_SCHEDULE.$inferInsert;

export type SaleAudioJobRow = typeof CRM_SALE_AUDIO_JOB.$inferSelect;
export type InsertSaleAudioJob = typeof CRM_SALE_AUDIO_JOB.$inferInsert;

export type ListSalesArgs = {
  comp_idno: number;
  owne_idno: number;

  clie_idno?: number;
  search?: string;

  limit: number;
  offset: number;

  sort_field: "vist_date" | "modi_date" | "crea_date";
  sort_dir: "asc" | "desc";
};

export const saleRepo = {
  async list(deps: SaleRepoDeps, args: ListSalesArgs) {
    const { db } = deps;

    const conditions = [
      eq(CRM_SALE.comp_idno, args.comp_idno),
      eq(CRM_SALE.owne_idno, args.owne_idno),
      eq(CRM_SALE.enab_yesn, true),
    ];

    if (args.clie_idno) conditions.push(eq(CRM_SALE.clie_idno, args.clie_idno));
    if (args.search) conditions.push(like(CRM_SALE.orig_memo, `%${escapeLike(args.search)}%`));

    const dirFn = args.sort_dir === "asc" ? asc : desc;
    const sortExpr =
      args.sort_field === "crea_date"
        ? dirFn(CRM_SALE.crea_date)
        : args.sort_field === "modi_date"
          ? dirFn(CRM_SALE.modi_date)
          : dirFn(CRM_SALE.vist_date);

    return db
      .select()
      .from(CRM_SALE)
      .where(and(...conditions))
      .orderBy(sortExpr, desc(CRM_SALE.sale_idno))
      .limit(args.limit + 1)
      .offset(args.offset);
  },

  async getById(deps: SaleRepoDeps, args: { comp_idno: number; owne_idno: number; sale_idno: number }) {
    const rows = await deps.db
      .select()
      .from(CRM_SALE)
      .where(
        and(
          eq(CRM_SALE.comp_idno, args.comp_idno),
          eq(CRM_SALE.owne_idno, args.owne_idno),
          eq(CRM_SALE.sale_idno, args.sale_idno),
          eq(CRM_SALE.enab_yesn, true)
        )
      )
      .limit(1);

    return rows[0] ?? null;
  },

  async create(deps: SaleRepoDeps, data: InsertSale) {
    const res = await deps.db.insert(CRM_SALE).values(data);
    return { sale_idno: getInsertId(res) };
  },

  async update(
    deps: SaleRepoDeps,
    args: { comp_idno: number; owne_idno: number; sale_idno: number; data: Partial<InsertSale> }
  ) {
    await deps.db
      .update(CRM_SALE)
      .set(args.data)
      .where(
        and(
          eq(CRM_SALE.comp_idno, args.comp_idno),
          eq(CRM_SALE.owne_idno, args.owne_idno),
          eq(CRM_SALE.sale_idno, args.sale_idno),
          eq(CRM_SALE.enab_yesn, true)
        )
      );
  },

  // ✅ soft delete
  async remove(deps: SaleRepoDeps, args: { comp_idno: number; owne_idno: number; sale_idno: number; data: Partial<InsertSale> }) {
    await deps.db
      .update(CRM_SALE)
      .set(args.data)
      .where(
        and(
          eq(CRM_SALE.comp_idno, args.comp_idno),
          eq(CRM_SALE.owne_idno, args.owne_idno),
          eq(CRM_SALE.sale_idno, args.sale_idno),
          eq(CRM_SALE.enab_yesn, true)
        )
      );
  },

  async listAttachments(deps: SaleRepoDeps, args: { comp_idno: number; sale_idno: number }) {
    const rows = await deps.db
      .select({
        file_idno: CORE_FILE_LINK.file_idno,
        purp_type: CORE_FILE_LINK.purp_type,
        sort_orde: CORE_FILE_LINK.sort_orde,
      })
      .from(CORE_FILE_LINK)
      .where(
        and(
          eq(CORE_FILE_LINK.comp_idno, args.comp_idno),
          eq(CORE_FILE_LINK.refe_type, "sale_info"),
          eq(CORE_FILE_LINK.refe_idno, args.sale_idno),
          eq(CORE_FILE_LINK.dele_yesn, 0)
        )
      )
      .orderBy(asc(CORE_FILE_LINK.sort_orde), asc(CORE_FILE_LINK.file_idno));

    return rows.map((r) => ({
      file_idno: Number(r.file_idno),
      purp_type: r.purp_type ?? null,
      sort_orde: Number(r.sort_orde ?? 0),
    }));
  },

  async getAudioJobByRef(deps: SaleRepoDeps, args: { comp_idno: number; sale_idno: number; file_idno: number }) {
    const rows = await deps.db
      .select()
      .from(CRM_SALE_AUDIO_JOB)
      .where(
        and(
          eq(CRM_SALE_AUDIO_JOB.comp_idno, args.comp_idno),
          eq(CRM_SALE_AUDIO_JOB.sale_idno, args.sale_idno),
          eq(CRM_SALE_AUDIO_JOB.file_idno, args.file_idno)
        )
      )
      .limit(1);

    return rows[0] ?? null;
  },

  async createAudioJob(deps: SaleRepoDeps, data: InsertSaleAudioJob) {
    const res = await deps.db.insert(CRM_SALE_AUDIO_JOB).values(data);
    return { jobs_idno: getInsertId(res) };
  },

  async updateAudioJob(
    deps: SaleRepoDeps,
    args: { jobs_idno: number; data: Partial<InsertSaleAudioJob> }
  ): Promise<void> {
    await deps.db
      .update(CRM_SALE_AUDIO_JOB)
      .set(args.data)
      .where(eq(CRM_SALE_AUDIO_JOB.jobs_idno, args.jobs_idno));
  },

  async createSchedule(deps: SaleRepoDeps, data: InsertSchedule) {
    const res = await deps.db.insert(CRM_SCHEDULE).values(data);
    return { sche_idno: getInsertId(res) };
  },
} as const;