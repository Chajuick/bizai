// src/components/focuswin/order/list/Header.tsx

import StatCards from "@/components/focuswin/common/cards/stat-cards";
import TabPills from "@/components/focuswin/common/ui/tab-pills";
import DateRangeFilter from "@/components/focuswin/common/filters/date-range-filter";
import { useOrderListVM } from "@/hooks/focuswin/order/useOrderListVM";
import { formatKRW } from "@/lib/format";

type Props = { vm: ReturnType<typeof useOrderListVM> };

export default function OrderListHeader({ vm }: Props) {
  return (
    <>
      <StatCards
        cards={[
          { kicker: "PIPELINE", label: `전체 수주 · ${vm.dateRange.label}`, value: formatKRW(vm.stats.total) },
          { kicker: "CONFIRMED", label: "확정 수주", value: formatKRW(vm.stats.confirmed) },
        ]}
      />
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <DateRangeFilter
          range={vm.dateRange}
          onChange={vm.setDatePreset}
          onCustomRange={vm.setCustomRange}
        />
      </div>
      <div className="mt-3">
        <TabPills tabs={vm.tabs} value={vm.activeTab} onChange={vm.setActiveTab} />
      </div>
    </>
  );
}
