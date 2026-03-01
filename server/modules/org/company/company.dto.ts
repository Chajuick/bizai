// server/modules/org/company/company.dto.ts

import { z } from "zod";

// #region Shared
const InviteRoleSchema = z.enum(["admin", "member"]);
const CompanyRoleSchema = z.enum(["owner", "admin", "member"]);
const InviteStatSchema = z.enum(["active", "used", "revoked", "expired"]);
const MemberStatSchema = z.enum(["active", "pending", "removed"]);
// #endregion

// #region Inputs
export const CreateInviteInput = z.object({
  role: InviteRoleSchema.default("member"),
});

export const GetInviteInfoInput = z.object({
  token: z.string().min(1),
});

export const AcceptInviteInput = z.object({
  token: z.string().min(1),
});

export const CancelInviteInput = z.object({
  invt_idno: z.number().int().positive(),
});

export const ResendInviteInput = z.object({
  invt_idno: z.number().int().positive(),
});

export const RemoveMemberInput = z.object({
  user_idno: z.number().int().positive(),
});

export const UpdateMemberRoleInput = z.object({
  user_idno: z.number().int().positive(),
  role: InviteRoleSchema, // owner 변경 불가
});
// #endregion

// #region Outputs
export const MemberItemOutput = z.object({
  user_idno: z.number().int(),
  user_name: z.string().nullable(),
  mail_idno: z.string().nullable(),
  role_code: CompanyRoleSchema,
  status_code: MemberStatSchema,
  crea_date: z.date(),
});

export const CompanyItemOutput = z.object({
  comp_idno: z.number().int(),
  comp_name: z.string(),
  role_code: CompanyRoleSchema,
  is_active: z.boolean(),
});

export const InviteItemOutput = z.object({
  invt_idno: z.number().int(),
  mail_idno: z.string().nullable(),
  role_code: InviteRoleSchema,
  stat_code: InviteStatSchema,
  expi_date: z.date(),
  crea_date: z.date(),
});

export const InviteInfoOutput = z.object({
  comp_name: z.string(),
  role_code: InviteRoleSchema,
  expi_date: z.date(),
  stat_code: InviteStatSchema,
});

export const CreateInviteOutput = z.object({
  invt_idno: z.number().int(),
  token: z.string(), // raw token — 한 번만 반환
});

export const AcceptInviteOutput = z.object({
  success: z.literal(true),
  comp_idno: z.number().int(),
});

export const CompanyContextOutput = z.object({
  comp_idno: z.number().int(),
  comp_name: z.string(),
  company_role: CompanyRoleSchema,
});
// #endregion

// #region Service Contracts
export type CreateInvitePayload = z.infer<typeof CreateInviteInput>;
// #endregion
