// client/src/components/focuswin/page/expense/list/Header.tsx

import type { useExpenseListVM } from "@/hooks/focuswin/expense/useExpenseListVM";
import DateRangeFilter from "@/components/focuswin/common/filters/date-range-filter";
import TabPills from "@/components/focuswin/common/ui/tab-pills";
import SearchInput from "@/components/focuswin/common/form/search-input";
import StatCards from "@/components/focuswin/common/cards/stat-cards";
import { formatKRW } from "@/lib/format";

type VM = ReturnType<typeof useExpenseListVM>;

export default function ExpenseListHeader({ vm }: { vm: VM }) {
  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <StatCards
        cards={[
          {
            kicker: `${vm.dateRange.label} 합계`,
            value: formatKRW(vm.summary.totalAmnt),
            label: "",
          },
          {
            kicker: "카드 결제",
            value: formatKRW(vm.summary.cardAmnt),
            label: "",
          },
          {
            kicker: "반복 지출",
            value: `${vm.summary.recurCount}건`,
            label: "",
          },
        ]}
      />

      {/* Date + Search row */}
      <div className="flex items-center gap-2 flex-wrap">
        <DateRangeFilter range={vm.dateRange} onChange={vm.setDatePreset} onCustomRange={vm.setCustomRange} />
        <div className="flex-1 min-w-[160px]">
          <SearchInput value={vm.search} onChange={vm.handleSearch} onClear={vm.handleClear} placeholder="지출명, 거래처, 메모 검색" />
        </div>
      </div>

      {/* 결제 수단 필터 */}
      <TabPills tabs={vm.payTabs} value={vm.payFilter} onChange={vm.setPayFilter} />
    </div>
  );
}
