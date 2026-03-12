// server/modules/crm/sale/sale.repo.ts

// #region Imports

import { and, asc, desc, eq, isNull, like, lt } from "drizzle-orm";
import { escapeLike } from "../shared/like";
import {
  CRM_SALE,
  CRM_SCHEDULE,
  CRM_SALE_AUDIO_JOB,
  CORE_FILE_LINK,
} from "../../../../drizzle/schema";

import { getInsertId } from "../../../core/db";
import type { DbClient } from "../../../core/db";

// #endregion

// #region Types

type SaleRepoDeps = { db: DbClient };

export type SaleRow = typeof CRM_SALE.$inferSelect;
export type InsertSale = typeof CRM_SALE.$inferInsert;

export type InsertSchedule = typeof CRM_SCHEDULE.$inferInsert;

export type SaleAudioJobRow = typeof CRM_SALE_AUDIO_JOB.$inferSelect;
export type InsertSaleAudioJob = typeof CRM_SALE_AUDIO_JOB.$inferInsert;

export type ListSalesArgs = {
  comp_idno: number;
  owne_idno?: number; // undefined = 전사 조회 (admin/owner용)

  clie_idno?: number;
  search?: string;

  limit: number;
  offset: number;

  sort_field: "vist_date" | "modi_date" | "crea_date";
  sort_dir: "asc" | "desc";
};

// #endregion

// #region Repo

export const saleRepo = {
  // #region Sales

  async list(deps: SaleRepoDeps, args: ListSalesArgs) {
    const { db } = deps;

    const conditions = [
      eq(CRM_SALE.comp_idno, args.comp_idno),
      eq(CRM_SALE.enab_yesn, true),
    ];

    if (args.owne_idno !== undefined) conditions.push(eq(CRM_SALE.owne_idno, args.owne_idno));
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

  async getById(deps: SaleRepoDeps, args: { comp_idno: number; owne_idno?: number; sale_idno: number }) {
    const conditions = [
      eq(CRM_SALE.comp_idno, args.comp_idno),
      eq(CRM_SALE.sale_idno, args.sale_idno),
      eq(CRM_SALE.enab_yesn, true),
    ];
    if (args.owne_idno !== undefined) conditions.push(eq(CRM_SALE.owne_idno, args.owne_idno));

    const rows = await deps.db
      .select()
      .from(CRM_SALE)
      .where(and(...conditions))
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

  async remove(
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

  // #endregion

  // #region Attachments

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

  // #endregion

  // #region Audio Jobs

  async getAudioJobByRef(deps: SaleRepoDeps, args: { comp_idno: number; sale_idno: number; file_idno: number; jobs_type?: string }) {
    const conditions = [
      eq(CRM_SALE_AUDIO_JOB.comp_idno, args.comp_idno),
      eq(CRM_SALE_AUDIO_JOB.sale_idno, args.sale_idno),
      eq(CRM_SALE_AUDIO_JOB.file_idno, args.file_idno),
    ];
    if (args.jobs_type) conditions.push(eq(CRM_SALE_AUDIO_JOB.jobs_type, args.jobs_type));

    const rows = await deps.db
      .select()
      .from(CRM_SALE_AUDIO_JOB)
      .where(and(...conditions))
      .limit(1);

    return rows[0] ?? null;
  },

  async createAudioJob(deps: SaleRepoDeps, data: InsertSaleAudioJob) {
    const res = await deps.db.insert(CRM_SALE_AUDIO_JOB).values(data);
    return { jobs_idno: getInsertId(res) };
  },

  async updateAudioJob(deps: SaleRepoDeps, args: { jobs_idno: number; data: Partial<InsertSaleAudioJob> }): Promise<void> {
    await deps.db.update(CRM_SALE_AUDIO_JOB).set(args.data).where(eq(CRM_SALE_AUDIO_JOB.jobs_idno, args.jobs_idno));
  },

  async markJobFailed(
    deps: SaleRepoDeps,
    args: { jobs_idno: number; fail_mess: string }
  ): Promise<void> {
    await deps.db
      .update(CRM_SALE_AUDIO_JOB)
      .set({
        jobs_stat: "failed",
        fail_mess: args.fail_mess,
        fini_date: new Date(),
      })
      .where(eq(CRM_SALE_AUDIO_JOB.jobs_idno, args.jobs_idno));
  },

  async getAudioJobById(deps: SaleRepoDeps, jobs_idno: number): Promise<SaleAudioJobRow | null> {
    const rows = await deps.db
      .select()
      .from(CRM_SALE_AUDIO_JOB)
      .where(eq(CRM_SALE_AUDIO_JOB.jobs_idno, jobs_idno))
      .limit(1);
    return rows[0] ?? null;
  },

  /** Worker: 가장 오래된 queued 잡 조회 (태스크 타입 무관) */
  async findNextQueuedJob(deps: SaleRepoDeps): Promise<SaleAudioJobRow | null> {
    const rows = await deps.db
      .select()
      .from(CRM_SALE_AUDIO_JOB)
      .where(eq(CRM_SALE_AUDIO_JOB.jobs_stat, "queued"))
      .orderBy(asc(CRM_SALE_AUDIO_JOB.reqe_date))
      .limit(1);
    return rows[0] ?? null;
  },

  /** Worker: owne_idno 체크 없이 sale 조회 */
  async getSaleForWorker(deps: SaleRepoDeps, args: { sale_idno: number; comp_idno: number }): Promise<SaleRow | null> {
    const rows = await deps.db
      .select()
      .from(CRM_SALE)
      .where(
        and(
          eq(CRM_SALE.comp_idno, args.comp_idno),
          eq(CRM_SALE.sale_idno, args.sale_idno),
          eq(CRM_SALE.enab_yesn, true)
        )
      )
      .limit(1);
    return rows[0] ?? null;
  },

  /** analyze_text job 재사용 조회 (file_idno 없는 분석 잡) */
  async getLatestAnalyzeNoFileJob(deps: SaleRepoDeps, args: { comp_idno: number; sale_idno: number }): Promise<SaleAudioJobRow | null> {
    const rows = await deps.db
      .select()
      .from(CRM_SALE_AUDIO_JOB)
      .where(
        and(
          eq(CRM_SALE_AUDIO_JOB.comp_idno, args.comp_idno),
          eq(CRM_SALE_AUDIO_JOB.sale_idno, args.sale_idno),
          isNull(CRM_SALE_AUDIO_JOB.file_idno),
        )
      )
      .orderBy(desc(CRM_SALE_AUDIO_JOB.reqe_date))
      .limit(1);
    return rows[0] ?? null;
  },

  /** file-only transcribe job 조회 (sale_idno 없는 경우) */
  async getTranscribeJobByFile(deps: SaleRepoDeps, args: { comp_idno: number; file_idno: number }): Promise<SaleAudioJobRow | null> {
    const rows = await deps.db
      .select()
      .from(CRM_SALE_AUDIO_JOB)
      .where(
        and(
          eq(CRM_SALE_AUDIO_JOB.comp_idno, args.comp_idno),
          eq(CRM_SALE_AUDIO_JOB.file_idno, args.file_idno),
          eq(CRM_SALE_AUDIO_JOB.jobs_type, "transcribe"),
          isNull(CRM_SALE_AUDIO_JOB.sale_idno),
        )
      )
      .orderBy(desc(CRM_SALE_AUDIO_JOB.reqe_date))
      .limit(1);
    return rows[0] ?? null;
  },

  /** getTranscribeJobResult용: 가장 최근 transcribe 잡 조회 */
  async getLatestTranscribeJob(deps: SaleRepoDeps, args: { sale_idno: number; comp_idno: number }): Promise<SaleAudioJobRow | null> {
    const rows = await deps.db
      .select()
      .from(CRM_SALE_AUDIO_JOB)
      .where(
        and(
          eq(CRM_SALE_AUDIO_JOB.comp_idno, args.comp_idno),
          eq(CRM_SALE_AUDIO_JOB.sale_idno, args.sale_idno),
          eq(CRM_SALE_AUDIO_JOB.jobs_type, "transcribe"),
        )
      )
      .orderBy(desc(CRM_SALE_AUDIO_JOB.reqe_date))
      .limit(1);
    return rows[0] ?? null;
  },

  /** Worker: 완료된 분석 잡의 최신 결과 조회 */
  async getLatestDoneAnalyzeJob(deps: SaleRepoDeps, args: { sale_idno: number; comp_idno: number }): Promise<SaleAudioJobRow | null> {
    const rows = await deps.db
      .select()
      .from(CRM_SALE_AUDIO_JOB)
      .where(
        and(
          eq(CRM_SALE_AUDIO_JOB.comp_idno, args.comp_idno),
          eq(CRM_SALE_AUDIO_JOB.sale_idno, args.sale_idno),
          eq(CRM_SALE_AUDIO_JOB.jobs_stat, "done")
        )
      )
      .orderBy(desc(CRM_SALE_AUDIO_JOB.fini_date))
      .limit(1);
    return rows[0] ?? null;
  },

  /**
   * Stale "running" job 복구
   * - reqe_date가 cutoff보다 오래된 running 잡을 failed로 전환
   * - aiex_stat = "failed"로도 연동 업데이트
   */
  async resetStaleRunningJobs(deps: SaleRepoDeps, cutoff: Date): Promise<number> {
    const stale = await deps.db
      .select({ jobs_idno: CRM_SALE_AUDIO_JOB.jobs_idno, sale_idno: CRM_SALE_AUDIO_JOB.sale_idno, comp_idno: CRM_SALE_AUDIO_JOB.comp_idno })
      .from(CRM_SALE_AUDIO_JOB)
      .where(
        and(
          eq(CRM_SALE_AUDIO_JOB.jobs_stat, "running"),
          lt(CRM_SALE_AUDIO_JOB.reqe_date, cutoff),
        )
      );

    if (!stale.length) return 0;

    const now = new Date();
    for (const job of stale) {
      await deps.db
        .update(CRM_SALE_AUDIO_JOB)
        .set({ jobs_stat: "failed", fail_mess: "서버 재시작 또는 타임아웃으로 인한 자동 복구", fini_date: now })
        .where(eq(CRM_SALE_AUDIO_JOB.jobs_idno, job.jobs_idno));

      // 연결된 sale aiex_stat도 failed로 동기화 (file-only job은 sale_idno 없음)
      if (job.sale_idno != null) {
        await deps.db
          .update(CRM_SALE)
          .set({ aiex_stat: "failed" })
          .where(
            and(
              eq(CRM_SALE.comp_idno, job.comp_idno),
              eq(CRM_SALE.sale_idno, job.sale_idno),
            )
          );
      }
    }

    return stale.length;
  },

  // #endregion

  // #region Schedules

  async createSchedule(deps: SaleRepoDeps, data: InsertSchedule) {
    const res = await deps.db.insert(CRM_SCHEDULE).values(data);
    return { sche_idno: getInsertId(res) };
  },

  /** ✅ 상세에서 sale_idno 기준으로 일정 목록 내려주기 */
  async listSchedulesBySale(
    deps: SaleRepoDeps,
    args: { comp_idno: number; owne_idno: number; sale_idno: number }
  ) {
    return deps.db
      .select()
      .from(CRM_SCHEDULE)
      .where(
        and(
          eq(CRM_SCHEDULE.comp_idno, args.comp_idno),
          eq(CRM_SCHEDULE.owne_idno, args.owne_idno),
          eq(CRM_SCHEDULE.sale_idno, args.sale_idno),
          eq(CRM_SCHEDULE.enab_yesn, true)
        )
      )
      .orderBy(asc(CRM_SCHEDULE.sche_date), asc(CRM_SCHEDULE.sche_idno));
  },

  /** ✅ sale에 연결된 거래처 확정 후 일정들의 clie_idno 일괄 보정 */
  async patchSchedulesClientBySale(
    deps: SaleRepoDeps,
    args: { comp_idno: number; sale_idno: number; clie_idno: number; clie_name?: string | null }
  ) {
    await deps.db
      .update(CRM_SCHEDULE)
      .set({
        clie_idno: args.clie_idno,
        ...(args.clie_name != null ? { clie_name: args.clie_name } : {}),
      })
      .where(
        and(
          eq(CRM_SCHEDULE.comp_idno, args.comp_idno),
          eq(CRM_SCHEDULE.sale_idno, args.sale_idno),
          eq(CRM_SCHEDULE.enab_yesn, true)
        )
      );
  },

  /** ✅ analyze에서 aiex_keys 중복 방지 */
  async findScheduleByAiKey(
    deps: SaleRepoDeps,
    args: { comp_idno: number; sale_idno: number; aiex_keys: string }
  ) {
    const rows = await deps.db
      .select()
      .from(CRM_SCHEDULE)
      .where(
        and(
          eq(CRM_SCHEDULE.comp_idno, args.comp_idno),
          eq(CRM_SCHEDULE.sale_idno, args.sale_idno),
          eq(CRM_SCHEDULE.aiex_keys, args.aiex_keys)
        )
      )
      .limit(1);

    return rows[0] ?? null;
  },

  // #endregion
} as const;

// #endregion