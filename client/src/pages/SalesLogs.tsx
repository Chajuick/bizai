import { Link } from "wouter";
import { Plus, BookOpen } from "lucide-react";

import { useSalesLogsViewModel } from "@/hooks/focuswin/sales-log/useSalesLogsViewModel";
import PageHeader from "@/components/focuswin/page-header";
import SearchInput from "@/components/focuswin/search-input";
import TabPills from "@/components/focuswin/tab-pills";
import EmptyState from "@/components/focuswin/empty-state";
import SkeletonCardList from "@/components/focuswin/skeleton-card-list";
import SalesLogCard from "@/components/focuswin/sales-log/sales-log-card";
import PageShell from "@/components/focuswin/common/page-shell";
import Fab from "@/components/focuswin/fab";

export default function SalesLogs() {
  const vm = useSalesLogsViewModel();

  return (
    <PageShell>
      <PageHeader
        kicker="SALES LOGS"
        title="영업일지"
        description="기록을 모아두면, 찾고 정리하기가 쉬워져요."
        primaryAction={{ label: "작성", href: "/sales-logs/new", icon: <Plus size={16} /> }}
      >
        <SearchInput
          value={vm.search}
          debounceMs={250}
          onChange={vm.handleSearch}
          onClear={vm.handleClear}
          placeholder="고객사, 담당자, 내용으로 검색…"
        />
        <div className="mt-3">
          <TabPills tabs={vm.salesTabs} value={vm.filter} onChange={vm.setFilter} />
        </div>
      </PageHeader>

      <div className="mt-4">
        {vm.isLoading ? (
          <SkeletonCardList count={6} variant="detailed" />
        ) : !vm.hasData ? (
          <EmptyState
            icon={<BookOpen size={26} className="text-blue-600" />}
            title={vm.emptyTitle}
            description={vm.emptyDesc}
            actions={[
              { label: "일지 작성하기", href: "/sales-logs/new", icon: <Plus size={16} />, variant: "primary" },
              ...(vm.search.trim() || vm.filter !== "all"
                ? [{ label: "초기화", onClick: vm.handleReset, variant: "secondary" as const }]
                : []),
            ]}
            className="py-16"
          />
        ) : (
          <div className="space-y-2">
            {vm.logs?.map(log => (
              <Link key={log.id} href={`/sales-logs/${log.id}`}>
                <SalesLogCard
                  log={log}
                  title={log.clientName || "고객사 미지정"}
                  subtitle={log.contactPerson ? `· ${log.contactPerson}` : undefined}
                  description={log.aiSummary || log.rawContent}
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link href="/sales-logs/new">
        <Fab label="일지 작성" onClick={() => {}}>
          <Plus size={24} />
        </Fab>
      </Link>
    </PageShell>
  );
}
