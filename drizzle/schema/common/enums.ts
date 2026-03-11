// server/drizzle/schema/common/enums.ts

import { mysqlEnum } from "drizzle-orm/mysql-core";

/**
 * ============================================================
 * ENUM VALUES (Type Source of Truth)
 * ------------------------------------------------------------
 * - Zod validation
 * - Service logic
 * - Frontend shared types
 * - 테스트 코드
 *
 * mysqlEnum은 DB 스키마 생성용일 뿐,
 * 애플리케이션에서 직접 쓰기에는 불편하다.
 *
 * 👉 반드시 값 배열을 먼저 정의하고,
 *    mysqlEnum은 그걸 기반으로 생성한다.
 * ============================================================
 */

// #region Plan (Billing)
export const PLAN_CODES = [
  "free",
  "pro",
  "team",
  "enterprise",
] as const;
// #endregion

// #region Subscription
export const SUB_STATUSES = [
  "active",
  "trialing",
  "canceled",
  "past_due",
  "inactive",
] as const;
// #endregion

// #region Company membership
export const COMPANY_ROLES = [
  "owner",
  "admin",
  "member",
] as const;

export const MEMBER_STATUSES = [
  "active",
  "pending",
  "removed",
] as const;
// #endregion

// #region Invite
export const INVITE_KINDS = [
  "link",
  "email",
] as const;

export const INVITE_STATUSES = [
  "active",
  "used",
  "revoked",
  "expired",
] as const;
// #endregion

// #region AI usage
export const AI_FEATURES = [
  "chat",
  "stt",
  "llm",
] as const;

export const LEDGER_REASONS = [
  "plan_monthly_grant",
  "topup_purchase",
  "usage_chat",
  "usage_stt",
  "usage_llm",
  "admin_adjust",
] as const;
// #endregion

// #region CRM action owner
export const ACTION_OWNERS = ["self", "client", "shared"] as const;
export type ActionOwner = typeof ACTION_OWNERS[number];
// #endregion

// #region CRM statuses
export const SCHEDULE_STATUSES = [
  "scheduled",
  "completed",
  "canceled",
  "overdue",
] as const;

export const ORDER_STATUSES = [
  "proposal",
  "negotiation",
  "confirmed",
  "canceled",
] as const;

export const SHIP_STATUSES = [
  "pending",
  "delivered",
  "invoiced",
  "paid",
] as const;
// #endregion

// #region File system
/**
 * file_ref_type
 * - 파일이 어떤 도메인 엔티티에 연결되는지
 * - CORE_FILE_LINK.refe_type
 */
export const FILE_REF_TYPES = [
  "sale_info", // 영업일지
  "client",    // 거래처
  "promise",   // 일정/약속
  "order",     // 수주
  "delivery",  // 납품/매출
] as const;

/**
 * file_purp_type
 * - 파일의 용도 라벨 (optional)
 * - UI/정렬/검색에 사용 가능
 */
export const FILE_PURP_TYPES = [
  "general",     // 일반 첨부
  "sale_audio",  // 영업일지 음성
  "sale_image",  // 영업일지 사진
  "contract",    // 계약서
  "quote",       // 견적서
] as const;
// #endregion

// #region Job status (AI processing)
export const JOB_STATUSES = [
  "queued",   // 대기
  "running",  // 처리 중
  "done",     // 완료
  "failed",   // 실패
] as const;
// #endregion

// #region Sale AI status
export const AI_STATUSES = [
  "pending",    // 분석 대기 (생성 직후 / 재시도 대기)
  "processing", // 분석 진행 중
  "completed",  // 분석 완료
  "failed",     // 분석 실패 (재시도 가능)
] as const;
export type AiStatus = typeof AI_STATUSES[number];
// #endregion



/**
 * ============================================================
 * MYSQL ENUM BUILDERS (DB Schema)
 * ------------------------------------------------------------
 * - Drizzle에서 테이블 생성 시 사용
 * - 절대 애플리케이션 로직에서 직접 사용하지 말 것
 * ============================================================
 */

// #region Billing enums
export const planCodeEnum = mysqlEnum("plan_code", PLAN_CODES);
export const subStatusEnum = mysqlEnum("sub_status", SUB_STATUSES);
// #endregion

// #region Company enums
export const companyRoleEnum = mysqlEnum("company_role", COMPANY_ROLES);
export const memberStatusEnum = mysqlEnum("member_status", MEMBER_STATUSES);
// #endregion

// #region Invite enums
export const inviteKindEnum = mysqlEnum("invite_kind", INVITE_KINDS);
export const inviteStatusEnum = mysqlEnum("invite_status", INVITE_STATUSES);
// #endregion

// #region AI enums
export const aiFeatureEnum = mysqlEnum("ai_feature", AI_FEATURES);
export const ledgerReasonEnum = mysqlEnum("ledger_reason", LEDGER_REASONS);
// #endregion

// #region CRM enums
export const scheduleStatusEnum = mysqlEnum("schedule_status", SCHEDULE_STATUSES);
export const orderStatusEnum = mysqlEnum("order_status", ORDER_STATUSES);
export const shipStatusEnum = mysqlEnum("ship_status", SHIP_STATUSES);
// #endregion

// #region File enums
export const fileRefTypeEnum = mysqlEnum("file_ref_type", FILE_REF_TYPES);
export const filePurpTypeEnum = mysqlEnum("file_purp_type", FILE_PURP_TYPES);
// #endregion

// #region Job enums
export const jobsStatusEnum = mysqlEnum("jobs_status", JOB_STATUSES);
// #endregion

// #region Sale AI status enums
export const aiStatusEnum = mysqlEnum("ai_status", AI_STATUSES);
// #endregion