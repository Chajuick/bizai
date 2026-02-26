import { Link } from "wouter";
import { BookOpen, ChevronRight } from "lucide-react";
import { WorkItemCard } from "@/components/focuswin/common/work-item-card";
import type { SalesLogRow } from "@/types/salesLog";

export default function ClientRecentLogs({
  logs,
  loading,
  clientName,
}: {
  logs?: SalesLogRow[];
  loading: boolean;
  clientName: string;
}) {
  return (
    <div
      className="rounded-3xl border border-slate-100 bg-white p-4 mb-4"
      style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
            RECENT LOGS
          </p>
          <p className="mt-1 text-sm font-black text-slate-900">최근 영업일지</p>
        </div>

        <Link
          href={`/sale-list?search=${encodeURIComponent(clientName)}`}
          className="text-sm font-bold text-blue-600 hover:text-blue-700"
        >
          전체 보기
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-100 bg-white p-3 animate-pulse"
            >
              <div className="h-3 w-2/3 bg-slate-100 rounded mb-2" />
              <div className="h-3 w-1/3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : (logs?.length ?? 0) === 0 ? (
        <div className="text-center py-8">
          <div className="mx-auto w-12 h-12 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <BookOpen size={20} className="text-blue-600" />
          </div>
          <p className="mt-3 text-sm font-black text-slate-900">아직 영업일지가 없어요</p>
          <p className="mt-1 text-xs text-slate-500">일지를 작성하면 여기에 최근 기록이 보여요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs?.slice(0, 5).map((log) => (
            <Link key={log.id} href={`/sale-list/${log.id}`} className="block">
              <WorkItemCard interactive className="p-3">
                <WorkItemCard.Icon className="w-9 h-9">
                  <BookOpen size={14} />
                </WorkItemCard.Icon>

                <div className="min-w-0 flex-1">
                  <WorkItemCard.Header
                    title={
                      <div className="text-sm font-semibold text-slate-900 line-clamp-2 whitespace-normal">
                        {log.aiSummary ||
                          (log.rawContent ? String(log.rawContent).slice(0, 120) : "")}
                      </div>
                    }
                    actions={
                      <div className="w-8 h-8 rounded-2xl bg-white border border-slate-100 flex items-center justify-center transition group-hover:bg-blue-50 group-hover:border-blue-100 shrink-0">
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" />
                      </div>
                    }
                  />

                  <WorkItemCard.Footer
                    left={
                      <WorkItemCard.ScheduleMeta
                        value={
                          log.visitedAt
                            ? new Date(log.visitedAt).toLocaleDateString("ko-KR")
                            : ""
                        }
                      />
                    }
                  />
                </div>
              </WorkItemCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
