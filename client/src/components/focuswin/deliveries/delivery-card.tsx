"use client";

import * as React from "react";
import { TrendingUp, MoreHorizontal, Pencil, Trash2, Package, FileText, BadgeCheck } from "lucide-react";

import StatusBadge from "@/components/StatusBadge";
import { WorkItemCard } from "@/components/focuswin/common/work-item-card";
import { StepProgress } from "@/components/focuswin/common/step-progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import type { DeliveryStatus } from "./deliveries.types";

const DELIVERY_STEPS = [
  { key: "pending", label: "대기" },
  { key: "delivered", label: "납품" },
  { key: "invoiced", label: "청구" },
  { key: "paid", label: "수금" },
] as const;

type Stage = (typeof DELIVERY_STEPS)[number]["key"];

/** ✅ 단계별 파스텔 컬러 주입 */
const DELIVERY_STEP_STYLES = {
  pending: { text: "text-sky-200", ring: "ring-sky-100", line: "bg-sky-100", labelCurrent: "text-sky-500", labelDone: "text-slate-600" },
  delivered: { text: "text-sky-300", ring: "ring-sky-100", line: "bg-sky-100", labelCurrent: "text-sky-600", labelDone: "text-slate-600" },
  invoiced: { text: "text-sky-400", ring: "ring-sky-100", line: "bg-sky-100", labelCurrent: "text-sky-700", labelDone: "text-slate-600" },
  paid: { text: "text-sky-500", ring: "ring-sky-200", line: "bg-sky-200", labelCurrent: "text-sky-700", labelDone: "text-slate-600" },
} satisfies Partial<Record<Stage, import("@/components/focuswin/common/step-progress").StepStyle>>;

function nextStage(stage: Stage): Stage | null {
  if (stage === "pending") return "delivered";
  if (stage === "delivered") return "invoiced";
  if (stage === "invoiced") return "paid";
  return null;
}

type NextAction = { label: string; icon: React.ReactNode } | null;

function getNextAction(stage: Stage): NextAction {
  if (stage === "pending") return { label: "납품 완료", icon: <Package size={12} /> };
  if (stage === "delivered") return { label: "청구 완료", icon: <FileText size={12} /> };
  if (stage === "invoiced") return { label: "수금 완료", icon: <BadgeCheck size={12} /> };
  return null;
}

export default function DeliveryCard({
  deliveries,
  formatKRW,
  onEdit,
  onAskDelete,
  onStatusUpdate,
  statusUpdatePending,
}: {
  deliveries: any[];
  formatKRW: (n: number) => string;
  onEdit: (d: any) => void;
  onAskDelete: (d: any) => void;
  onStatusUpdate: (id: number, status: DeliveryStatus) => void;
  statusUpdatePending: boolean;
}) {
  return (
    <div className="space-y-2">
      {deliveries.map(d => {
        const stage = d.deliveryStatus as Stage;
        const next = nextStage(stage);
        const nextAction = getNextAction(stage);

        // 아이콘은 완료 시 중립, 그 외 파랑
        const iconVariant = stage === "paid" ? "slate" : "primary";

        return (
          <WorkItemCard key={d.id} interactive>
            <WorkItemCard.Icon variant={iconVariant}>
              <TrendingUp size={16} />
            </WorkItemCard.Icon>

            <div className="min-w-0 flex-1">
              <WorkItemCard.Header
                title={d.clientName}
                tags={<StatusBadge status={d.deliveryStatus} />}
                actions={
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-9 h-9 rounded-2xl border border-slate-200 hover:bg-slate-50 transition flex items-center justify-center" title="더보기" onClick={e => e.stopPropagation()}>
                        <MoreHorizontal size={16} className="text-slate-700" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="rounded-2xl p-1">
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          onEdit(d);
                        }}
                        className="rounded-xl flex items-center gap-2"
                      >
                        <Pencil size={14} className="text-slate-700" />
                        수정
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          onAskDelete(d);
                        }}
                        className="rounded-xl flex items-center gap-2 text-red-600 focus:text-red-600"
                      >
                        <Trash2 size={14} />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
              ></WorkItemCard.Header>

              <WorkItemCard.Body>
                {/* notes (있을 때만 표시) */}
                {d.notes ? <p className="mt-1 text-xs text-slate-500 line-clamp-2">{d.notes}</p> : null}

                {/* 금액 */}
                <div className="my-1 text-lg font-black text-slate-900">{formatKRW(Number(d.revenueAmount))}</div>

                <StepProgress.Combo
                  steps={DELIVERY_STEPS}
                  current={stage}
                  stepStyles={DELIVERY_STEP_STYLES}
                  hoverPulse
                  leftMeta={
                    d.deliveredAt ? (
                      <p className="text-xs font-semibold text-slate-500">납품일: {new Date(d.deliveredAt).toLocaleDateString("ko-KR")}</p>
                    ) : (
                      <p className="text-xs text-slate-400">납품일 미입력</p>
                    )
                  }
                  action={
                    next && nextAction
                      ? {
                          label: nextAction.label,
                          icon: nextAction.icon,
                          variant: "primary",
                          disabled: statusUpdatePending,
                          onClick: () => onStatusUpdate(d.id, next),
                        }
                      : null
                  }
                />
              </WorkItemCard.Body>
            </div>
          </WorkItemCard>
        );
      })}
    </div>
  );
}
