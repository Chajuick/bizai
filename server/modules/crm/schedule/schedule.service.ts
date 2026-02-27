// server/modules/crm/schedule/schedule.service.ts

// #region Imports
import type { ServiceCtx } from "../../../core/serviceCtx";
import { getDb } from "../../../core/db";

import { normalizePage } from "../shared/pagination";
import { withCreateAudit, withUpdateAudit } from "../shared/audit";

import type { ScheduleCreatePayload, ScheduleSort, ScheduleUpdatePayload } from "./schedule.dto";
import { scheduleRepo, type ScheduleUpdate } from "./schedule.repo";
// #endregion

// #region Helpers
function parseDateOrThrow(v: string): Date {
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) throw new Error("[schedule] Invalid date string.");
  return d;
}

function parseDateOrNull(v: string | null | undefined): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  return parseDateOrThrow(v);
}

function moneyToDecimalStringOrNull(v: number | null | undefined): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  return v.toFixed(2);
}
// #endregion

export const scheduleService = {
  // #region listSchedules
  async listSchedules(ctx: ServiceCtx, input?: any) {
    const db = getDb();

    const fallbackLimit = input?.limit;
    const page = normalizePage(input?.page ?? { limit: fallbackLimit ?? 20, offset: 0 });

    const sort: ScheduleSort | undefined = input?.sort
      ? { field: input.sort.field, dir: input.sort.dir }
      : undefined;

    const rows = await scheduleRepo.list(
      { db },
      {
        comp_idno: ctx.comp_idno,
        stat_code: input?.stat_code,
        upcoming: input?.upcoming,

        limit: page.limit,
        offset: page.offset,
        sort,
        onlyEnabled: true,
      }
    );

    const hasMore = rows.length > page.limit;

    return {
      items: hasMore ? rows.slice(0, page.limit) : rows,
      page: { ...page, hasMore },
    };
  },
  // #endregion

  // #region getSchedule
  async getSchedule(ctx: ServiceCtx, sche_idno: number) {
    const db = getDb();
    return scheduleRepo.getById({ db }, { comp_idno: ctx.comp_idno, sche_idno });
  },
  // #endregion

  // #region createSchedule
  async createSchedule(ctx: ServiceCtx, input: ScheduleCreatePayload) {
    const db = getDb();

    const data = withCreateAudit(ctx, {
      comp_idno: ctx.comp_idno,

      // ✅ 현재 정책: 담당자 = 자기 자신
      owne_idno: ctx.user_idno,

      sale_idno: input.sale_idno,
      clie_idno: input.clie_idno,
      clie_name: input.clie_name,

      sche_name: input.sche_name,
      sche_desc: input.sche_desc,

      sche_pric: moneyToDecimalStringOrNull(input.sche_pric),
      sche_date: parseDateOrThrow(input.sche_date),

      stat_code: "scheduled" as const,
      remd_sent: false,
      auto_gene: false,

      enab_yesn: true,
    });

    return scheduleRepo.create({ db }, data);
  },
  // #endregion

  // #region updateSchedule
  async updateSchedule(ctx: ServiceCtx, sche_idno: number, patch: ScheduleUpdatePayload) {
    const db = getDb();

    // ✅ TS 에러 방지: union(spread) 금지, 안전 빌드
    const data: ScheduleUpdate = {};

    if (patch.sche_name !== undefined) data.sche_name = patch.sche_name;
    if (patch.sche_desc !== undefined) data.sche_desc = patch.sche_desc as any;

    const scheDate = parseDateOrNull(patch.sche_date);
    if (scheDate !== undefined) data.sche_date = scheDate as any;

    const schePric = moneyToDecimalStringOrNull(patch.sche_pric);
    if (schePric !== undefined) data.sche_pric = schePric as any;

    if (patch.stat_code !== undefined) data.stat_code = patch.stat_code as any;
    if (patch.clie_name !== undefined) data.clie_name = patch.clie_name as any;

    if (patch.enab_yesn !== undefined) data.enab_yesn = patch.enab_yesn;

    const audited = withUpdateAudit(ctx, data);

    await scheduleRepo.update({ db }, { comp_idno: ctx.comp_idno, sche_idno, data: audited });

    return { success: true as const };
  },
  // #endregion

  // #region completeSchedule
  async completeSchedule(ctx: ServiceCtx, sche_idno: number) {
    const db = getDb();

    const audited = withUpdateAudit(ctx, { stat_code: "completed" as const });
    await scheduleRepo.update({ db }, { comp_idno: ctx.comp_idno, sche_idno, data: audited });

    return { success: true as const };
  },
  // #endregion

  // #region cancelSchedule
  async cancelSchedule(ctx: ServiceCtx, sche_idno: number) {
    const db = getDb();

    const audited = withUpdateAudit(ctx, { stat_code: "canceled" as const });
    await scheduleRepo.update({ db }, { comp_idno: ctx.comp_idno, sche_idno, data: audited });

    return { success: true as const };
  },
  // #endregion

  // #region disableSchedule
  async disableSchedule(ctx: ServiceCtx, sche_idno: number) {
    const db = getDb();

    const audited = withUpdateAudit(ctx, {});
    await scheduleRepo.disable({ db }, { comp_idno: ctx.comp_idno, sche_idno, data: audited });

    return { success: true as const };
  },
  // #endregion
} as const;