// server/modules/crm/order/order.service.ts

// #region Imports
import type { ServiceCtx } from "../../../core/serviceCtx";
import { getDb } from "../../../core/db";

import { normalizePage } from "../shared/pagination";
import { withCreateAudit, withUpdateAudit } from "../shared/audit";

import type {
  OrderCreatePayload,
  OrderUpdatePayload,
  OrderSort,
} from "./order.dto";
import { orderRepo, type OrderUpdate } from "./order.repo";
// #endregion

// #region Helpers
function parseDateOrNull(v: string | null | undefined): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;

  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) throw new Error("[order] Invalid date string.");
  return d;
}

function moneyToDecimalString(v: number): string {
  // 정석: decimal 컬럼은 string으로 넣는다.
  // (부동소수 오차 방지)
  return v.toFixed(2);
}
// #endregion

export const orderService = {
  // #region listOrders
  async listOrders(ctx: ServiceCtx, input?: any) {
    const db = getDb();

    const fallbackLimit = input?.limit;
    const page = normalizePage(input?.page ?? { limit: fallbackLimit ?? 20, offset: 0 });

    const sort: OrderSort | undefined = input?.sort
      ? { field: input.sort.field, dir: input.sort.dir }
      : undefined;

    const rows = await orderRepo.list(
      { db },
      {
        comp_idno: ctx.comp_idno,
        status: input?.status,
        search: input?.search,
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

  // #region getOrder
  async getOrder(ctx: ServiceCtx, orde_idno: number) {
    const db = getDb();
    return orderRepo.getById({ db }, { comp_idno: ctx.comp_idno, orde_idno });
  },
  // #endregion

  // #region createOrder
  async createOrder(ctx: ServiceCtx, input: OrderCreatePayload) {
    const db = getDb();

    const data = withCreateAudit(ctx, {
      comp_idno: ctx.comp_idno,

      // ✅ 현재 정책: 생성자 = 담당자
      owne_idno: ctx.user_idno,

      clie_idno: input.clie_idno,
      sale_idno: input.sale_idno,

      clie_name: input.clie_name,
      prod_serv: input.prod_serv,

      orde_pric: moneyToDecimalString(input.orde_pric),
      stat_code: input.stat_code,

      ctrt_date: parseDateOrNull(input.ctrt_date),
      expd_date: parseDateOrNull(input.expd_date),
      orde_memo: input.orde_memo,

      enab_yesn: true,
    });

    return orderRepo.create({ db }, data);
  },
  // #endregion

  // #region updateOrder
  async updateOrder(ctx: ServiceCtx, orde_idno: number, patch: OrderUpdatePayload) {
    const db = getDb();

    // ✅ union 타입 방지: patch를 그대로 spread하지 않음
    const data: OrderUpdate = {};

    if (patch.clie_idno !== undefined) data.clie_idno = patch.clie_idno as any;
    if (patch.sale_idno !== undefined) data.sale_idno = patch.sale_idno as any;

    if (patch.clie_name !== undefined) data.clie_name = patch.clie_name;
    if (patch.prod_serv !== undefined) data.prod_serv = patch.prod_serv;

    if (patch.orde_pric !== undefined) data.orde_pric = moneyToDecimalString(patch.orde_pric);

    if (patch.stat_code !== undefined) data.stat_code = patch.stat_code as any;

    const ctrt = parseDateOrNull(patch.ctrt_date);
    if (ctrt !== undefined) data.ctrt_date = ctrt as any;

    const expd = parseDateOrNull(patch.expd_date);
    if (expd !== undefined) data.expd_date = expd as any;

    if (patch.orde_memo !== undefined) data.orde_memo = patch.orde_memo as any;

    if (patch.enab_yesn !== undefined) data.enab_yesn = patch.enab_yesn;

    const audited = withUpdateAudit(ctx, data);

    await orderRepo.update({ db }, { comp_idno: ctx.comp_idno, orde_idno, data: audited });

    return { success: true as const };
  },
  // #endregion

  // #region disableOrder
  async disableOrder(ctx: ServiceCtx, orde_idno: number) {
    const db = getDb();

    const audited = withUpdateAudit(ctx, {});
    await orderRepo.disable({ db }, { comp_idno: ctx.comp_idno, orde_idno, data: audited });

    return { success: true as const };
  },
  // #endregion
} as const;