// client/src/components/focuswin/page/schedule/list/Header.tsx

import { LayoutList, CalendarDays as CalendarIcon } from "lucide-react";
import TabPills from "@/components/focuswin/common/ui/tab-pills";
import StatCards from "@/components/focuswin/common/cards/stat-cards";
import SearchInput from "@/components/focuswin/common/form/search-input";
import { useScheduleListVM } from "@/hooks/focuswin/schedule/useScheduleListVM";
import { cn } from "@/lib/utils";

type Props = { vm: ReturnType<typeof useScheduleListVM> };

export default function ScheduleListHeader({ vm }: Props) {
  return (
    <div className="space-y-2">
      <StatCards
        cards={[
          { kicker: "전체 일정", label: "", value: String(vm.statusTabs.find(t => t.key === "all")?.count ?? 0) },
          { kicker: "임박",     label: "", value: String(vm.statusTabs.find(t => t.key === "imminent")?.count ?? 0) },
          { kicker: "지연",     label: "", value: String(vm.statusTabs.find(t => t.key === "overdue")?.count ?? 0) },
        ]}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[140px]">
          <SearchInput
            value={vm.search}
            onChange={vm.handleSearch}
            onClear={vm.handleClear}
            placeholder="거래처, 일정명으로 검색…"
          />
        </div>
        <div className="flex shrink-0 rounded-lg border border-border/60 bg-muted/30 p-0.5">
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

      <TabPills tabs={vm.statusTabs} value={vm.activeTab} onChange={vm.setActiveTab} />
    </div>
  );
}
