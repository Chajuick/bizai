import DeliveryCard from "./delivery-card";
import { useDeliveriesViewModel } from "@/hooks/focuswin/shipment/useDeliveriesViewModel";

type Props = { vm: ReturnType<typeof useDeliveriesViewModel> };

export default function ShipListContent({ vm }: Props) {
  return (
    <DeliveryCard
      deliveries={vm.deliveries!}
      formatKRW={vm.formatKRW}
      onEdit={vm.handleEdit}
      onAskDelete={d => vm.setConfirmDelete({ id: (d as any).id, title: (d as any).clientName })}
      onStatusUpdate={vm.handleStatusUpdate}
      statusUpdatePending={vm.updateMutation.isPending}
    />
  );
}
