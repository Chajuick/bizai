// src/components/focuswin/order/list/Content.tsx

// #region Imports
import { PaginatedList } from "@/components/focuswin/common/paginated-list";
import { useOrderListVM } from "@/hooks/focuswin/order/useOrderListVM";
import OrderListItemCard from "./ItemCard";
// #endregion

type Props = { vm: ReturnType<typeof useOrderListVM> };

export default function OrderListContent({ vm }: Props) {
  return (
    <PaginatedList
      items={vm.orders}
      renderItem={(order) => (
        <OrderListItemCard
          key={order.orde_idno}
          order={order}
          formatKRW={vm.formatKRW}
          onEdit={() => vm.handleEdit(order)}
          onDelete={() => vm.requestDelete(order)}
          onStatusChange={(s) => vm.handleStatusChange(order.orde_idno, s)}
          statusChanging={vm.statusChanging}
          onOpenDelivery={() => vm.openDeliveryForm(order)}
        />
      )}
      hasMore={vm.hasMore}
      isLoadingMore={vm.isLoadingMore}
      onLoadMore={vm.loadMore}
      mode="button"
    />
  );
}