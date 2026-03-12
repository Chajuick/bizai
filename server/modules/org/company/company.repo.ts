// server/modules/org/company/company.repo.ts

// #region Imports
import { and, asc, eq } from "drizzle-orm";

import {
  CORE_COMPANY,
  CORE_COMPANY_INVITE,
  CORE_COMPANY_USER,
  CORE_USER,
} from "../../../../drizzle/schema";
import { getInsertId } from "../../../core/db";
import type { DbOrTx } from "../../../core/db/tx";
// #endregion

// #region Types
type RepoDeps = { db: DbOrTx };

type MemberData = {
  comp_idno: number;
  user_idno: number;
  comp_role: "owner" | "admin" | "member";
  memb_stat: "active" | "pending" | "removed";
  crea_idno: number;
};

type MemberPatch = Partial<{
  comp_role: "owner" | "admin" | "member";
  memb_stat: "active" | "pending" | "removed";
  modi_idno: number;
}>;

type InviteData = {
  comp_idno: number;
  invt_kind: "link" | "email";
  invt_stat: "active";
  tokn_keys: string;
  mail_idno: string | null;
  comp_role: "admin" | "member";
  expi_date: Date;
  crea_idno: number;
};

type InvitePatch = Partial<{
  invt_stat: "active" | "used" | "revoked" | "expired";
  expi_date: Date;
  tokn_keys: string;
  used_date: Date;
  used_user: number;
  modi_idno: number;
}>;
// #endregion

// #region Repo
export const companyRepo = {
  // ───── Company ─────

  async findById({ db }: RepoDeps, comp_idno: number) {
    const rows = await db
      .select({
        comp_idno: CORE_COMPANY.comp_idno,
        comp_name: CORE_COMPANY.comp_name,
      })
      .from(CORE_COMPANY)
      .where(eq(CORE_COMPANY.comp_idno, comp_idno))
      .limit(1);
    return rows[0] ?? null;
  },

  // ───── Membership ─────

  async findMyCompanies({ db }: RepoDeps, user_idno: number) {
    return db
      .select({
        comp_idno: CORE_COMPANY_USER.comp_idno,
        comp_name: CORE_COMPANY.comp_name,
        comp_role: CORE_COMPANY_USER.comp_role,
        memb_stat: CORE_COMPANY_USER.memb_stat,
      })
      .from(CORE_COMPANY_USER)
      .innerJoin(CORE_COMPANY, eq(CORE_COMPANY_USER.comp_idno, CORE_COMPANY.comp_idno))
      .where(eq(CORE_COMPANY_USER.user_idno, user_idno));
  },

  async findMembership({ db }: RepoDeps, { comp_idno, user_idno }: { comp_idno: number; user_idno: number }) {
    const rows = await db
      .select()
      .from(CORE_COMPANY_USER)
      .where(and(eq(CORE_COMPANY_USER.comp_idno, comp_idno), eq(CORE_COMPANY_USER.user_idno, user_idno)))
      .limit(1);
    return rows[0] ?? null;
  },

  async findMembersByComp({ db }: RepoDeps, comp_idno: number) {
    return db
      .select({
        user_idno: CORE_COMPANY_USER.user_idno,
        comp_role: CORE_COMPANY_USER.comp_role,
        memb_stat: CORE_COMPANY_USER.memb_stat,
        crea_date: CORE_COMPANY_USER.crea_date,
        user_name: CORE_USER.user_name,
        mail_idno: CORE_USER.mail_idno,
      })
      .from(CORE_COMPANY_USER)
      .innerJoin(CORE_USER, eq(CORE_COMPANY_USER.user_idno, CORE_USER.user_idno))
      .where(
        and(
          eq(CORE_COMPANY_USER.comp_idno, comp_idno),
          eq(CORE_COMPANY_USER.memb_stat, "active"),
        ),
      )
      .orderBy(asc(CORE_COMPANY_USER.crea_date));
  },

  async createMembership({ db }: RepoDeps, data: MemberData) {
    await db.insert(CORE_COMPANY_USER).values(data);
  },

  async updateMembership(
    { db }: RepoDeps,
    { comp_idno, user_idno, data }: { comp_idno: number; user_idno: number; data: MemberPatch },
  ) {
    await db
      .update(CORE_COMPANY_USER)
      .set(data)
      .where(and(eq(CORE_COMPANY_USER.comp_idno, comp_idno), eq(CORE_COMPANY_USER.user_idno, user_idno)));
  },

  // ───── Company ─────

  async updateCompanyName(
    { db }: RepoDeps,
    { comp_idno, comp_name }: { comp_idno: number; comp_name: string }
  ) {
    await db
      .update(CORE_COMPANY)
      .set({
        comp_name,
      })
      .where(eq(CORE_COMPANY.comp_idno, comp_idno));
  },

  // ───── Invite ─────

  async findInviteByTokenHash({ db }: RepoDeps, tokenHash: string) {
    const rows = await db
      .select()
      .from(CORE_COMPANY_INVITE)
      .where(eq(CORE_COMPANY_INVITE.tokn_keys, tokenHash))
      .limit(1);
    return rows[0] ?? null;
  },

  async findInvitesByComp({ db }: RepoDeps, comp_idno: number) {
    return db
      .select()
      .from(CORE_COMPANY_INVITE)
      .where(
        and(eq(CORE_COMPANY_INVITE.comp_idno, comp_idno), eq(CORE_COMPANY_INVITE.invt_stat, "active")),
      )
      .orderBy(asc(CORE_COMPANY_INVITE.crea_date));
  },

  async createInvite({ db }: RepoDeps, data: InviteData) {
    const res = await db.insert(CORE_COMPANY_INVITE).values(data);
    return { invt_idno: getInsertId(res) };
  },

  async updateInvite({ db }: RepoDeps, { invt_idno, data }: { invt_idno: number; data: InvitePatch }) {
    await db
      .update(CORE_COMPANY_INVITE)
      .set(data)
      .where(eq(CORE_COMPANY_INVITE.invt_idno, invt_idno));
  },
};
// #endregion
