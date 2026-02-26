import { mysqlEnum } from "drizzle-orm/mysql-core";

export const planCodeEnum = mysqlEnum("plan_code", [
  "free",
  "pro",
  "team",
  "enterprise",
]); // 요금제 코드

export const subStatusEnum = mysqlEnum("sub_status", [
  "active",
  "trialing",
  "canceled",
  "past_due",
  "inactive",
]); // 구독 상태

export const companyRoleEnum = mysqlEnum("company_role", [
  "owner",
  "admin",
  "member",
]); // 회사 내 역할

export const memberStatusEnum = mysqlEnum("member_status", [
  "active",   // 정상 멤버
  "pending",  // 승인 대기
  "removed",  // 탈퇴/제거(소프트)
]);

export const inviteKindEnum = mysqlEnum("invite_kind", [
  "link",   // 초대 링크
  "email",  // 이메일 초대
]);

export const inviteStatusEnum = mysqlEnum("invite_status", [
  "active",   // 사용 가능
  "used",     // 사용 완료
  "revoked",  // 철회
  "expired",  // 만료
]);

export const aiFeatureEnum = mysqlEnum("ai_feature", [
  "chat",
  "stt",
  "llm",
]); // AI 기능 구분

export const ledgerReasonEnum = mysqlEnum("ledger_reason", [
  "plan_monthly_grant",
  "topup_purchase",
  "usage_chat",
  "usage_stt",
  "usage_llm",
  "admin_adjust",
]); // 토큰 원장 사유

export const scheduleStatusEnum = mysqlEnum("schedule_status", [
  "scheduled",
  "completed",
  "canceled",
  "overdue",
]); // 약속(일정) 상태

export const orderStatusEnum = mysqlEnum("order_status", [
  "proposal",
  "negotiation",
  "confirmed",
  "canceled",
]); // 수주 상태

export const shipStatusEnum = mysqlEnum("ship_status", [
  "pending",
  "delivered",
  "invoiced",
  "paid",
]); // 납품/매출 상태

/** 파일이 "어디"에 붙었는지(도메인 엔티티 타입) */
export const fileRefTypeEnum = mysqlEnum("file_ref_type", [
  "sale_info",   // 영업일지
  "client",      // 고객
  "promise",     // 일정/약속
  "order",       // 수주
  "delivery",    // 납품/매출
]);

/** 파일 용도 라벨(옵션: 없으면 null) */
export const filePurpTypeEnum = mysqlEnum("file_purp_type", [
  "general",     // 일반 첨부
  "sale_audio",  // 영업일지 음성(녹취)
  "sale_image",  // 영업일지 이미지(현장 사진 등)
  "contract",    // 계약서
  "quote",       // 견적서
]);


/** 음성 처리 작업 상태 */
export const jobsStatusEnum = mysqlEnum("jobs_status", [
  "queued",   // 대기: 작업 생성됨, 아직 실행 전
  "running",  // 진행 중: STT/AI 처리 수행 중
  "done",     // 완료: 정상 처리 완료
  "failed",   // 실패: 처리 오류 발생(재시도 가능)
]);