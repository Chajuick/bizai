// server/core/serviceCtx.ts

// #region Imports
import type { AppRole, CompanyRole } from "./trpc/";
// #endregion

// #region Types
/**
 * ServiceCtx
 * - 모든 service 계층이 받는 "표준 컨텍스트"
 * - tRPC/Express와 무관하게 도메인 로직이 의존하는 최소 정보만 포함한다.
 *
 * 정석:
 * - router는 ctx를 ServiceCtx로 변환해서 service에 넘긴다.
 * - service는 repo를 조합해서 비즈니스 규칙을 수행한다.
 * - repo는 DB 쿼리만 수행한다.
 */
export type ServiceCtx = {
  comp_idno: number;
  user_idno: number;

  /**
   * 시스템(전역) 권한: user_auth 기반
   * - 시스템 운영 기능이 있을 때 사용
   */
  user_role?: AppRole;

  /**
   * 회사 멤버십 권한: role_code 기반
   * - 회사 설정/멤버 관리 등에서 사용
   */
  company_role?: CompanyRole | null;
};
// #endregion