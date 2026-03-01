// server/modules/org/company/company.service.ts

// #region Imports
import crypto from "crypto";
import { TRPCError } from "@trpc/server";

import type { ServiceCtx } from "../../../core/serviceCtx";
import { getDb } from "../../../core/db";
import { tx } from "../../../core/db/tx";

import { companyRepo } from "./company.repo";
import type { CreateInvitePayload } from "./company.dto";
// #endregion

// #region Constants
const INVITE_EXPIRE_DAYS = 7;
// #endregion

// #region Token helpers
function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex"); // 64-char hex
}

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
// #endregion

// #region Permission helpers
function requireAdmin(ctx: ServiceCtx): void {
  if (ctx.company_role !== "owner" && ctx.company_role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
  }
}
// #endregion

// #region Service
export const companyService = {
  // ───── getMyCompanyContext ─────
  async getMyCompanyContext(ctx: ServiceCtx) {
    const db = getDb();
    const company = await companyRepo.findById({ db }, ctx.comp_idno);
    return {
      comp_idno: ctx.comp_idno,
      comp_name: company?.comp_name ?? "",
      company_role: (ctx.company_role ?? "member") as "owner" | "admin" | "member",
    };
  },

  // ───── getMyCompanies ─────
  async getMyCompanies(user_idno: number) {
    const db = getDb();
    const rows = await companyRepo.findMyCompanies({ db }, user_idno);
    return rows.map((r) => ({
      comp_idno: r.comp_idno,
      comp_name: r.comp_name,
      role_code: r.role_code as "owner" | "admin" | "member",
      is_active: r.status_code === "active",
    }));
  },

  // ───── getMembers ─────
  async getMembers(ctx: ServiceCtx) {
    const db = getDb();
    const members = await companyRepo.findMembersByComp({ db }, ctx.comp_idno);
    return members.map((m) => ({
      user_idno: m.user_idno,
      user_name: m.user_name ?? null,
      mail_idno: m.mail_idno ?? null,
      role_code: m.role_code as "owner" | "admin" | "member",
      status_code: m.status_code as "active" | "pending" | "removed",
      crea_date: m.crea_date,
    }));
  },

  // ───── listInvites ─────
  async listInvites(ctx: ServiceCtx) {
    requireAdmin(ctx);
    const db = getDb();
    const rows = await companyRepo.findInvitesByComp({ db }, ctx.comp_idno);
    return rows.map((r) => ({
      invt_idno: r.invt_idno,
      mail_idno: r.mail_idno ?? null,
      role_code: r.role_code as "admin" | "member",
      stat_code: r.stat_code as "active" | "used" | "revoked" | "expired",
      expi_date: r.expi_date,
      crea_date: r.crea_date,
    }));
  },

  // ───── createInvite ─────
  async createInvite(ctx: ServiceCtx, input: CreateInvitePayload) {
    requireAdmin(ctx);
    const db = getDb();

    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expi_date = new Date(Date.now() + INVITE_EXPIRE_DAYS * 24 * 60 * 60 * 1000);

    const { invt_idno } = await companyRepo.createInvite(
      { db },
      {
        comp_idno: ctx.comp_idno,
        kind_code: "link",
        stat_code: "active",
        token_key: tokenHash,
        mail_idno: null,
        role_code: input.role,
        expi_date,
        crea_idno: ctx.user_idno,
      },
    );

    return { invt_idno, token: rawToken };
  },

  // ───── getInviteInfo (public) ─────
  async getInviteInfo(rawToken: string) {
    const db = getDb();
    const tokenHash = hashToken(rawToken);

    const invite = await companyRepo.findInviteByTokenHash({ db }, tokenHash);
    if (!invite) {
      throw new TRPCError({ code: "NOT_FOUND", message: "초대장을 찾을 수 없습니다." });
    }

    const company = await companyRepo.findById({ db }, invite.comp_idno);

    // 상태 판정: stat_code + 만료 시간 모두 체크
    const isExpiredByDate = new Date() > invite.expi_date;
    const effectiveStat =
      invite.stat_code !== "active"
        ? invite.stat_code
        : isExpiredByDate
          ? "expired"
          : "active";

    return {
      comp_name: company?.comp_name ?? "",
      role_code: invite.role_code as "admin" | "member",
      expi_date: invite.expi_date,
      stat_code: effectiveStat as "active" | "used" | "revoked" | "expired",
    };
  },

  // ───── acceptInvite (authed) ─────
  async acceptInvite(user_idno: number, rawToken: string) {
    const db = getDb();
    const tokenHash = hashToken(rawToken);

    const invite = await companyRepo.findInviteByTokenHash({ db }, tokenHash);
    if (!invite) {
      throw new TRPCError({ code: "NOT_FOUND", message: "초대장을 찾을 수 없습니다." });
    }
    if (invite.stat_code !== "active") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "이미 사용되었거나 취소된 초대입니다." });
    }
    if (new Date() > invite.expi_date) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "초대 기간이 만료되었습니다." });
    }

    await tx(async (trx) => {
      const existing = await companyRepo.findMembership(
        { db: trx },
        { comp_idno: invite.comp_idno, user_idno },
      );

      if (existing) {
        if (existing.status_code === "active") {
          throw new TRPCError({ code: "CONFLICT", message: "이미 해당 회사의 멤버입니다." });
        }
        // removed/pending → 재활성화
        await companyRepo.updateMembership(
          { db: trx },
          {
            comp_idno: invite.comp_idno,
            user_idno,
            data: {
              status_code: "active",
              role_code: invite.role_code as "admin" | "member",
              modi_idno: user_idno,
            },
          },
        );
      } else {
        await companyRepo.createMembership(
          { db: trx },
          {
            comp_idno: invite.comp_idno,
            user_idno,
            role_code: invite.role_code as "admin" | "member",
            status_code: "active",
            crea_idno: user_idno,
          },
        );
      }

      await companyRepo.updateInvite(
        { db: trx },
        {
          invt_idno: invite.invt_idno,
          data: {
            stat_code: "used",
            used_date: new Date(),
            used_user: user_idno,
            modi_idno: user_idno,
          },
        },
      );
    });

    return { success: true as const, comp_idno: invite.comp_idno };
  },

  // ───── cancelInvite ─────
  async cancelInvite(ctx: ServiceCtx, invt_idno: number) {
    requireAdmin(ctx);
    const db = getDb();

    const invites = await companyRepo.findInvitesByComp({ db }, ctx.comp_idno);
    const invite = invites.find((i) => i.invt_idno === invt_idno);

    if (!invite) {
      throw new TRPCError({ code: "NOT_FOUND", message: "초대장을 찾을 수 없습니다." });
    }

    await companyRepo.updateInvite(
      { db },
      { invt_idno, data: { stat_code: "revoked", modi_idno: ctx.user_idno } },
    );
    return { success: true as const };
  },

  // ───── resendInvite ─────
  async resendInvite(ctx: ServiceCtx, invt_idno: number) {
    requireAdmin(ctx);
    const db = getDb();

    const invites = await companyRepo.findInvitesByComp({ db }, ctx.comp_idno);
    const invite = invites.find((i) => i.invt_idno === invt_idno);

    if (!invite) {
      throw new TRPCError({ code: "NOT_FOUND", message: "초대장을 찾을 수 없습니다." });
    }

    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expi_date = new Date(Date.now() + INVITE_EXPIRE_DAYS * 24 * 60 * 60 * 1000);

    await companyRepo.updateInvite(
      { db },
      {
        invt_idno,
        data: { token_key: tokenHash, expi_date, stat_code: "active", modi_idno: ctx.user_idno },
      },
    );

    return { token: rawToken };
  },

  // ───── removeMember ─────
  async removeMember(ctx: ServiceCtx, target_user_idno: number) {
    requireAdmin(ctx);
    if (target_user_idno === ctx.user_idno) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "자기 자신은 제거할 수 없습니다." });
    }

    const db = getDb();
    const membership = await companyRepo.findMembership(
      { db },
      { comp_idno: ctx.comp_idno, user_idno: target_user_idno },
    );

    if (!membership || membership.status_code !== "active") {
      throw new TRPCError({ code: "NOT_FOUND", message: "멤버를 찾을 수 없습니다." });
    }
    if (membership.role_code === "owner") {
      throw new TRPCError({ code: "FORBIDDEN", message: "소유자는 제거할 수 없습니다." });
    }

    await companyRepo.updateMembership(
      { db },
      {
        comp_idno: ctx.comp_idno,
        user_idno: target_user_idno,
        data: { status_code: "removed", modi_idno: ctx.user_idno },
      },
    );
    return { success: true as const };
  },

  // ───── updateMemberRole ─────
  async updateMemberRole(ctx: ServiceCtx, target_user_idno: number, role: "admin" | "member") {
    requireAdmin(ctx);
    const db = getDb();

    const membership = await companyRepo.findMembership(
      { db },
      { comp_idno: ctx.comp_idno, user_idno: target_user_idno },
    );

    if (!membership || membership.status_code !== "active") {
      throw new TRPCError({ code: "NOT_FOUND", message: "멤버를 찾을 수 없습니다." });
    }
    if (membership.role_code === "owner") {
      throw new TRPCError({ code: "FORBIDDEN", message: "소유자의 권한은 변경할 수 없습니다." });
    }

    await companyRepo.updateMembership(
      { db },
      {
        comp_idno: ctx.comp_idno,
        user_idno: target_user_idno,
        data: { role_code: role, modi_idno: ctx.user_idno },
      },
    );
    return { success: true as const };
  },
};
// #endregion
