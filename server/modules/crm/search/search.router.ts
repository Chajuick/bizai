// server/modules/crm/search/search.router.ts

import { z } from "zod";
import { and, eq, like, or, desc } from "drizzle-orm";
import { protectedProcedure, router } from "../../../core/trpc";
import { svcCtxFromTrpc } from "../../../core/svcCtx";
import { getDb } from "../../../core/db";
import {
  CRM_CLIENT,
  CRM_ORDER,
  CRM_SHIPMENT,
  CRM_SCHEDULE,
  CRM_EXPENSE,
} from "../../../../drizzle/schema";
import { escapeLike } from "../shared/like";

const LIMIT = 5;

export const searchRouter = router({
  query: protectedProcedure
    .input(z.object({ q: z.string().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      const { comp_idno } = svcCtxFromTrpc(ctx);
      const db = getDb();
      const pattern = `%${escapeLike(input.q.trim())}%`;

      const [clients, orders, shipments, schedules, expenses] = await Promise.all([
        // 거래처
        db
          .select({
            clie_idno: CRM_CLIENT.clie_idno,
            clie_name: CRM_CLIENT.clie_name,
            clie_type: CRM_CLIENT.clie_type,
          })
          .from(CRM_CLIENT)
          .where(
            and(
              eq(CRM_CLIENT.comp_idno, comp_idno),
              eq(CRM_CLIENT.enab_yesn, true),
              like(CRM_CLIENT.clie_name, pattern)
            )
          )
          .orderBy(desc(CRM_CLIENT.modi_date))
          .limit(LIMIT),

        // 수주
        db
          .select({
            orde_idno: CRM_ORDER.orde_idno,
            clie_name: CRM_ORDER.clie_name,
            prod_serv: CRM_ORDER.prod_serv,
            orde_stat: CRM_ORDER.orde_stat,
            orde_pric: CRM_ORDER.orde_pric,
          })
          .from(CRM_ORDER)
          .where(
            and(
              eq(CRM_ORDER.comp_idno, comp_idno),
              eq(CRM_ORDER.enab_yesn, true),
              or(
                like(CRM_ORDER.clie_name, pattern),
                like(CRM_ORDER.prod_serv, pattern),
                like(CRM_ORDER.orde_memo, pattern)
              )
            )
          )
          .orderBy(desc(CRM_ORDER.modi_date))
          .limit(LIMIT),

        // 납품
        db
          .select({
            ship_idno: CRM_SHIPMENT.ship_idno,
            clie_name: CRM_SHIPMENT.clie_name,
            ship_stat: CRM_SHIPMENT.ship_stat,
            ship_pric: CRM_SHIPMENT.ship_pric,
            ship_date: CRM_SHIPMENT.ship_date,
          })
          .from(CRM_SHIPMENT)
          .where(
            and(
              eq(CRM_SHIPMENT.comp_idno, comp_idno),
              eq(CRM_SHIPMENT.enab_yesn, true),
              or(
                like(CRM_SHIPMENT.clie_name, pattern),
                like(CRM_SHIPMENT.ship_memo, pattern)
              )
            )
          )
          .orderBy(desc(CRM_SHIPMENT.ship_date))
          .limit(LIMIT),

        // 일정
        db
          .select({
            sche_idno: CRM_SCHEDULE.sche_idno,
            sche_name: CRM_SCHEDULE.sche_name,
            clie_name: CRM_SCHEDULE.clie_name,
            sche_date: CRM_SCHEDULE.sche_date,
            sche_stat: CRM_SCHEDULE.sche_stat,
          })
          .from(CRM_SCHEDULE)
          .where(
            and(
              eq(CRM_SCHEDULE.comp_idno, comp_idno),
              eq(CRM_SCHEDULE.enab_yesn, true),
              or(
                like(CRM_SCHEDULE.sche_name, pattern),
                like(CRM_SCHEDULE.clie_name, pattern)
              )
            )
          )
          .orderBy(desc(CRM_SCHEDULE.sche_date))
          .limit(LIMIT),

        // 지출
        db
          .select({
            expe_idno: CRM_EXPENSE.expe_idno,
            expe_name: CRM_EXPENSE.expe_name,
            clie_name: CRM_EXPENSE.clie_name,
            expe_amnt: CRM_EXPENSE.expe_amnt,
            expe_date: CRM_EXPENSE.expe_date,
          })
          .from(CRM_EXPENSE)
          .where(
            and(
              eq(CRM_EXPENSE.comp_idno, comp_idno),
              eq(CRM_EXPENSE.enab_yesn, true),
              or(
                like(CRM_EXPENSE.expe_name, pattern),
                like(CRM_EXPENSE.clie_name, pattern),
                like(CRM_EXPENSE.expe_memo, pattern)
              )
            )
          )
          .orderBy(desc(CRM_EXPENSE.expe_date))
          .limit(LIMIT),
      ]);

      return { clients, orders, shipments, schedules, expenses };
    }),
});
