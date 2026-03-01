// server/modules/org/bootstrap/bootstrap.repo.ts

// #region Imports
import { and, eq } from "drizzle-orm";

import {
  BILLING_PLAN,
  BILLING_SUBSCRIPTION,
  CORE_COMPANY,
  CORE_COMPANY_USER,
} from "../../../../drizzle/schema";
import type { Plan } from "../../../../drizzle/schema";
import { getInsertId } from "../../../core/db";
import type { DbOrTx } from "../../../core/db/tx";
// #endregion

type RepoDeps = { db: DbOrTx };

export const bootstrapRepo = {
  // ───── Membership ─────

  async findActiveMembership({ db }: RepoDeps, user_idno: number) {
    const rows = await db
      .select({
        comp_idno: CORE_COMPANY_USER.comp_idno,
        role_code: CORE_COMPANY_USER.role_code,
        crea_date: CORE_COMPANY_USER.crea_date,
      })
      .from(CORE_COMPANY_USER)
      .where(
        and(
          eq(CORE_COMPANY_USER.user_idno, user_idno),
          eq(CORE_COMPANY_USER.status_code, "active"),
        ),
      )
      .orderBy(CORE_COMPANY_USER.crea_date);
    return rows; // owner 우선은 service에서 정렬
  },

  async insertCompany(
    { db }: RepoDeps,
    data: { comp_name: string; bizn_numb: string; need_appr: number; invt_link_ok: number; invt_mail_ok: number },
  ) {
    const res = await db.insert(CORE_COMPANY).values(data);
    return getInsertId(res);
  },

  async findCompanyByBiznNumb({ db }: RepoDeps, bizn_numb: string) {
    const rows = await db
      .select({ comp_idno: CORE_COMPANY.comp_idno })
      .from(CORE_COMPANY)
      .where(eq(CORE_COMPANY.bizn_numb, bizn_numb))
      .limit(1);
    return rows[0] ?? null;
  },

  async insertCompanyUser(
    { db }: RepoDeps,
    data: { comp_idno: number; user_idno: number; role_code: "owner"; status_code: "active"; crea_idno: number },
  ) {
    await db.insert(CORE_COMPANY_USER).values(data);
  },

  // ───── Plan ─────

  async findPlanByCode({ db }: RepoDeps, plan_code: string): Promise<Plan | null> {
    const rows = await db
      .select()
      .from(BILLING_PLAN)
      .where(eq(BILLING_PLAN.plan_code, plan_code as Plan["plan_code"]))
      .limit(1);
    return rows[0] ?? null;
  },

  async insertPlan(
    { db }: RepoDeps,
    data: { plan_code: Plan["plan_code"]; plan_name: string; seat_limt: number; tokn_mont: number },
  ) {
    const res = await db.insert(BILLING_PLAN).values(data);
    return getInsertId(res);
  },

  // ───── Subscription ─────

  async findActiveSub({ db }: RepoDeps, comp_idno: number) {
    const rows = await db
      .select()
      .from(BILLING_SUBSCRIPTION)
      .where(
        and(
          eq(BILLING_SUBSCRIPTION.comp_idno, comp_idno),
          eq(BILLING_SUBSCRIPTION.subs_stat, "active"),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  },

  async insertSubscription(
    { db }: RepoDeps,
    data: {
      comp_idno: number;
      plan_idno: number;
      subs_stat: "active";
      star_date: Date;
      ends_date: Date;
      crea_idno: number;
    },
  ) {
    const res = await db.insert(BILLING_SUBSCRIPTION).values(data);
    return getInsertId(res);
  },
};
