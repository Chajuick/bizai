import StatCards from "@/components/focuswin/common/stat-cards";
import TabPills from "@/components/focuswin/common/ui/tab-pills";
import { deliveryTabs } from "@/types/delivery";
import { useDeliveriesViewModel } from "@/hooks/focuswin/shipment/useDeliveriesViewModel";

type Props = { vm: ReturnType<typeof useDeliveriesViewModel> };

export default function ShipListHeadContent({ vm }: Props) {
  return (
    <>
      {vm.hasData && (
        <StatCards
          cards={[
            { kicker: "PAID", label: "수금 완료", value: vm.formatKRW(vm.stats.paid) },
            { kicker: "PENDING", label: "미수금", value: vm.formatKRW(vm.stats.pending) },
          ]}
        />
      )}
      <div className="mt-3">
        <TabPills tabs={deliveryTabs} value={vm.activeTab} onChange={vm.setActiveTab} />
      </div>
    </>
  );
}
