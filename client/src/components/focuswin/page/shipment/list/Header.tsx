import StatCards from "@/components/focuswin/common/cards/stat-cards";
import TabPills from "@/components/focuswin/common/ui/tab-pills";
import { useShipmentListVM } from "@/hooks/focuswin/shipment/useShipmentListVM";

type Props = { vm: ReturnType<typeof useShipmentListVM> };

export default function ShipmentListHeader({ vm }: Props) {
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
        <TabPills tabs={vm.tabs} value={vm.activeTab} onChange={vm.setActiveTab} />
      </div>
    </>
  );
}
