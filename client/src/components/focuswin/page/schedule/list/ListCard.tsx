import * as React from "react";
import { Calendar, CheckCircle, Clock, Edit2, MoreHorizontal, ShoppingCart, Trash2, XCircle } from "lucide-react";
import type { EnhancedSchedule } from "@/types/schedule";

import { WorkItemCard } from "@/components/focuswin/common/cards/work-item-card";
import StatusBadge from "@/components/focuswin/common/badges/status-badge";
import { IconButton } from "@/components/focuswin/common/ui/button";
import Chip from "@/components/focuswin/common/ui/chip";
import { cn } from "@/lib/utils";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type EffectiveStatus = "scheduled" | "completed" | "canceled" | "overdue" | "imminent";

export default function ScheduleListCard({
  p,
  onCreateOrder,
  onEdit,
  onCancelRequest,
  onDeleteRequest,
  onCompleteRequest,
}: {
  p: EnhancedSchedule;
  onCreateOrder: (p: EnhancedSchedule) => void;
  onEdit: (p: EnhancedSchedule) => void;
  onCancelRequest: (p: EnhancedSchedule) => void;
  onDeleteRequest: (p: EnhancedSchedule) => void;
  onCompleteRequest: (p: EnhancedSchedule) => void;
}) {
  const isScheduled = p.stat_code === "scheduled";

  const scheduleStatus: "default" | "imminent" | "overdue" = p.overdue ? "overdue" : p.imminent ? "imminent" : "default";

  // 유효 상태: overdue/imminent 플래그를 stat_code보다 우선
  const effectiveStatCode = p.overdue ? "overdue" : p.imminent ? "imminent" : p.stat_code;

  const iconVariant = p.overdue ? "danger" : p.imminent ? "warning" : "primary";

  // 상태별 hover 강조 클래스
  const hoverClass =
    scheduleStatus === "overdue"
      ? "hover:border-red-300 hover:bg-red-50/40"
      : scheduleStatus === "imminent"
      ? "hover:border-orange-300 hover:bg-orange-50/40"
      : "";

  return (
    <WorkItemCard interactive className={cn("pr-3", hoverClass)}>
      {/* LEFT ICON */}
      <WorkItemCard.Icon variant={iconVariant}>
        <Calendar size={18} />
      </WorkItemCard.Icon>
      <div className="min-w-0 flex-1">
        <WorkItemCard.Header
          title={p.sche_name}
          tags={
            <div className="flex items-center gap-1">
              <StatusBadge status={effectiveStatCode as EffectiveStatus} />
              {p.auto_gene ? <Chip label="AI" tone="violet" /> : null}
            </div>
          }
          actions={
            <div className="flex items-center gap-1">
              {isScheduled ? (
                <>
                  <IconButton title="수주 생성" onClick={() => onCreateOrder(p)}>
                    <ShoppingCart size={16} className="text-slate-700" />
                  </IconButton>

                  <IconButton title="완료" onClick={() => onCompleteRequest(p)}>
                    <CheckCircle size={16} className="text-emerald-600" />
                  </IconButton>
                </>
              ) : null}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton title="더보기">
                    <MoreHorizontal size={16} className="text-slate-700" />
                  </IconButton>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="rounded-2xl p-1">
                  <DropdownMenuItem onClick={() => onEdit(p)} className="rounded-xl flex items-center gap-2">
                    <Edit2 size={14} className="text-slate-700" />
                    수정
                  </DropdownMenuItem>

                  {isScheduled ? (
                    <DropdownMenuItem onClick={() => onCancelRequest(p)} className="rounded-xl flex items-center gap-2">
                      <XCircle size={14} className="text-slate-700" />
                      취소 처리
                    </DropdownMenuItem>
                  ) : null}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => onDeleteRequest(p)} className="rounded-xl flex items-center gap-2 text-red-600 focus:text-red-600">
                    <Trash2 size={14} />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />

        {/* subtitle (clie_name) */}
        {p.clie_name ? <div className="mt-0.5 text-xs font-semibold text-slate-400 truncate">{p.clie_name}</div> : null}

        <WorkItemCard.Body>{p.sche_desc ? <p className="text-xs text-slate-600 line-clamp-2">{p.sche_desc}</p> : null}</WorkItemCard.Body>

        <WorkItemCard.Footer
          left={
            <WorkItemCard.ScheduleMeta
              status={scheduleStatus}
              icon={<Clock size={12} className="text-current" />}
              value={new Date(p.sche_date).toLocaleString("ko-KR", {
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
          }
        />
      </div>
    </WorkItemCard>
  );
}
