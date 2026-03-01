import type { RouterOutputs } from "./router";

/** tRPC 응답에서 추론한 영업일지 행 타입 */
export type SalesLogRow = RouterOutputs["crm"]["sale"]["list"]["items"][number];

/** tRPC 응답에서 추론한 AI 분석 결과 타입 */
export type AnalyzeOutput = RouterOutputs["crm"]["sale"]["analyze"];

export type SalesFilter = "all" | "thisWeek" | "ai";

export type AnalyzeBannerState = "idle" | "pending" | "success" | "error";

/** 영업일지 작성 폼 상태 */
export type SalesLogFormState = {
  clie_name: string;
  clie_idno?: number;
  cont_name: string;
  sale_loca: string;
  vist_date: string;
  orig_memo: string;
  audi_addr: string;
  sttx_text: string;
};

/** 영업일지 수정 폼 상태 */
export type SalesLogEditForm = {
  clie_name: string;
  clie_idno?: number;
  cont_name: string;
  sale_loca: string;
  vist_date: string;
  orig_memo: string;
};

/** 저장 전 고객사 매칭 확인 상태 */
export type PreSaveState = {
  typedName: string;
  matchedId: number;
  matchedName: string;
  analyze: boolean;
};
