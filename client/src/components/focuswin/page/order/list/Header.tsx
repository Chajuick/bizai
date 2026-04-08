// src/components/focuswin/order/list/Header.tsx

import { KanbanSquare, List } from "lucide-react";
import StatCards from "@/components/focuswin/common/cards/stat-cards";
import TabPills from "@/components/focuswin/common/ui/tab-pills";
import DateRangeFilter from "@/components/focuswin/common/filters/date-range-filter";
import SearchInput from "@/components/focuswin/common/form/search-input";
import { useOrderListVM } from "@/hooks/focuswin/order/useOrderListVM";
import { formatKRW } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = { vm: ReturnType<typeof useOrderListVM> };

export default function OrderListHeader({ vm }: Props) {
  return (
    <div className="space-y-2">
      <StatCards
        cards={[
          { kicker: "전체 파이프라인", label: "", value: formatKRW(vm.stats.total) },
          { kicker: "확정 수주",       label: "", value: formatKRW(vm.stats.confirmed) },
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
            placeholder="거래처, 품목, 메모로 검색…"
          />
        </div>
        {/* 뷰 토글 */}
        <div className="flex items-center gap-0.5 border border-slate-200 rounded-xl p-0.5 shrink-0">
          <button
            onClick={() => vm.setView("list")}
            className={cn(
              "p-1.5 rounded-[10px] transition",
              vm.view === "list" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
            title="리스트"
          >
            <List size={15} />
          </button>
          <button
            onClick={() => vm.setView("kanban")}
            className={cn(
              "p-1.5 rounded-[10px] transition",
              vm.view === "kanban" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
            title="칸반"
          >
            <KanbanSquare size={15} />
          </button>
        </div>
      </div>
      {vm.view === "list" && (
        <div>
          <TabPills tabs={vm.tabs} value={vm.activeTab} onChange={vm.setActiveTab} />
        </div>
      )}
    </div>
  );
}
