import type { RouterOutputs } from "./router";

/** tRPC 응답에서 추론한 일정 행 타입 */
export type PromiseRow = RouterOutputs["promises"]["list"]["items"][number];

/** 임박/지연 플래그가 추가된 클라이언트 전용 뷰 타입 */
export type EnhancedPromise = PromiseRow & { overdue: boolean; imminent: boolean };

export type PromiseStatus = "scheduled" | "completed" | "canceled" | "overdue";

/** 일정 목록 탭 키 */
export type PromiseTabKey = PromiseStatus | "all" | "imminent";

/** 일정 생성/수정 폼 상태 */
export type PromiseFormState = {
  clie_name: string;
  clie_idno?: number;
  sche_name: string;
  sche_desc: string;
  sche_date: string;
};

/** 일정 삭제/취소 확인 다이얼로그 상태 */
export type ConfirmState = null | {
  type: "delete" | "cancel";
  id: number;
  title: string;
};
