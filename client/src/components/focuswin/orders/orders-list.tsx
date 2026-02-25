import OrderItemCard from "./order-item-card";
import type { OrderStatus } from "@/hooks/focuswin/orders/useOrdersViewModel";

export default function OrdersList({
  orders,
  formatKRW,
  onEdit,
  onDeleteRequest,
  onStatusChange,
  statusChanging,
  onOpenDelivery,
}: {
  orders: any[];
  formatKRW: (n: number) => string;
  onEdit: (order: any) => void;
  onDeleteRequest: (order: any) => void;
  onStatusChange: (id: number, status: OrderStatus) => void;
  statusChanging: boolean;
  onOpenDelivery: (order: any) => void;
}) {
  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <OrderItemCard
          key={order.id}
          order={order}
          formatKRW={formatKRW}
          onEdit={() => onEdit(order)}
          onDelete={() => onDeleteRequest(order)}
          onStatusChange={(s) => onStatusChange(order.id, s)}
          statusChanging={statusChanging}
          onOpenDelivery={() => onOpenDelivery(order)}
        />
      ))}
    </div>
  );
}