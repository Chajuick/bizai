import OrderItemCard from "./order-item-card";
import type { OrderRow, OrderStatus } from "@/types/order";

export default function OrdersList({
  orders,
  formatKRW,
  onEdit,
  onDeleteRequest,
  onStatusChange,
  statusChanging,
  onOpenDelivery,
}: {
  orders: OrderRow[];
  formatKRW: (n: number) => string;
  onEdit: (order: OrderRow) => void;
  onDeleteRequest: (order: OrderRow) => void;
  onStatusChange: (id: number, status: OrderStatus) => void;
  statusChanging: boolean;
  onOpenDelivery: (order: OrderRow) => void;
}) {
  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <OrderItemCard
          key={order.orde_idno}
          order={order}
          formatKRW={formatKRW}
          onEdit={() => onEdit(order)}
          onDelete={() => onDeleteRequest(order)}
          onStatusChange={(s) => onStatusChange(order.orde_idno, s)}
          statusChanging={statusChanging}
          onOpenDelivery={() => onOpenDelivery(order)}
        />
      ))}
    </div>
  );
}