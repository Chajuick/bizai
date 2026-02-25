import { useMemo, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation, Link } from "wouter";
import { Plus, BookOpen } from "lucide-react";

import PageHeader from "@/components/focuswin/page-header";
import SearchInput from "@/components/focuswin/search-input";
import TabPills, { TabPill } from "@/components/focuswin/tab-pills";

import EmptyState from "@/components/focuswin/empty-state";
import SkeletonCardList from "@/components/focuswin/skeleton-card-list";
import SalesLogCard from "@/components/focuswin/sales-log/sales-log-card";
import PageShell from "@/components/focuswin/common/page-shell";
import Fab from "@/components/focuswin/fab";

type SalesFilter = "all" | "thisWeek" | "ai" | "audio";

function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function SalesLogs() {
  const [, navigate] = useLocation();

  const getSearchFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("search") ?? "";
  };

  const [location] = useLocation();
  const [search, setSearch] = useState(getSearchFromURL);
  const [filter, setFilter] = useState<SalesFilter>("all");

  useEffect(() => {
    const urlSearch = getSearchFromURL();
    if (urlSearch !== search) setSearch(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const { data: logs, isLoading } = trpc.salesLogs.list.useQuery({
    search: search || undefined,
    limit: 50,
  });

  const now = new Date();
  const weekStart = useMemo(() => startOfWeekMonday(now), [now]);

  const counts = useMemo(() => {
    const arr = logs ?? [];
    const thisWeek = arr.filter(l => new Date(l.visitedAt) >= weekStart).length;
    const ai = arr.filter(l => !!l.isProcessed).length;
    const audio = arr.filter(l => !!l.audioUrl).length;
    return { all: arr.length, thisWeek, ai, audio };
  }, [logs, weekStart]);

  const salesTabs = useMemo<TabPill<SalesFilter>[]>(
    () => [
      { key: "all", label: "전체", count: counts.all },
      { key: "thisWeek", label: "이번주", count: counts.thisWeek },
      { key: "ai", label: "AI", count: counts.ai },
      { key: "audio", label: "음성", count: counts.audio },
    ],
    [counts]
  );

  const filteredLogs = useMemo(() => {
    const arr = logs ?? [];
    if (filter === "thisWeek") return arr.filter(l => new Date(l.visitedAt) >= weekStart);
    if (filter === "ai") return arr.filter(l => !!l.isProcessed);
    if (filter === "audio") return arr.filter(l => !!l.audioUrl);
    return arr;
  }, [logs, filter, weekStart]);

  const hasData = (filteredLogs?.length ?? 0) > 0;

  const emptyTitle = useMemo(() => {
    if (search.trim()) return "검색 결과가 없어요";
    if (filter !== "all") return "조건에 맞는 일지가 없어요";
    return "아직 영업일지가 없어요";
  }, [search, filter]);

  const emptyDesc = useMemo(() => {
    if (search.trim()) return "검색어를 바꿔서 다시 시도해보세요.";
    if (filter !== "all") return "필터를 ‘전체’로 바꾸거나 새 일지를 작성해보세요.";
    return "첫 기록을 남기면 AI가 자동으로 요약/정리해줘요.";
  }, [search, filter]);

  return (
    <PageShell>
      <PageHeader
        kicker="SALES LOGS"
        title="영업일지"
        description="기록을 모아두면, 찾고 정리하기가 쉬워져요."
        primaryAction={{
          label: "작성",
          href: "/sales-logs/new",
          icon: <Plus size={16} />,
        }}
      >
        <SearchInput
          value={search}
          debounceMs={250}
          onChange={value => {
            setSearch(value);
            const q = value.trim();
            navigate(q ? `/sales-logs?search=${encodeURIComponent(q)}` : "/sales-logs", {
              replace: true,
            });
          }}
          onClear={() => {
            setSearch("");
            navigate("/sales-logs", { replace: true });
          }}
          placeholder="고객사, 담당자, 내용으로 검색…"
        />

        <div className="mt-3">
          <TabPills<SalesFilter> tabs={salesTabs} value={filter} onChange={setFilter} />
        </div>
      </PageHeader>

      {/* ✅ List Wrapper: 항상 mt-4 (Promises와 통일) */}
      <div className="mt-4">
        {isLoading ? (
          <SkeletonCardList count={6} variant="detailed" />
        ) : !hasData ? (
          <EmptyState
            icon={<BookOpen size={26} className="text-blue-600" />}
            title={emptyTitle}
            description={emptyDesc}
            actions={[
              {
                label: "일지 작성하기",
                href: "/sales-logs/new",
                icon: <Plus size={16} />,
                variant: "primary",
              },
              ...(search.trim() || filter !== "all"
                ? [
                    {
                      label: "초기화",
                      onClick: () => {
                        setSearch("");
                        setFilter("all");
                        navigate("/sales-logs", { replace: true });
                      },
                      variant: "secondary" as const,
                    },
                  ]
                : []),
            ]}
            className="py-16"
          />
        ) : (
          <div className="space-y-2">
            {filteredLogs?.map(log => {
              const title = log.clientName || "고객사 미지정";
              const subtitle = log.contactPerson ? `· ${log.contactPerson}` : undefined;
              const description = log.aiSummary || log.rawContent;

              return (
                <Link key={log.id} href={`/sales-logs/${log.id}`}>
                  <SalesLogCard log={log} title={title} subtitle={subtitle} description={description} />
                </Link>
              );
            })}
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
