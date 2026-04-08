// client/src/components/focuswin/page/shipment/list/Header.tsx

import StatCards from "@/components/focuswin/common/cards/stat-cards";
import TabPills from "@/components/focuswin/common/ui/tab-pills";
import DateRangeFilter from "@/components/focuswin/common/filters/date-range-filter";
import SearchInput from "@/components/focuswin/common/form/search-input";
import { useShipmentListVM } from "@/hooks/focuswin/shipment/useShipmentListVM";
import { formatKRW } from "@/lib/format";

type Props = { vm: ReturnType<typeof useShipmentListVM> };

export default function ShipmentListHeader({ vm }: Props) {
  return (
    <div className="space-y-2">
      <StatCards
        cards={[
          { kicker: "수금 완료",   label: "", value: formatKRW(vm.serverStats.totalPaid) },
          { kicker: "청구 미수금", label: "", value: formatKRW(vm.serverStats.totalInvoiced), tone: vm.serverStats.totalInvoiced > 0 ? "warning" : undefined },
          { kicker: "납품 진행중", label: "", value: formatKRW(vm.serverStats.totalPending) },
        ]}
      />
      <div className="flex items-center gap-2 flex-wrap">
        <DateRangeFilter
          range={vm.dateRange}
          onChange={vm.setDatePreset}
          onCustomRange={vm.setCustomRange}
        />
        <div className="flex-1 min-w-[160px]">
          <SearchInput
            value={vm.search}
            debounceMs={250}
            onChange={vm.handleSearch}
            onClear={vm.handleClear}
            placeholder="거래처, 메모로 검색…"
          />
        </div>
      </div>
      <div>
        <TabPills tabs={vm.tabs} value={vm.activeTab} onChange={vm.setActiveTab} />
      </div>
    </div>
  );
}
