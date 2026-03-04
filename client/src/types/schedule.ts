import type { RouterOutputs } from "./router";

/** tRPC 응답에서 추론한 일정 행 타입 (overdue/imminent 서버 계산 포함) */
export type ScheduleRow = RouterOutputs["crm"]["schedule"]["list"]["items"][number];

/** 서버 응답 타입과 동일 — overdue/imminent는 서버에서 계산됨 */
export type EnhancedSchedule = ScheduleRow;

export type ScheduleStatus = "scheduled" | "completed" | "canceled" | "overdue";

/** 일정 목록 탭 키 */
export type ScheduleTabKey = ScheduleStatus | "all" | "imminent";

/** 일정 생성/수정 폼 상태 */
export type ScheduleFormState = {
  clie_name: string;
  clie_idno?: number;
  sche_name: string;
  sche_desc: string;
  sche_date: string;
  stat_code?: "scheduled" | "completed" | "canceled";
};