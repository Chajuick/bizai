// client/src/components/focuswin/page/shipment/list/Header.tsx

import StatCards from "@/components/focuswin/common/cards/stat-cards";
import TabPills from "@/components/focuswin/common/ui/tab-pills";
import DateRangeFilter from "@/components/focuswin/common/filters/date-range-filter";
import { useShipmentListVM } from "@/hooks/focuswin/shipment/useShipmentListVM";
import { formatKRW } from "@/lib/format";

type Props = { vm: ReturnType<typeof useShipmentListVM> };

export default function ShipmentListHeader({ vm }: Props) {
  return (
    <>
      <StatCards
        cards={[
          { kicker: "PAID",    label: `수금 완료 · ${vm.dateRange.label}`, value: formatKRW(vm.stats.paid) },
          { kicker: "PENDING", label: "미수금",                            value: formatKRW(vm.stats.pending) },
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
