// components/focuswin/shipment/list/Content.tsx

import { PaginatedList } from "@/components/focuswin/common/page/list/paginated-list";
import { useShipmentListVM } from "@/hooks/focuswin/shipment/useShipmentListVM";
import ShipmentListItemCard from "./ItemCard";

type Props = { vm: ReturnType<typeof useShipmentListVM> };

export default function ShipListContent({ vm }: Props) {
  return (
    <PaginatedList
      items={vm.shipments}
      renderItem={(d) => (
        <ShipmentListItemCard
          key={d.ship_idno}
          delivery={d}
          formatKRW={vm.formatKRW}
          onEdit={vm.handleEdit}
          onAskDelete={vm.requestDelete}
          onStatusUpdate={vm.handleStatusUpdate}
          statusUpdatePending={vm.statusChanging}
        />
      )}
      hasMore={vm.hasMore}
      isLoadingMore={vm.isLoadingMore}
      onLoadMore={vm.loadMore}
      mode="button"
    />
  );
}
