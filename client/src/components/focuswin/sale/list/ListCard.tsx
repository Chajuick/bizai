import * as React from "react";
import { BookOpen, Brain, ChevronRight, Mic, MapPin } from "lucide-react";
import { WorkItemCard } from "@/components/focuswin/common/work-item-card"; // 경로 맞게
import Chip from "../../common/ui/chip";
import type { SalesLogRow } from "@/types/salesLog";

export default function SaleListCard({
  log,
  title,
  subtitle,
  description,
  className = "",
}: {
  log: SalesLogRow;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  const dateLabel = new Date(log.visitedAt).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });

  return (
    <WorkItemCard className={className} interactive>
      <WorkItemCard.Icon>
        <BookOpen size={16} className="text-blue-700" />
      </WorkItemCard.Icon>

      <div className="min-w-0 flex-1">
        <WorkItemCard.Header
          title={
            <div className="flex items-center gap-1 min-w-0">
              <span className="truncate">{title}</span>
              {subtitle ? <span className="text-xs font-normal text-slate-600 truncate">{subtitle}</span> : null}
            </div>
          }
          tags={
            <div className="flex items-center gap-1">
              {log.audioUrl ? <Chip icon={Mic} label="음성" tone="sky" /> : null}
              {log.isProcessed ? <Chip icon={Brain} label="AI" tone="violet" /> : null}
            </div>
          }
          actions={
            <div className="shrink-0">
              <div className="w-8 h-8 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center transition group-hover:bg-blue-50 group-hover:border-blue-100">
                <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" />
              </div>
            </div>
          }
        />

        <WorkItemCard.Body>
          <div className="flex items-center justify-between gap-3">
            {/* 왼쪽: 설명 */}
            <div>
              <div className="min-w-0 flex-1">{description ? <p className="text-sm text-slate-600 line-clamp-1 sm:line-clamp-2">{description}</p> : null}</div>
              <div className="max-w-[220px] mt-2">{log.location && <WorkItemCard.Meta icon={<MapPin size={14} />} value={log.location} />}</div>
            </div>
          </div>
        </WorkItemCard.Body>

        {/* ✅ 날짜는 location 자리(footer left)로 + 상태색 */}
        <WorkItemCard.Footer left={<WorkItemCard.ScheduleMeta value={dateLabel} />} />
      </div>
    </WorkItemCard>
  );
}
