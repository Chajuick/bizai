// client/src/components/focuswin/page/schedule/list/Header.tsx

import { LayoutList, CalendarDays as CalendarIcon } from "lucide-react";
import TabPills from "@/components/focuswin/common/ui/tab-pills";
import DateRangeFilter from "@/components/focuswin/common/filters/date-range-filter";
import StatCards from "@/components/focuswin/common/cards/stat-cards";
import { useScheduleListVM } from "@/hooks/focuswin/schedule/useScheduleListVM";
import { cn } from "@/lib/utils";

type Props = { vm: ReturnType<typeof useScheduleListVM> };

export default function ScheduleListHeader({ vm }: Props) {
  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <StatCards
        cards={[
          { kicker: "TODAY",   label: "오늘 일정",  value: String(vm.statusTabs.find(t => t.key === "scheduled")?.count ?? 0) },
          { kicker: "IMMINENT", label: "임박",      value: String(vm.statusTabs.find(t => t.key === "imminent")?.count ?? 0) },
          { kicker: "OVERDUE",  label: "지연",      value: String(vm.statusTabs.find(t => t.key === "overdue")?.count ?? 0) },
        ]}
      />

      {/* Date + View toggle row */}
      <div className="flex items-center gap-2 flex-wrap">
        <DateRangeFilter
          range={vm.dateRange}
          onChange={vm.setDatePreset}
          onCustomRange={vm.setCustomRange}
        />

        {/* 뷰 토글 */}
        <div className="ml-auto flex shrink-0 rounded-lg border border-border/60 bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => vm.setView("list")}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              vm.view === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="리스트 뷰"
          >
            <LayoutList size={14} />
          </button>
          <button
            type="button"
            onClick={() => vm.setView("calendar")}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              vm.view === "calendar"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="캘린더 뷰"
          >
            <CalendarIcon size={14} />
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <TabPills tabs={vm.statusTabs} value={vm.activeTab} onChange={vm.setActiveTab} />
    </div>
  );
}
