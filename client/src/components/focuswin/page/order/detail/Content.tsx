// components/focuswin/page/order/detail/Content.tsx

import type { useOrderDetailVM } from "@/hooks/focuswin/order/useOrderDetailVM";
import OrderDetailInfoCard from "./InfoCard";
import OrderDetailEditFormCard from "./EditFormCard";
import OrderDetailShipmentsCard from "./ShipmentsCard";

type VM = ReturnType<typeof useOrderDetailVM>;

export default function OrderDetailContent({ vm }: { vm: VM }) {
  if (!vm.order) return null;

  return (
    <div className="space-y-4">
      {vm.isEditing ? (
        <OrderDetailEditFormCard form={vm.form} setForm={vm.setForm} />
      ) : (
        <OrderDetailInfoCard vm={vm} />
      )}
      <OrderDetailShipmentsCard vm={vm} />
    </div>
  );
}
