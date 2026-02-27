import type { RouterOutputs } from "./router";

/** tRPC 응답에서 추론한 고객사 행 타입 */
export type ClientRow = RouterOutputs["clients"]["list"]["items"][number];

/** 고객사 생성/수정 폼 상태 */
export type ClientFormState = {
  clie_name: string;
  indu_type: string;
  cont_name: string;
  cont_tele: string;
  cont_mail: string;
  clie_addr: string;
  clie_memo: string;
};
