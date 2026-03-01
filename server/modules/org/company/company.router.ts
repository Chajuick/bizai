// server/modules/org/company/company.router.ts

// #region Imports
import {
  authedProcedure,
  companyAdminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "../../../core/trpc";
import { svcCtxFromTrpc } from "../../../core/svcCtx";

import {
  AcceptInviteInput,
  AcceptInviteOutput,
  CancelInviteInput,
  CompanyContextOutput,
  CompanyItemOutput,
  CreateInviteInput,
  CreateInviteOutput,
  GetInviteInfoInput,
  InviteInfoOutput,
  InviteItemOutput,
  MemberItemOutput,
  RemoveMemberInput,
  ResendInviteInput,
  UpdateMemberRoleInput,
} from "./company.dto";
import { companyService } from "./company.service";
import { z } from "zod";
// #endregion

// #region Router
export const companyRouter = router({
  // ─────── Company context (현재 워크스페이스 정보) ───────
  getMyCompanyContext: protectedProcedure
    .output(CompanyContextOutput)
    .query(({ ctx }) => companyService.getMyCompanyContext(svcCtxFromTrpc(ctx))),

  // ─────── My companies (comp_idno 불필요, 신규 유저도 OK) ───────
  getMyCompanies: authedProcedure
    .output(z.array(CompanyItemOutput))
    .query(({ ctx }) => companyService.getMyCompanies(ctx.user.user_idno)),

  // ─────── Member management ───────
  getMembers: protectedProcedure
    .output(z.array(MemberItemOutput))
    .query(({ ctx }) => companyService.getMembers(svcCtxFromTrpc(ctx))),

  listInvites: companyAdminProcedure
    .output(z.array(InviteItemOutput))
    .query(({ ctx }) => companyService.listInvites(svcCtxFromTrpc(ctx))),

  removeMember: companyAdminProcedure
    .input(RemoveMemberInput)
    .mutation(({ ctx, input }) => companyService.removeMember(svcCtxFromTrpc(ctx), input.user_idno)),

  updateMemberRole: companyAdminProcedure
    .input(UpdateMemberRoleInput)
    .mutation(({ ctx, input }) =>
      companyService.updateMemberRole(svcCtxFromTrpc(ctx), input.user_idno, input.role),
    ),

  // ─────── Invite management (admin only) ───────
  createInvite: companyAdminProcedure
    .input(CreateInviteInput)
    .output(CreateInviteOutput)
    .mutation(({ ctx, input }) => companyService.createInvite(svcCtxFromTrpc(ctx), input)),

  cancelInvite: companyAdminProcedure
    .input(CancelInviteInput)
    .mutation(({ ctx, input }) => companyService.cancelInvite(svcCtxFromTrpc(ctx), input.invt_idno)),

  resendInvite: companyAdminProcedure
    .input(ResendInviteInput)
    .mutation(({ ctx, input }) => companyService.resendInvite(svcCtxFromTrpc(ctx), input.invt_idno)),

  // ─────── Invite accept (public info + authed accept) ───────
  getInviteInfo: publicProcedure
    .input(GetInviteInfoInput)
    .output(InviteInfoOutput)
    .query(({ input }) => companyService.getInviteInfo(input.token)),

  acceptInvite: authedProcedure
    .input(AcceptInviteInput)
    .output(AcceptInviteOutput)
    .mutation(({ ctx, input }) => companyService.acceptInvite(ctx.user.user_idno, input.token)),
});
// #endregion
