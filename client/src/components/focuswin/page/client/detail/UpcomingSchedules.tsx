// src/components/focuswin/page/client/detail/UpcomingSchedules.tsx

import { Link } from "wouter";
import { Calendar, ChevronRight } from "lucide-react";
import { WorkItemCard } from "@/components/focuswin/common/cards/work-item-card";
import StatusBadge from "@/components/focuswin/common/badges/status-badge";

type ScheduleItem = {
  sche_idno: number;
  sche_name: string;
  sche_date: string | Date;
  sche_stat: string;
};

export default function ClientDetailUpcomingSchedules({
  schedules,
  loading,
}: {
  schedules?: ScheduleItem[];
  loading: boolean;
}) {
  const upcoming = (schedules ?? [])
    .filter((s) => s.sche_stat !== "completed" && s.sche_stat !== "canceled")
    .slice(0, 5);

  return (
    <div
      className="rounded-3xl border border-slate-100 bg-white p-4"
      style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
            UPCOMING
          </p>
          <p className="mt-1 text-sm font-black text-slate-900">예정 일정</p>
        </div>
        <Link href="/sche-list" className="text-sm font-bold text-blue-600 hover:text-blue-700">
          일정 관리
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white p-3 animate-pulse">
              <div className="h-3 w-2/3 bg-slate-100 rounded mb-2" />
              <div className="h-3 w-1/3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <div className="text-center py-6">
          <div className="mx-auto w-12 h-12 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Calendar size={20} className="text-blue-600" />
          </div>
          <p className="mt-3 text-sm font-black text-slate-900">예정 일정이 없어요</p>
          <p className="mt-1 text-xs text-slate-500">일정을 등록하면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {upcoming.map((s) => (
            <Link key={s.sche_idno} href="/sche-list" className="block">
              <WorkItemCard interactive className="p-3">
                <WorkItemCard.Icon className="w-9 h-9" variant="primary">
                  <Calendar size={14} />
                </WorkItemCard.Icon>
                <div className="min-w-0 flex-1">
                  <WorkItemCard.Header
                    title={s.sche_name}
                    tags={<StatusBadge status={s.sche_stat} />}
                    actions={
                      <div className="w-8 h-8 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                        <ChevronRight size={16} className="text-slate-400" />
                      </div>
                    }
                  />
                  <WorkItemCard.Footer
                    left={
                      <WorkItemCard.ScheduleMeta
                        value={new Date(s.sche_date).toLocaleDateString("ko-KR")}
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
