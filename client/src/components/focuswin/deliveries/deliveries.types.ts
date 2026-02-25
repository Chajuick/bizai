// client/src/components/focuswin/deliveries/deliveries.types.ts
export type DeliveryStatus = "pending" | "delivered" | "invoiced" | "paid";

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

export type DeliveryFormState = {
  orderId: string;
  clientName: string;
  revenueAmount: string;
  deliveryStatus: DeliveryStatus;
  deliveredAt: string;
  notes: string;
};

export type DeleteConfirmState = null | { id: number; title: string };
