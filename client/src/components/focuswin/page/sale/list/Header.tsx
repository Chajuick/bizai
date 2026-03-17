// client/src/components/focuswin/page/sale/list/Header.tsx

import SearchInput from "@/components/focuswin/common/form/search-input";
import TabPills from "@/components/focuswin/common/ui/tab-pills";
import DateRangeFilter from "@/components/focuswin/common/filters/date-range-filter";
import StatCards from "@/components/focuswin/common/cards/stat-cards";
import { useSaleListVM } from "@/hooks/focuswin/sale/useSaleListVM";

type Props = {
  vm: ReturnType<typeof useSaleListVM>;
  className?: string;
};

export default function SaleListHeader({ vm, className }: Props) {
  return (
    <div className={className}>
      {/* Summary Cards */}
      <StatCards
        cards={[
          {
            kicker: "TOTAL",
            value: String(vm.summary.totalCount),
            label: `활동 · ${vm.dateRange.label}`,
          },
          {
            kicker: "AI",
            value: String(vm.summary.aiCount),
            label: "AI 분석 완료",
          },
        ]}
      />

      {/* Date + Search row */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
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
            placeholder="거래처, 담당자, 내용으로 검색…"
          />
        </div>
      </div>

      <div className="mt-3">
        <TabPills tabs={vm.tabs} value={vm.filter} onChange={vm.setFilter} />
      </div>
    </div>
  );
}
