// components/focuswin/page/order/kanban/KanbanView.tsx

import { useState } from "react";
import { useLocation } from "wouter";
import { PackagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKRW } from "@/lib/format";
import type { OrderRow, OrderStatus } from "@/types/order";

// #region Types
type KanbanGroup = {
  key: OrderStatus;
  label: string;
  items: OrderRow[];
  color: string;
};

type Props = {
  groups: KanbanGroup[];
  onStatusChange: (id: number, status: OrderStatus) => void;
  onOpenDelivery: (order: OrderRow) => void;
  statusChanging: boolean;
};
// #endregion

// #region KanbanCard
function KanbanCard({
  order,
  onStatusChange,
  onOpenDelivery,
  statusChanging,
}: {
  order: OrderRow;
  onStatusChange: (id: number, status: OrderStatus) => void;
  onOpenDelivery: (order: OrderRow) => void;
  statusChanging: boolean;
}) {
  const [, navigate] = useLocation();

  const nextStatus: Record<string, OrderStatus> = {
    proposal: "negotiation",
    negotiation: "confirmed",
  };
  const nextLabel: Record<string, string> = {
    proposal: "협상 시작",
    negotiation: "수주 확정",
  };

  const next = nextStatus[order.orde_stat];

  return (
    <div
      onClick={() => navigate(`/orde-list/${order.orde_idno}`)}
      className="bg-white rounded-2xl border border-slate-100 p-3 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all space-y-2"
    >
      {/* 거래처 + 품목 */}
      <div>
        <p className="text-xs font-bold text-slate-900 truncate">{order.clie_name}</p>
        <p className="text-[11px] text-slate-400 truncate mt-0.5">{order.prod_serv}</p>
      </div>

      <p className="text-sm font-black text-slate-800">{formatKRW(Number(order.orde_pric))}</p>

      {/* 납기일 */}
      {order.expd_date && (
        <p className="text-[10px] text-slate-400">
          납기 {new Date(order.expd_date).toLocaleDateString("ko-KR")}
        </p>
      )}

      {/* 액션 버튼 */}
      <div
        className="flex items-center gap-1.5 pt-1"
        onClick={(e) => e.stopPropagation()}
      >
        {next && (
          <button
            disabled={statusChanging}
            onClick={() => onStatusChange(order.orde_idno, next)}
            className="flex-1 text-[11px] font-semibold py-1 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
          >
            {nextLabel[order.orde_stat]}
          </button>
        )}
        {order.orde_stat === "confirmed" && (
          <button
            onClick={() => onOpenDelivery(order)}
            className="p-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
            title="납품 등록"
          >
            <PackagePlus size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
// #endregion

// #region KanbanColumnBody
function KanbanColumnBody({
  group,
  onStatusChange,
  onOpenDelivery,
  statusChanging,
}: {
  group: KanbanGroup;
  onStatusChange: (id: number, status: OrderStatus) => void;
  onOpenDelivery: (order: OrderRow) => void;
  statusChanging: boolean;
}) {
  return (
    <div className="space-y-2">
      {group.items.length === 0 ? (
        <p className="text-xs text-slate-300 text-center py-8">없음</p>
      ) : (
        group.items.map((order) => (
          <KanbanCard
            key={order.orde_idno}
            order={order}
            onStatusChange={onStatusChange}
            onOpenDelivery={onOpenDelivery}
            statusChanging={statusChanging}
          />
        ))
      )}
    </div>
  );
}
// #endregion

// #region KanbanColumn (desktop)
function KanbanColumn({
  group,
  onStatusChange,
  onOpenDelivery,
  statusChanging,
}: {
  group: KanbanGroup;
  onStatusChange: (id: number, status: OrderStatus) => void;
  onOpenDelivery: (order: OrderRow) => void;
  statusChanging: boolean;
}) {
  const total = group.items.reduce((s, o) => s + Number(o.orde_pric || 0), 0);

  return (
    <div className="flex flex-col min-w-[240px] flex-1">
      {/* 컬럼 헤더 */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: group.color }} />
        <span className="text-xs font-extrabold text-slate-700 tracking-wide uppercase">
          {group.label}
        </span>
        <span className="text-[11px] font-semibold text-slate-400 ml-0.5">
          {group.items.length}건
        </span>
        {total > 0 && (
          <span className="ml-auto text-[11px] font-bold text-slate-500">
            {formatKRW(total)}
          </span>
        )}
      </div>
      <div className="h-0.5 rounded-full mb-3" style={{ background: group.color, opacity: 0.3 }} />
      <KanbanColumnBody
        group={group}
        onStatusChange={onStatusChange}
        onOpenDelivery={onOpenDelivery}
        statusChanging={statusChanging}
      />
    </div>
  );
}
// #endregion

// #region MobileKanban
function MobileKanban({
  groups,
  onStatusChange,
  onOpenDelivery,
  statusChanging,
}: Props) {
  const [activeKey, setActiveKey] = useState<OrderStatus>(groups[0]?.key ?? "proposal");
  const activeGroup = groups.find((g) => g.key === activeKey) ?? groups[0];

  return (
    <div className="space-y-3">
      {/* 탭 헤더 */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
        {groups.map((g) => {
          const isActive = g.key === activeKey;
          const total = g.items.reduce((s, o) => s + Number(o.orde_pric || 0), 0);
          return (
            <button
              key={g.key}
              onClick={() => setActiveKey(g.key)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all",
                isActive ? "bg-white shadow-sm" : "text-slate-400"
              )}
            >
              <div className="flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: g.color }}
                />
                <span className={cn("text-[11px] font-bold", isActive ? "text-slate-800" : "text-slate-400")}>
                  {g.label}
                </span>
              </div>
              <span className={cn("text-[10px] font-semibold", isActive ? "text-slate-500" : "text-slate-300")}>
                {g.items.length > 0 ? (total > 0 ? formatKRW(total) : `${g.items.length}건`) : "없음"}
              </span>
            </button>
          );
        })}
      </div>

      {/* 선택된 컬럼 카드 목록 */}
      {activeGroup && (
        <KanbanColumnBody
          group={activeGroup}
          onStatusChange={onStatusChange}
          onOpenDelivery={onOpenDelivery}
          statusChanging={statusChanging}
        />
      )}
    </div>
  );
}
// #endregion

// #region KanbanView
export default function KanbanView({ groups, onStatusChange, onOpenDelivery, statusChanging }: Props) {
  return (
    <>
      {/* 모바일: 탭 전환 */}
      <div className="md:hidden">
        <MobileKanban
          groups={groups}
          onStatusChange={onStatusChange}
          onOpenDelivery={onOpenDelivery}
          statusChanging={statusChanging}
        />
      </div>

      {/* 데스크톱: 가로 스크롤 컬럼 */}
      <div className="hidden md:flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {groups.map((group) => (
          <KanbanColumn
            key={group.key}
            group={group}
            onStatusChange={onStatusChange}
            onOpenDelivery={onOpenDelivery}
            statusChanging={statusChanging}
          />
        ))}
      </div>
    </>
  );
}
// #endregion
