import type { RouterOutputs } from "./router";

/** tRPC 응답에서 추론한 고객사 행 타입 */
export type ClientRow = RouterOutputs["crm"]["client"]["list"]["items"][number];

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


export type ContactDraft = {
  // cont_idno가 있으면 기존, 없으면 신규
  cont_idno?: number;

  cont_name: string;
  cont_role: string;
  cont_tele: string;
  cont_mail: string;
  cont_memo: string;
  main_yesn: boolean;

  // 프론트 전용 상태
  _state: "keep" | "new" | "update" | "delete";
};

export type ClientDraft = {
  clie_idno?: number;
  clie_name: string;
  indu_type: string;
  clie_addr: string;
  clie_memo: string;
};