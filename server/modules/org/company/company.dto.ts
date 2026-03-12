// server/modules/org/company/company.dto.ts

import { z } from "zod";
import { IsoDateTime } from "../../crm/shared/dto";

// #region Shared
const InviteRoleSchema = z.enum(["admin", "member"]); // Input 전용: 초대 생성 시 허용 역할
const InviteRoleOutputSchema = z.enum(["owner", "admin", "member"]); // Output: DB 실제 값 허용
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

export const UpdateCompanyNameInput = z.object({
  comp_name: z.string().min(2).max(120),
});
// #endregion

// #region Outputs
export const MemberItemOutput = z.object({
  user_idno: z.number().int(),
  user_name: z.string().nullable(),
  mail_idno: z.string().nullable(),
  comp_role: CompanyRoleSchema,
  memb_stat: MemberStatSchema,
  crea_date: IsoDateTime,
});

export const CompanyItemOutput = z.object({
  comp_idno: z.number().int(),
  comp_name: z.string(),
  comp_role: CompanyRoleSchema,
  is_active: z.boolean(),
});

export const InviteItemOutput = z.object({
  invt_idno: z.number().int(),
  mail_idno: z.string().nullable(),
  comp_role: InviteRoleOutputSchema, // DB는 owner|admin|member 허용
  invt_stat: InviteStatSchema,
  expi_date: IsoDateTime,
  crea_date: IsoDateTime,
});

export const InviteInfoOutput = z.object({
  comp_name: z.string(),
  comp_role: InviteRoleOutputSchema,
  expi_date: IsoDateTime,
  invt_stat: InviteStatSchema,
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
  comp_role: CompanyRoleSchema,
});
// #endregion

// #region Service Contracts
export type CreateInvitePayload = z.infer<typeof CreateInviteInput>;
// #endregion
