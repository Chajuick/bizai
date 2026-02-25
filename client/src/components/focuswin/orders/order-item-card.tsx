import { Edit2, MoreHorizontal, PackagePlus, ShoppingCart, Trash2, Users, BadgeCheck, Ban } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { WorkItemCard } from "@/components/focuswin/common/work-item-card";
import { StepProgress } from "@/components/focuswin/common/step-progress";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import type { OrderStatus } from "@/hooks/focuswin/orders/useOrdersViewModel";

const ORDER_STEPS = [
  { key: "proposal", label: "제안" },
  { key: "negotiation", label: "협상" },
  { key: "confirmed", label: "확정" },
] as const;

type OrderStage = (typeof ORDER_STEPS)[number]["key"];

function nextStage(s: OrderStage): OrderStage | null {
  if (s === "proposal") return "negotiation";
  if (s === "negotiation") return "confirmed";
  return null;
}

type NextAction = { label: string; icon: React.ReactNode } | null;

function getNextAction(status: OrderStatus, stage: OrderStage): NextAction {
  if (status === "canceled") return null;
  if (stage === "proposal") return { label: "협상 시작", icon: <Users size={12} /> };
  if (stage === "negotiation") return { label: "수주 확정", icon: <BadgeCheck size={12} /> };
  return null; // confirmed: 납품은 상단 아이콘 버튼으로
}

export default function OrderItemCard({
  order,
  formatKRW,
  onEdit,
  onDelete,
  onStatusChange,
  statusChanging,
  onOpenDelivery,
}: {
  order: any;
  formatKRW: (n: number) => string;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: OrderStatus) => void;
  statusChanging: boolean;
  onOpenDelivery: () => void;
}) {
  const deliveryCount: number = order.deliveryCount ?? 0;
  const isCanceled = order.status === "canceled";
  const stage = isCanceled ? "proposal" : (order.status as OrderStage);
  const next = isCanceled ? null : nextStage(stage);
  const nextAction = getNextAction(order.status, stage);

  const iconVariant = isCanceled ? "slate" : "primary";

  const handleNextClick = () => {
    if (isCanceled || !next) return;
    onStatusChange(next);
  };

  return (
    <WorkItemCard interactive>
      <WorkItemCard.Icon variant={iconVariant}>
        <ShoppingCart size={16} />
      </WorkItemCard.Icon>

      <div className="min-w-0 flex-1">
        <WorkItemCard.Header
          title={order.clientName}
          tags={<StatusBadge status={order.status} />}
          actions={
            <div className="flex items-center gap-1.5">
              {/* 확정 상태: 납품 생성/추가 아이콘 버튼 */}
              {stage === "confirmed" && !isCanceled && (
                <button
                  className="w-9 h-9 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition flex items-center justify-center"
                  title={deliveryCount === 0 ? "납품 생성" : "납품 추가"}
                  onClick={e => { e.stopPropagation(); onOpenDelivery(); }}
                >
                  <PackagePlus size={15} />
                </button>
              )}

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
                    onEdit();
                  }}
                  className="rounded-xl flex items-center gap-2"
                >
                  <Edit2 size={14} className="text-slate-700" />
                  수정
                </DropdownMenuItem>

                {/* 취소 처리 */}
                {!isCanceled && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        onStatusChange("canceled");
                      }}
                      className="rounded-xl flex items-center gap-2 text-slate-600 focus:text-slate-700"
                      disabled={statusChanging}
                    >
                      <Ban size={14} className="text-slate-700" />
                      취소
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="rounded-xl flex items-center gap-2 text-red-600 focus:text-red-600"
                >
                  <Trash2 size={14} />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          }
        />

        {/* 품목 */}
        <p className="mt-0.5 text-sm text-slate-500 truncate">{order.productService}</p>

        {/* 금액 */}
        <div className="mt-1 text-lg font-black text-slate-900">{formatKRW(Number(order.amount))}</div>

        <WorkItemCard.Body>
          {isCanceled ? (
            /* 취소된 수주는 step 없이 납기일 메타만 */
            order.expectedDeliveryDate ? (
              <p className="text-xs text-slate-400">납기: {new Date(order.expectedDeliveryDate).toLocaleDateString("ko-KR")}</p>
            ) : null
          ) : (
            <StepProgress.Combo
              steps={ORDER_STEPS}
              current={stage}
              leftMeta={
                <div className="flex items-center gap-3">
                  {order.expectedDeliveryDate ? (
                    <p className="text-xs font-semibold text-slate-500">납기: {new Date(order.expectedDeliveryDate).toLocaleDateString("ko-KR")}</p>
                  ) : (
                    <p className="text-xs text-slate-400">납기일 미입력</p>
                  )}
                  {stage === "confirmed" && deliveryCount > 0 && <p className="text-xs font-bold text-emerald-600">납품 {deliveryCount}건</p>}
                </div>
              }
              action={
                nextAction
                  ? {
                      label: nextAction.label,
                      icon: nextAction.icon,
                      variant: "primary",
                      disabled: statusChanging,
                      onClick: e => {
                        e.stopPropagation();
                        handleNextClick();
                      },
                    }
                  : null
              }
            />
          )}
        </WorkItemCard.Body>
      </div>
    </WorkItemCard>
  );
}
