// server/modules/billing/billing.repo.ts

// #region Imports
import { and, count, desc, eq, or, lte } from "drizzle-orm";

import {
  BILLING_PLAN,
  BILLING_SUBSCRIPTION,
  CORE_COMPANY_USER,
} from "../../../drizzle/schema";
import type { Plan, Subscription, InsertSubscription } from "../../../drizzle/schema";
import type { DbOrTx } from "../../core/db/tx";
// #endregion

type RepoDeps = { db: DbOrTx };

export const billingRepo = {
  // #region Subscription queries
  async findActiveSubWithPlan({ db }: RepoDeps, comp_idno: number) {
    const rows = await db
      .select({
        subs_idno: BILLING_SUBSCRIPTION.subs_idno,
        comp_idno: BILLING_SUBSCRIPTION.comp_idno,
        subs_stat: BILLING_SUBSCRIPTION.subs_stat,
        seat_ovrr: BILLING_SUBSCRIPTION.seat_ovrr,
        tokn_ovrr: BILLING_SUBSCRIPTION.tokn_ovrr,
        star_date: BILLING_SUBSCRIPTION.star_date,
        ends_date: BILLING_SUBSCRIPTION.ends_date,

        plan_idno: BILLING_PLAN.plan_idno,
        plan_code: BILLING_PLAN.plan_code,
        plan_name: BILLING_PLAN.plan_name,
        seat_limt: BILLING_PLAN.seat_limt,
        tokn_mont: BILLING_PLAN.tokn_mont,
      })
      .from(BILLING_SUBSCRIPTION)
      .innerJoin(BILLING_PLAN, eq(BILLING_SUBSCRIPTION.plan_idno, BILLING_PLAN.plan_idno))
      .where(
        and(
          eq(BILLING_SUBSCRIPTION.comp_idno, comp_idno),
          eq(BILLING_SUBSCRIPTION.subs_stat, "active"),
        ),
      )
      .orderBy(desc(BILLING_SUBSCRIPTION.subs_idno))
      .limit(1);

    return rows[0] ?? null;
  },

  // ✅ Summary 화면/상태표시용: canceled(해지예약) 포함
  async findCurrentSubWithPlan({ db }: RepoDeps, comp_idno: number) {
    const rows = await db
      .select({
        subs_idno: BILLING_SUBSCRIPTION.subs_idno,
        comp_idno: BILLING_SUBSCRIPTION.comp_idno,
        subs_stat: BILLING_SUBSCRIPTION.subs_stat,
        seat_ovrr: BILLING_SUBSCRIPTION.seat_ovrr,
        tokn_ovrr: BILLING_SUBSCRIPTION.tokn_ovrr,
        star_date: BILLING_SUBSCRIPTION.star_date,
        ends_date: BILLING_SUBSCRIPTION.ends_date,

        plan_idno: BILLING_PLAN.plan_idno,
        plan_code: BILLING_PLAN.plan_code,
        plan_name: BILLING_PLAN.plan_name,
        seat_limt: BILLING_PLAN.seat_limt,
        tokn_mont: BILLING_PLAN.tokn_mont,
      })
      .from(BILLING_SUBSCRIPTION)
      .innerJoin(BILLING_PLAN, eq(BILLING_SUBSCRIPTION.plan_idno, BILLING_PLAN.plan_idno))
      .where(
        and(
          eq(BILLING_SUBSCRIPTION.comp_idno, comp_idno),
          or(
            eq(BILLING_SUBSCRIPTION.subs_stat, "active"),
            eq(BILLING_SUBSCRIPTION.subs_stat, "trialing"),
            eq(BILLING_SUBSCRIPTION.subs_stat, "past_due"),
            eq(BILLING_SUBSCRIPTION.subs_stat, "canceled"),
            eq(BILLING_SUBSCRIPTION.subs_stat, "inactive"),
          ),
        ),
      )
      .orderBy(desc(BILLING_SUBSCRIPTION.subs_idno))
      .limit(1);

    return rows[0] ?? null;
  },

  // ✅ 만료된 해지예약 구독(기간 종료) 대상
  async findExpiredCanceledSubs({ db }: RepoDeps, now: Date) {
    return db
      .select({
        subs_idno: BILLING_SUBSCRIPTION.subs_idno,
        comp_idno: BILLING_SUBSCRIPTION.comp_idno,
        plan_idno: BILLING_SUBSCRIPTION.plan_idno,
        ends_date: BILLING_SUBSCRIPTION.ends_date,
      })
      .from(BILLING_SUBSCRIPTION)
      .where(
        and(
          eq(BILLING_SUBSCRIPTION.subs_stat, "canceled"),
          lte(BILLING_SUBSCRIPTION.ends_date, now),
        ),
      )
      .orderBy(desc(BILLING_SUBSCRIPTION.subs_idno));
  },
  // #endregion

  // #region Plans
  async findAllPlans({ db }: RepoDeps): Promise<Plan[]> {
    return db.select().from(BILLING_PLAN).orderBy(BILLING_PLAN.plan_idno);
  },

  async findPlanByCode({ db }: RepoDeps, plan_code: Plan["plan_code"]): Promise<Plan | null> {
    const rows = await db
      .select()
      .from(BILLING_PLAN)
      .where(eq(BILLING_PLAN.plan_code, plan_code))
      .limit(1);
    return rows[0] ?? null;
  },
  // #endregion

  // #region Subscription mutations
  async createSubscription({ db }: RepoDeps, data: InsertSubscription) {
    await db.insert(BILLING_SUBSCRIPTION).values(data);
  },

  async updateSubPlan(
    { db }: RepoDeps,
    data: { subs_idno: number; plan_idno: number; star_date: Date; ends_date: Date; modi_idno: number },
  ) {
    await db
      .update(BILLING_SUBSCRIPTION)
      .set({
        plan_idno: data.plan_idno,
        star_date: data.star_date,
        ends_date: data.ends_date,
        modi_idno: data.modi_idno,
      })
      .where(eq(BILLING_SUBSCRIPTION.subs_idno, data.subs_idno));
  },

  async updateSubStat(
    { db }: RepoDeps,
    data: { subs_idno: number; subs_stat: Subscription["subs_stat"]; modi_idno: number },
  ) {
    await db
      .update(BILLING_SUBSCRIPTION)
      .set({ subs_stat: data.subs_stat, modi_idno: data.modi_idno })
      .where(eq(BILLING_SUBSCRIPTION.subs_idno, data.subs_idno));
  },
  // #endregion

  // #region Member count
  async countActiveMembers({ db }: RepoDeps, comp_idno: number): Promise<number> {
    const rows = await db
      .select({ cnt: count() })
      .from(CORE_COMPANY_USER)
      .where(
        and(
          eq(CORE_COMPANY_USER.comp_idno, comp_idno),
          eq(CORE_COMPANY_USER.status_code, "active"),
        ),
      );
    return rows[0]?.cnt ?? 0;
  },
  // #endregion
};

// Re-export for convenience
export type { Plan, Subscription };