import StatCards from "@/components/focuswin/common/stat-cards";
import TabPills from "@/components/focuswin/common/ui/tab-pills";
import { useOrdersViewModel } from "@/hooks/focuswin/order/useOrdersViewModel";

type Props = { vm: ReturnType<typeof useOrdersViewModel> };

export default function OrderListHeadContent({ vm }: Props) {
  return (
    <>
      <StatCards
        cards={[
          { kicker: "PIPELINE", label: "전체 수주", value: vm.formatKRW(vm.stats.total) },
          { kicker: "CONFIRMED", label: "확정 수주", value: vm.formatKRW(vm.stats.confirmed) },
        ]}
      />
      <div className="mt-3">
        <TabPills tabs={vm.statusTabs} value={vm.activeTab} onChange={vm.setActiveTab} />
      </div>
    </>
  );
}
