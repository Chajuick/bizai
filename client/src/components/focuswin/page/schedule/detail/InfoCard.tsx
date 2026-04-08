// components/focuswin/page/schedule/detail/InfoCard.tsx

import { Building2, CalendarClock, FileText, ShoppingCart, XCircle, Package, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/focuswin/common/ui/card";
import MetaItem from "@/components/focuswin/common/ui/meta-item";
import StatusBadge from "@/components/focuswin/common/badges/status-badge";
import { cn } from "@/lib/utils";
import type { useScheduleDetailVM } from "@/hooks/focuswin/schedule/useScheduleDetailVM";

type VM = ReturnType<typeof useScheduleDetailVM>;

type EffectiveStatus = "scheduled" | "completed" | "canceled" | "overdue" | "imminent";

export default function ScheduleDetailInfoCard({ vm }: { vm: VM }) {
  const { schedule, openOrderForm, handleCancel, isCancelPending, linkedOrders, linkedShipments, formatKRW } = vm;
  if (!schedule) return null;

  const effectiveStat: EffectiveStatus = schedule.overdue
    ? "overdue"
    : schedule.imminent
    ? "imminent"
    : schedule.sche_stat as EffectiveStatus;

  const isScheduled = schedule.sche_stat === "scheduled" || schedule.sche_stat === "overdue";

  const dateStr = new Date(schedule.sche_date).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-4">
    <Card>
      {/* 상태 + 날짜 */}
      <div className="flex items-center gap-2">
        <StatusBadge status={effectiveStat} />
        <span className="text-sm font-semibold text-slate-600">{dateStr}</span>
      </div>

      {/* 기본 정보 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
        {schedule.clie_name && (
          <MetaItem icon={Building2} label="거래처" value={schedule.clie_name} tone="blue" />
        )}
        <div className="sm:col-span-2">
          <MetaItem icon={CalendarClock} label="일정 내용" value={schedule.sche_name} tone="slate" />
        </div>
        {schedule.sche_desc && (
          <div className="sm:col-span-2">
            <MetaItem icon={FileText} label="메모" value={schedule.sche_desc} tone="slate" />
          </div>
        )}
      </div>

      {/* 예정 상태일 때만 — 수주 생성 / 취소 처리 */}
      {isScheduled && (
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={openOrderForm}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition"
          >
            <ShoppingCart size={13} />
            수주 생성
          </button>
          <button
            type="button"
            disabled={isCancelPending}
            onClick={handleCancel}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition",
              isCancelPending && "opacity-40"
            )}
          >
            <XCircle size={13} />
            취소 처리
          </button>
        </div>
      )}
    </Card>

    {/* 연결된 수주 / 납품 */}
    {linkedOrders.length > 0 && (
      <Card>
        <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-3">연결 이력</p>
        <div className="space-y-2">
          {linkedOrders.map((order) => (
            <Link key={order.orde_idno} href={`/orde-list/${order.orde_idno}`}>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
                  <ShoppingCart size={15} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">수주</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{order.prod_serv}</p>
                  <p className="text-xs text-emerald-600 font-semibold">{formatKRW(Number(order.orde_pric))}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusBadge status={order.orde_stat} />
                  <ArrowRight size={13} className="text-emerald-300" />
                </div>
              </div>
            </Link>
          ))}

          {linkedShipments.length > 0 && (
            <>
              <div className="flex items-center gap-2 px-1">
                <div className="w-px h-4 bg-slate-200 mx-4" />
              </div>
              {linkedShipments.map((s) => (
                <Link key={s.ship_idno} href={`/ship-list/${s.ship_idno}`}>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-orange-50 border border-orange-100 hover:bg-orange-100 transition cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-orange-400 flex items-center justify-center shrink-0 shadow-sm">
                      <Package size={15} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">납품</p>
                      <p className="text-xs text-orange-600 font-semibold">{formatKRW(Number(s.ship_pric))}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusBadge status={s.ship_stat} />
                      <ArrowRight size={13} className="text-orange-300" />
                    </div>
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>
      </Card>
    )}
    </div>
  );
}
