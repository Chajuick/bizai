// src/components/focuswin/order/list/HeadContent.tsx

// #region Imports
import StatCards from "@/components/focuswin/common/stat-cards";
import TabPills from "@/components/focuswin/common/ui/tab-pills";
import { useOrderListVM } from "@/hooks/focuswin/order/useOrderListVM";
// #endregion

type Props = { vm: ReturnType<typeof useOrderListVM> };

export default function OrderListHeader({ vm }: Props) {
  return (
    <>
      <StatCards
        cards={[
          { kicker: "PIPELINE", label: "전체 수주", value: vm.formatKRW(vm.stats.total) },
          { kicker: "CONFIRMED", label: "확정 수주", value: vm.formatKRW(vm.stats.confirmed) },
        ]}
      />
      <div className="mt-3">
        <TabPills tabs={vm.tabs} value={vm.activeTab} onChange={vm.setActiveTab} />
      </div>
    </>
  );
}