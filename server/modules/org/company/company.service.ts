// server/modules/org/company/company.service.ts

// #region Imports
import crypto from "crypto";
import type { ServiceCtx } from "../../../core/serviceCtx";
import { throwAppError } from "../../../core/trpc/appError";
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
  if (ctx.comp_role !== "owner" && ctx.comp_role !== "admin") {
    throwAppError({ tRPCCode: "FORBIDDEN", appCode: "ADMIN_REQUIRED", message: "관리자 권한이 필요합니다.", displayType: "toast", retryable: false });
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
      comp_role: (ctx.comp_role ?? "member") as "owner" | "admin" | "member",
    };
  },

  // ───── getMyCompanies ─────
  async getMyCompanies(user_idno: number) {
    const db = getDb();
    const rows = await companyRepo.findMyCompanies({ db }, user_idno);
    return rows.map((r) => ({
      comp_idno: r.comp_idno,
      comp_name: r.comp_name,
      comp_role: r.comp_role as "owner" | "admin" | "member",
      is_active: r.memb_stat === "active",
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
      comp_role: m.comp_role as "owner" | "admin" | "member",
      memb_stat: m.memb_stat as "active" | "pending" | "removed",
      crea_date: m.crea_date,
    }));
  },

  // ───── updateCompanyName ─────
  async updateCompanyName(ctx: ServiceCtx, comp_name: string) {
    requireAdmin(ctx);

    const name = comp_name.trim();

    if (name.length < 2) {
      throwAppError({ tRPCCode: "BAD_REQUEST", appCode: "COMPANY_NAME_TOO_SHORT", message: "팀 이름은 최소 2자 이상이어야 합니다.", displayType: "toast", retryable: false });
    }

    if (name.length > 120) {
      throwAppError({ tRPCCode: "BAD_REQUEST", appCode: "COMPANY_NAME_TOO_LONG", message: "팀 이름이 너무 깁니다.", displayType: "toast", retryable: false });
    }

    const db = getDb();

    await companyRepo.updateCompanyName(
      { db },
      {
        comp_idno: ctx.comp_idno,
        comp_name: name,
      },
    );

    return { success: true as const };
  },

  // ───── listInvites ─────
  async listInvites(ctx: ServiceCtx) {
    requireAdmin(ctx);
    const db = getDb();
    const rows = await companyRepo.findInvitesByComp({ db }, ctx.comp_idno);
    return rows.map((r) => ({
      invt_idno: r.invt_idno,
      mail_idno: r.mail_idno ?? null,
      comp_role: r.comp_role as "admin" | "member",
      invt_stat: r.invt_stat as "active" | "used" | "revoked" | "expired",
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
        invt_kind: "link",
        invt_stat: "active",
        tokn_keys: tokenHash,
        mail_idno: null,
        comp_role: input.role,
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
      throwAppError({ tRPCCode: "NOT_FOUND", appCode: "INVITE_NOT_FOUND", message: "초대장을 찾을 수 없습니다.", displayType: "toast", retryable: false });
    }

    const company = await companyRepo.findById({ db }, invite.comp_idno);

    // 상태 판정: invt_stat + 만료 시간 모두 체크
    const isExpiredByDate = new Date() > invite.expi_date;
    const effectiveStat =
      invite.invt_stat !== "active"
        ? invite.invt_stat
        : isExpiredByDate
          ? "expired"
          : "active";

    return {
      comp_name: company?.comp_name ?? "",
      comp_role: invite.comp_role as "admin" | "member",
      expi_date: invite.expi_date,
      invt_stat: effectiveStat as "active" | "used" | "revoked" | "expired",
    };
  },

  // ───── acceptInvite (authed) ─────
  async acceptInvite(user_idno: number, rawToken: string) {
    const db = getDb();
    const tokenHash = hashToken(rawToken);

    const invite = await companyRepo.findInviteByTokenHash({ db }, tokenHash);
    if (!invite) {
      throwAppError({ tRPCCode: "NOT_FOUND", appCode: "INVITE_NOT_FOUND", message: "초대장을 찾을 수 없습니다.", displayType: "toast", retryable: false });
    }
    if (invite.invt_stat !== "active") {
      throwAppError({ tRPCCode: "BAD_REQUEST", appCode: "INVITE_ALREADY_USED", message: "이미 사용되었거나 취소된 초대입니다.", displayType: "toast", retryable: false });
    }
    if (new Date() > invite.expi_date) {
      throwAppError({ tRPCCode: "BAD_REQUEST", appCode: "INVITE_EXPIRED", message: "초대 기간이 만료되었습니다.", displayType: "toast", retryable: false });
    }

    await tx(async (trx) => {
      const existing = await companyRepo.findMembership(
        { db: trx },
        { comp_idno: invite.comp_idno, user_idno },
      );

      if (existing) {
        if (existing.memb_stat === "active") {
          throwAppError({ tRPCCode: "CONFLICT", appCode: "ALREADY_MEMBER", message: "이미 해당 회사의 멤버입니다.", displayType: "toast", retryable: false });
        }
        // removed/pending → 재활성화
        await companyRepo.updateMembership(
          { db: trx },
          {
            comp_idno: invite.comp_idno,
            user_idno,
            data: {
              memb_stat: "active",
              comp_role: invite.comp_role as "admin" | "member",
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
            comp_role: invite.comp_role as "admin" | "member",
            memb_stat: "active",
            crea_idno: user_idno,
          },
        );
      }

      await companyRepo.updateInvite(
        { db: trx },
        {
          invt_idno: invite.invt_idno,
          data: {
            invt_stat: "used",
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
      throwAppError({ tRPCCode: "NOT_FOUND", appCode: "INVITE_NOT_FOUND", message: "초대장을 찾을 수 없습니다.", displayType: "toast", retryable: false });
    }

    await companyRepo.updateInvite(
      { db },
      { invt_idno, data: { invt_stat: "revoked", modi_idno: ctx.user_idno } },
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
      throwAppError({ tRPCCode: "NOT_FOUND", appCode: "INVITE_NOT_FOUND", message: "초대장을 찾을 수 없습니다.", displayType: "toast", retryable: false });
    }

    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expi_date = new Date(Date.now() + INVITE_EXPIRE_DAYS * 24 * 60 * 60 * 1000);

    await companyRepo.updateInvite(
      { db },
      {
        invt_idno,
        data: { tokn_keys: tokenHash, expi_date, invt_stat: "active", modi_idno: ctx.user_idno },
      },
    );

    return { token: rawToken };
  },

  // ───── removeMember ─────
  async removeMember(ctx: ServiceCtx, target_user_idno: number) {
    requireAdmin(ctx);
    if (target_user_idno === ctx.user_idno) {
      throwAppError({ tRPCCode: "BAD_REQUEST", appCode: "CANNOT_REMOVE_SELF", message: "자기 자신은 제거할 수 없습니다.", displayType: "toast", retryable: false });
    }

    const db = getDb();
    const membership = await companyRepo.findMembership(
      { db },
      { comp_idno: ctx.comp_idno, user_idno: target_user_idno },
    );

    if (!membership || membership.memb_stat !== "active") {
      throwAppError({ tRPCCode: "NOT_FOUND", appCode: "MEMBER_NOT_FOUND", message: "멤버를 찾을 수 없습니다.", displayType: "toast", retryable: false });
    }
    if (membership.comp_role === "owner") {
      throwAppError({ tRPCCode: "FORBIDDEN", appCode: "CANNOT_REMOVE_OWNER", message: "소유자는 제거할 수 없습니다.", displayType: "toast", retryable: false });
    }

    await companyRepo.updateMembership(
      { db },
      {
        comp_idno: ctx.comp_idno,
        user_idno: target_user_idno,
        data: { memb_stat: "removed", modi_idno: ctx.user_idno },
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

    if (!membership || membership.memb_stat !== "active") {
      throwAppError({ tRPCCode: "NOT_FOUND", appCode: "MEMBER_NOT_FOUND", message: "멤버를 찾을 수 없습니다.", displayType: "toast", retryable: false });
    }
    if (membership.comp_role === "owner") {
      throwAppError({ tRPCCode: "FORBIDDEN", appCode: "CANNOT_CHANGE_OWNER_ROLE", message: "소유자의 권한은 변경할 수 없습니다.", displayType: "toast", retryable: false });
    }

    await companyRepo.updateMembership(
      { db },
      {
        comp_idno: ctx.comp_idno,
        user_idno: target_user_idno,
        data: { comp_role: role, modi_idno: ctx.user_idno },
      },
    );
    return { success: true as const };
  },
};
// #endregion
