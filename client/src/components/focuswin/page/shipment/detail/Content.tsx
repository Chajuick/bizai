// components/focuswin/page/shipment/detail/Content.tsx

import type { useShipmentDetailVM } from "@/hooks/focuswin/shipment/useShipmentDetailVM";
import ShipmentDetailInfoCard from "./InfoCard";
import ShipmentDetailEditFormCard from "./EditFormCard";

type VM = ReturnType<typeof useShipmentDetailVM>;

export default function ShipmentDetailContent({ vm }: { vm: VM }) {
  if (!vm.shipment) return null;
  return (
    <div className="space-y-4">
      {vm.isEditing ? (
        <ShipmentDetailEditFormCard vm={vm} />
      ) : (
        <ShipmentDetailInfoCard vm={vm} />
      )}
    </div>
  );
}
