import type { RouterOutputs } from "./router";

/** tRPC 응답에서 추론한 영업일지 행 타입 */
export type SalesLogRow = RouterOutputs["salesLogs"]["list"][number];

/** tRPC 응답에서 추론한 AI 분석 결과 타입 */
export type AnalyzeOutput = RouterOutputs["salesLogs"]["analyze"];

export type SalesFilter = "all" | "thisWeek" | "ai" | "audio";

export type AnalyzeBannerState = "idle" | "pending" | "success" | "error";

/** 영업일지 작성 폼 상태 */
export type SalesLogFormState = {
  clientName: string;
  clientId?: number;
  contactPerson: string;
  location: string;
  visitedAt: string;
  rawContent: string;
  audioUrl: string;
  transcribedText: string;
};

/** 영업일지 수정 폼 상태 */
export type SalesLogEditForm = {
  clientName: string;
  contactPerson: string;
  location: string;
  visitedAt: string;
  rawContent: string;
};

/** AI 분석 후 고객사 매칭 제안 */
export type MatchSuggestion = {
  logId: number;
  originalName: string;
  matchedId: number;
  matchedName: string;
};

/** 저장 전 고객사 매칭 확인 상태 */
export type PreSaveState = {
  typedName: string;
  matchedId: number;
  matchedName: string;
  analyze: boolean;
};
