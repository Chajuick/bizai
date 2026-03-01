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
  role_code: "owner" | "admin" | "member";
  status_code: "active" | "pending" | "removed";
  crea_idno: number;
};

type MemberPatch = Partial<{
  role_code: "owner" | "admin" | "member";
  status_code: "active" | "pending" | "removed";
  modi_idno: number;
}>;

type InviteData = {
  comp_idno: number;
  kind_code: "link" | "email";
  stat_code: "active";
  token_key: string;
  mail_idno: string | null;
  role_code: "admin" | "member";
  expi_date: Date;
  crea_idno: number;
};

type InvitePatch = Partial<{
  stat_code: "active" | "used" | "revoked" | "expired";
  expi_date: Date;
  token_key: string;
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
        role_code: CORE_COMPANY_USER.role_code,
        status_code: CORE_COMPANY_USER.status_code,
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
        role_code: CORE_COMPANY_USER.role_code,
        status_code: CORE_COMPANY_USER.status_code,
        crea_date: CORE_COMPANY_USER.crea_date,
        user_name: CORE_USER.user_name,
        mail_idno: CORE_USER.mail_idno,
      })
      .from(CORE_COMPANY_USER)
      .innerJoin(CORE_USER, eq(CORE_COMPANY_USER.user_idno, CORE_USER.user_idno))
      .where(
        and(
          eq(CORE_COMPANY_USER.comp_idno, comp_idno),
          eq(CORE_COMPANY_USER.status_code, "active"),
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

  // ───── Invite ─────

  async findInviteByTokenHash({ db }: RepoDeps, tokenHash: string) {
    const rows = await db
      .select()
      .from(CORE_COMPANY_INVITE)
      .where(eq(CORE_COMPANY_INVITE.token_key, tokenHash))
      .limit(1);
    return rows[0] ?? null;
  },

  async findInvitesByComp({ db }: RepoDeps, comp_idno: number) {
    return db
      .select()
      .from(CORE_COMPANY_INVITE)
      .where(
        and(eq(CORE_COMPANY_INVITE.comp_idno, comp_idno), eq(CORE_COMPANY_INVITE.stat_code, "active")),
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
