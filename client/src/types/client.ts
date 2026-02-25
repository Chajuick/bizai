import type { RouterOutputs } from "./router";

/** tRPC 응답에서 추론한 고객사 행 타입 */
export type ClientRow = RouterOutputs["clients"]["list"][number];

/** 고객사 생성/수정 폼 상태 */
export type ClientFormState = {
  name: string;
  industry: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  notes: string;
};
