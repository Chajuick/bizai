// server/modules/crm/shipment/shipment.service.ts

// #region Imports
import type { ServiceCtx } from "../../../core/serviceCtx";
import { getDb } from "../../../core/db";

import { normalizePage } from "../shared/pagination";
import { withCreateAudit, withUpdateAudit } from "../shared/audit";

import { shipmentRepo } from "./shipment.repo";
import type { ShipmentCreatePayload, ShipmentListPayload, ShipmentUpdatePayload } from "./shipment.dto";
import type { InsertShipment } from "../../../../drizzle/schema";
// #endregion

// #region Date Utils
function toDateOrUndefined(v?: string) {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
// #endregion

// #region Status Transition Policy
/**
 * 상태 변경 시 날짜 자동 세팅 정책(정석)
 * - invc_date: stat_code가 invoiced(또는 paid로 직행)로 "처음" 들어갈 때
 * - paid_date: stat_code가 paid로 "처음" 들어갈 때
 *
 * 우선순위:
 * 1) 요청에서 invc_date/paid_date를 명시하면 그 값을 우선
 * 2) 요청에 없고, 기존 값도 없으면 now 자동 세팅
 * 3) 기존 값이 있으면 덮어쓰지 않음(안전)
 */
function applyStatusDates(params: {
  now: Date;
  prev: { stat_code?: string | null; invc_date?: Date | null; paid_date?: Date | null } | null;
  next: { stat_code?: "pending" | "delivered" | "invoiced" | "paid" | undefined };
  patch: {
    invc_date?: Date | null | undefined;
    paid_date?: Date | null | undefined;
  };
}) {
  const now = params.now;
  const prevStat: string | null = params.prev?.stat_code ?? null;
  const nextStat = params.next.stat_code;

  if (!nextStat) return;

  // invoiced 진입(또는 paid로 직행하면 청구일도 같이 세팅하는 옵션)
  const nextIsInvoicedOrPaid = nextStat === "invoiced" || nextStat === "paid";
  const prevWasInvoicedOrPaid = prevStat === "invoiced" || prevStat === "paid";

  if (nextIsInvoicedOrPaid && !prevWasInvoicedOrPaid) {
    // 요청이 우선, 없으면 기존 값 유지, 그것도 없으면 now
    if (params.patch.invc_date === undefined) {
      if (!params.prev?.invc_date) params.patch.invc_date = now;
    }
  }

  // paid 진입
  const prevWasPaid = prevStat === "paid";
  if (nextStat === "paid" && !prevWasPaid) {
    if (params.patch.paid_date === undefined) {
      if (!params.prev?.paid_date) params.patch.paid_date = now;
    }
  }
}
// #endregion

export const shipmentService = {
  // #region list
  async listShipments(ctx: ServiceCtx, input?: ShipmentListPayload) {
    const db = getDb();
    const page = normalizePage(input?.page ?? { limit: 20, offset: 0 });

    const rows = await shipmentRepo.list(
      { db },
      {
        comp_idno: ctx.comp_idno,
        orde_idno: input?.orde_idno,
        stat_code: input?.stat_code,
        search: input?.search,

        limit: page.limit,
        offset: page.offset,

        sort: input?.sort,
      }
    );

    const hasMore = rows.length > page.limit;
    return {
      items: hasMore ? rows.slice(0, page.limit) : rows,
      page: { ...page, hasMore },
    };
  },
  // #endregion

  // #region stats
  async statsShipments(ctx: ServiceCtx) {
    const db = getDb();
    const rows = await shipmentRepo.stats({ db }, { comp_idno: ctx.comp_idno });

    const counts = { all: 0, pending: 0, delivered: 0, invoiced: 0, paid: 0 };
    let totalPaid = 0;
    let totalPending = 0;

    for (const row of rows) {
      counts.all++;
      switch (row.stat_code) {
        case "pending":   counts.pending++;   break;
        case "delivered": counts.delivered++; break;
        case "invoiced":  counts.invoiced++;  break;
        case "paid":      counts.paid++;      break;
      }
      const price = Number(row.ship_pric || 0);
      if (row.stat_code === "paid") totalPaid += price;
      else totalPending += price;
    }

    return { ...counts, totalPaid, totalPending };
  },
  // #endregion

  // #region get
  async getShipment(ctx: ServiceCtx, ship_idno: number) {
    const db = getDb();
    return shipmentRepo.getById({ db }, { comp_idno: ctx.comp_idno, ship_idno });
  },
  // #endregion

  // #region create
  async createShipment(ctx: ServiceCtx, input: ShipmentCreatePayload) {
    const db = getDb();
    const now = new Date();

    const data = withCreateAudit(ctx, {
      comp_idno: ctx.comp_idno,
      owne_idno: ctx.user_idno,

      orde_idno: input.orde_idno,
      clie_idno: input.clie_idno,
      clie_name: input.clie_name,

      stat_code: input.stat_code,
      ship_pric: String(input.ship_pric),

      ship_date: toDateOrUndefined(input.ship_date),
      invc_date: toDateOrUndefined(input.invc_date),
      paid_date: toDateOrUndefined(input.paid_date),

      ship_memo: input.ship_memo,
      enab_yesn: true,
    });

    // 상태에 따라 날짜 자동 세팅(입력이 없을 때만)
    const patchDates: { invc_date?: Date; paid_date?: Date } = {};
    applyStatusDates({
      now,
      prev: null,
      next: { stat_code: input.stat_code },
      patch: patchDates,
    });

    const finalData = { ...data, ...patchDates };

    return shipmentRepo.create({ db }, finalData as InsertShipment);
  },
  // #endregion

  // #region update
  async updateShipment(ctx: ServiceCtx, ship_idno: number, patch: ShipmentUpdatePayload) {
    const db = getDb();
    const now = new Date();

    const prev = await shipmentRepo.getById({ db }, { comp_idno: ctx.comp_idno, ship_idno });
    if (!prev) return { success: false as const, reason: "not_found" as const };

    // 1) 입력 patch를 DB 타입으로 변환 (string 날짜/number 금액 → DB 타입)
    // ✅ 정책 E: spread 금지 — 수동 field-by-field 빌드
    const { ship_pric: rawPric, ship_date: rawShipDate, invc_date: rawInvcDate, paid_date: rawPaidDate } = patch;
    const data: Partial<InsertShipment> = {};

    // 필수 string (null 무시 — DB not-null 컬럼)
    if (patch.clie_name != null) data.clie_name = patch.clie_name;
    // nullable string
    if (patch.ship_memo !== undefined) data.ship_memo = patch.ship_memo ?? null;
    // enum / boolean
    if (patch.stat_code !== undefined) data.stat_code = patch.stat_code;
    if (patch.enab_yesn !== undefined) data.enab_yesn = patch.enab_yesn;
    // decimal
    if (rawPric !== undefined && rawPric !== null) data.ship_pric = String(rawPric);
    // dates — null은 undefined로 처리(toDateOrUndefined 시그니처 유지)
    if (rawShipDate !== undefined) data.ship_date = toDateOrUndefined(rawShipDate ?? undefined);
    if (rawInvcDate !== undefined) data.invc_date = toDateOrUndefined(rawInvcDate ?? undefined);
    if (rawPaidDate !== undefined) data.paid_date = toDateOrUndefined(rawPaidDate ?? undefined);

    // 2) 감사 컬럼(수정자/수정일)
    const audited = withUpdateAudit(ctx, data);

    // 3) 상태 변경에 따른 날짜 자동 세팅(요청이 없고 기존 값도 없을 때만)
    const autoDates: { invc_date?: Date; paid_date?: Date } = {};
    applyStatusDates({
      now,
      prev: {
        stat_code: prev.stat_code,
        invc_date: prev.invc_date,
        paid_date: prev.paid_date,
      },
      next: { stat_code: patch.stat_code },
      patch: autoDates,
    });

    const finalPatch = { ...audited, ...autoDates };

    await shipmentRepo.update({ db }, { comp_idno: ctx.comp_idno, ship_idno, data: finalPatch });
    return { success: true as const };
  },
  // #endregion

  // #region delete (soft)
  async disableShipment(ctx: ServiceCtx, ship_idno: number) {
    const db = getDb();

    const data = withUpdateAudit(ctx, { enab_yesn: false });

    await shipmentRepo.disable({ db }, { comp_idno: ctx.comp_idno, ship_idno, data });
    return { success: true as const };
  },
  // #endregion
} as const;