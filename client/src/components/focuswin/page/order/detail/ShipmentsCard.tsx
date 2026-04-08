// components/focuswin/page/order/detail/ShipmentsCard.tsx

import { ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Card } from "@/components/focuswin/common/ui/card";
import StatusBadge from "@/components/focuswin/common/badges/status-badge";
import type { useOrderDetailVM } from "@/hooks/focuswin/order/useOrderDetailVM";

type VM = ReturnType<typeof useOrderDetailVM>;

const SHIP_STAT_NEXT: Record<string, "pending" | "delivered" | "invoiced" | "paid"> = {
  pending:   "delivered",
  delivered: "invoiced",
  invoiced:  "paid",
};

const SHIP_STAT_ACTION: Record<string, string> = {
  pending:   "납품 완료",
  delivered: "청구 완료",
  invoiced:  "수금 완료",
};

export default function OrderDetailShipmentsCard({ vm }: { vm: VM }) {
  const { order, shipments, shipmentSummary, formatKRW, handleShipmentStatusChange, isShipmentUpdating } = vm;
  if (!order) return null;

  const orderAmount = Number(order.orde_pric);

  return (
    <Card>
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">SHIPMENTS</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm font-black text-slate-900">
              납품 현황
              <span className="ml-1.5 text-slate-400 font-normal text-xs">{shipmentSummary.count}건</span>
            </p>
            {shipmentSummary.isFullyShipped && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={11} />
                납품 완료
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 수금 요약 */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryCell label="수주 금액"  value={formatKRW(orderAmount)}                    tone="slate" />
        <SummaryCell label="납품 합계"  value={formatKRW(shipmentSummary.totalShipped)}   tone={shipmentSummary.isFullyShipped ? "emerald" : "orange"} />
        <SummaryCell label="수금 완료"  value={formatKRW(shipmentSummary.totalPaid)}      tone="emerald" />
      </div>

      {/* 납품 목록 */}
      {shipments.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">등록된 납품이 없어요.</p>
      ) : (
        <div className="divide-y divide-slate-50">
          {shipments.map((s) => {
            const next = SHIP_STAT_NEXT[s.ship_stat];
            const actionLabel = SHIP_STAT_ACTION[s.ship_stat];
            const dateLabel = s.ship_date
              ? new Date(s.ship_date).toLocaleDateString("ko-KR")
              : s.crea_date
              ? new Date(s.crea_date).toLocaleDateString("ko-KR")
              : "-";

            return (
              <div key={s.ship_idno} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={s.ship_stat} />
                    <span className="text-sm font-bold text-slate-900">{formatKRW(Number(s.ship_pric))}</span>
                    <span className="ml-auto text-xs text-slate-400 shrink-0">{dateLabel}</span>
                  </div>
                  {s.ship_memo && <p className="text-xs text-slate-400 truncate mt-1">{s.ship_memo}</p>}
                </div>

                {next && s.ship_stat !== "paid" && (
                  <button
                    type="button"
                    disabled={isShipmentUpdating}
                    onClick={() => handleShipmentStatusChange(s.ship_idno, next)}
                    className="shrink-0 px-2.5 py-1 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
                  >
                    {actionLabel}
                  </button>
                )}

                <Link href={`/ship-list/${s.ship_idno}`}>
                  <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition">
                    상세
                    <ExternalLink size={11} />
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* 납품 목록 바로가기 */}
      <Link
        href="/ship-list"
        className="flex items-center justify-end gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 transition pt-1"
      >
        납품 목록 전체 보기
        <ArrowRight size={12} />
      </Link>
    </Card>
  );
}

function SummaryCell({ label, value, tone }: { label: string; value: string; tone: "slate" | "orange" | "emerald" }) {
  const colors = {
    slate:   "text-slate-600",
    orange:  "text-orange-500",
    emerald: "text-emerald-600",
  };
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[10px] font-semibold text-slate-400">{label}</p>
      <p className={cn("text-sm font-black mt-0.5 leading-none", colors[tone])}>{value}</p>
    </div>
  );
}
