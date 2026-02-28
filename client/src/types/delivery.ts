import type { RouterOutputs } from "./router";

/** tRPC 응답에서 추론한 납품 행 타입 */
export type DeliveryRow = RouterOutputs["crm"]["shipment"]["list"]["items"][number];

export type DeliveryStatus = "pending" | "delivered" | "invoiced" | "paid";

/** 납품 생성/수정 폼 상태 */
export type DeliveryFormState = {
  orde_idno: string;
  clie_name: string;
  ship_pric: string;
  stat_code: DeliveryStatus;
  ship_date: string;
  ship_memo: string;
};

export type DeleteConfirmState = null | { id: number; title: string };

export const deliveryTabs: { key: DeliveryStatus | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pending", label: "대기" },
  { key: "delivered", label: "납품완료" },
  { key: "invoiced", label: "청구완료" },
  { key: "paid", label: "수금완료" },
];

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  pending: "대기",
  delivered: "납품완료",
  invoiced: "청구완료",
  paid: "수금완료",
};
