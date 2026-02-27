import OrdersList from "./orders-list";
import { useOrdersViewModel } from "@/hooks/focuswin/order/useOrdersViewModel";

type Props = { vm: ReturnType<typeof useOrdersViewModel> };

export default function OrderListContent({ vm }: Props) {
  return (
    <OrdersList
      orders={vm.orders!}
      formatKRW={vm.formatKRW}
      onEdit={vm.handleEdit}
      onDeleteRequest={vm.requestDelete}
      onStatusChange={vm.handleStatusChange}
      statusChanging={vm.updateMutation.isPending}
      onOpenDelivery={vm.openDeliveryForm}
    />
  );
}
