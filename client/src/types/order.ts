import type { RouterOutputs } from "./router";
import type { DeliveryStatus } from "./delivery";

/** tRPC 응답에서 추론한 수주 행 타입 */
export type OrderRow = RouterOutputs["crm"]["order"]["list"]["items"][number];

export type OrderStatus = "proposal" | "negotiation" | "confirmed" | "canceled";

/** 수주 생성/수정 폼 상태 (Orders 페이지 전체 폼) */
export type OrderFormState = {
  clie_name: string;
  clie_idno?: number;
  prod_serv: string;
  orde_pric: string;
  stat_code: OrderStatus;
  ctrt_date: string;
  expd_date: string;
  orde_memo: string;
};

/** 수주에서 납품 생성 시 사용하는 폼 상태 */
export type OrderDeliveryFormState = {
  ship_pric: string;
  stat_code: DeliveryStatus;
  ship_date: string;
  ship_memo: string;
};

/** 일정(Promise)에서 빠르게 수주 생성하는 폼 상태 */
export type OrderQuickFormState = {
  prod_serv: string;
  orde_pric: string;
  stat_code: "proposal" | "negotiation" | "confirmed";
  ctrt_date: string;
  orde_memo: string;
};

export const orderStatusTabs: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "proposal", label: "제안" },
  { key: "negotiation", label: "협상" },
  { key: "confirmed", label: "확정" },
  { key: "canceled", label: "취소" },
];

export const orderStatusLabels: Record<OrderStatus, string> = {
  proposal: "제안",
  negotiation: "협상",
  confirmed: "확정",
  canceled: "취소",
};
