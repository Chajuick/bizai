/** 일정 삭제/취소 확인 다이얼로그 상태 */
export type ConfirmState = null | {
  type: "delete" | "cancel" | "complete";
  id: number;
  title: string;
};