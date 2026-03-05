// server/modules/crm/schedule/schedule.service.ts

// #region Imports
import type { ServiceCtx } from "../../../core/serviceCtx";
import { getDb } from "../../../core/db";

import { normalizePage } from "../shared/pagination";
import { withCreateAudit, withUpdateAudit } from "../shared/audit";

import type { ScheduleCreatePayload, ScheduleSort, ScheduleTabKey, ScheduleUpdatePayload, ScheduleListInputType } from "./schedule.dto";
import { scheduleRepo, type ScheduleUpdate, type TabFilter } from "./schedule.repo";
import { parseDateOrThrow, parseDateOrNull } from "../shared/date";
import { toDecimalStr, toDecimalStrOrNull } from "../shared/decimal";
// #endregion

// #region Helpers

function computeKstTodayMidnightDate(nowMs: number) {
  const kstNow = new Date(nowMs + 9 * 60 * 60 * 1000);
  const y = kstNow.getUTCFullYear();
  const m = kstNow.getUTCMonth();
  const d = kstNow.getUTCDate();
  // KST 00:00 == UTC 전날 15:00
  const kstMidnightUtcMs = Date.UTC(y, m, d) - 9 * 60 * 60 * 1000;
  return new Date(kstMidnightUtcMs);
}
// #endregion

export const scheduleService = {
  // #region listSchedules
  async listSchedules(ctx: ServiceCtx, input?: ScheduleListInputType) {
    const db = getDb();

    const nowMs = Date.now();
    const now = new Date(nowMs);
    const kstMidnight = computeKstTodayMidnightDate(nowMs);
    const imminentEnd = new Date(nowMs + 48 * 60 * 60 * 1000);

    const tabType: ScheduleTabKey = input?.tab ?? "all";
    const tab: TabFilter = { type: tabType, now, kstMidnight, imminentEnd };

    const page = normalizePage(input?.page ?? { limit: 20, offset: 0 });

    const sort: ScheduleSort | undefined = input?.sort
      ? { field: input.sort.field, dir: input.sort.dir }
      : undefined;

    // ✅ limit+1 로 조회해서 hasMore 판정
    const rows = await scheduleRepo.list(
      { db },
      {
        comp_idno: ctx.comp_idno,
        tab,
        limit: page.limit,
        offset: page.offset,
        sort,
      }
    );

    const hasMore = rows.length > page.limit;
    const items = hasMore ? rows.slice(0, page.limit) : rows;

    // ✅ 서버에서 overdue/imminent 플래그 계산 후 주입
    const enhanced = items.map((row) => ({
      ...row,
      overdue: row.stat_code === "scheduled" && row.sche_date < kstMidnight,
      imminent:
        row.stat_code === "scheduled" && row.sche_date >= now && row.sche_date < imminentEnd,
    }));

    return {
      items: enhanced,
      page: { ...page, hasMore },
    };
  },
  // #endregion

  // #region statsSchedules
  async statsSchedules(ctx: ServiceCtx) {
    const db = getDb();

    const nowMs = Date.now();
    const now = new Date(nowMs);
    const imminentEnd = new Date(nowMs + 48 * 60 * 60 * 1000);

    const kstTodayMidnight = computeKstTodayMidnightDate(nowMs);

    // base status counts
    const byStatus = await scheduleRepo.countByStatus(
      { db },
      { comp_idno: ctx.comp_idno, onlyEnabled: true }
    );

    // time-based counts (scheduled only)
    const overdue = await scheduleRepo.countScheduledBefore(
      { db },
      { comp_idno: ctx.comp_idno, before: kstTodayMidnight, onlyEnabled: true }
    );

    const imminent = await scheduleRepo.countScheduledBetween(
      { db },
      { comp_idno: ctx.comp_idno, from: now, to: imminentEnd, onlyEnabled: true }
    );

    const scheduledTotal = byStatus.scheduled ?? 0;
    const completed = byStatus.completed ?? 0;
    const canceled = byStatus.canceled ?? 0;

    // UI 정책: "예정" 탭 = scheduled 중 overdue/imminent 제외
    const scheduled = Math.max(0, scheduledTotal - overdue - imminent);
    const all = scheduledTotal + completed + canceled;

    return { all, imminent, overdue, scheduled, completed, canceled };
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

      // 현재 정책: 담당자 = 자기 자신
      owne_idno: ctx.user_idno,

      sale_idno: input.sale_idno,
      clie_idno: input.clie_idno,
      clie_name: input.clie_name,

      sche_name: input.sche_name,
      sche_desc: input.sche_desc,

      sche_pric: toDecimalStrOrNull(input.sche_pric),
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

    // TS 에러 방지: union(spread) 금지, 안전 빌드
    const data: ScheduleUpdate = {};

    if (patch.sche_name !== undefined) data.sche_name = patch.sche_name;
    if (patch.sche_desc !== undefined) data.sche_desc = patch.sche_desc as any;

    const scheDate = parseDateOrNull(patch.sche_date);
    if (scheDate !== undefined) data.sche_date = scheDate as any;

    const schePric = toDecimalStrOrNull(patch.sche_pric);
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