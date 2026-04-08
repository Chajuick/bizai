// components/focuswin/page/shipment/detail/InfoCard.tsx

import { Link } from "wouter";
import { Banknote, Building2, CalendarCheck, FileText, ShoppingCart, Calendar, BookOpen, ArrowRight } from "lucide-react";
import { Card } from "@/components/focuswin/common/ui/card";
import MetaItem from "@/components/focuswin/common/ui/meta-item";
import StatusBadge from "@/components/focuswin/common/badges/status-badge";
import type { useShipmentDetailVM } from "@/hooks/focuswin/shipment/useShipmentDetailVM";

type VM = ReturnType<typeof useShipmentDetailVM>;

export default function ShipmentDetailInfoCard({ vm }: { vm: VM }) {
  const { shipment, linkedOrder, linkedSchedule, formatKRW } = vm;
  if (!shipment) return null;

  return (
    <div className="space-y-4">
      {/* 납품 기본 정보 */}
      <Card>
        <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-3">SHIPMENT INFO</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetaItem icon={Building2}    label="거래처" value={shipment.clie_name} tone="blue" />
          <MetaItem icon={Banknote}     label="매출 금액" value={formatKRW(Number(shipment.ship_pric))} tone="amber" />
          {shipment.ship_date && (
            <MetaItem
              icon={CalendarCheck}
              label="납품일"
              value={new Date(shipment.ship_date).toLocaleDateString("ko-KR")}
              tone="slate"
            />
          )}
          {shipment.ship_memo && (
            <div className="sm:col-span-2">
              <MetaItem icon={FileText} label="메모" value={shipment.ship_memo} tone="slate" />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <StatusBadge status={shipment.ship_stat} />
        </div>
      </Card>

      {/* 연결 체인: 수주 → 일정 → 영업 */}
      <Card>
        <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-3">연결 이력</p>

        <div className="space-y-2">
          {/* 수주 */}
          {linkedOrder ? (
            <Link href={`/orde-list/${linkedOrder.orde_idno}`}>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
                  <ShoppingCart size={15} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">수주</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{linkedOrder.prod_serv}</p>
                  <p className="text-xs text-emerald-600 font-semibold">{formatKRW(Number(linkedOrder.orde_pric))}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusBadge status={linkedOrder.orde_stat} />
                  <ArrowRight size={13} className="text-emerald-300" />
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                <ShoppingCart size={15} className="text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">연결 수주 없음</p>
            </div>
          )}

          {/* 일정 */}
          {linkedSchedule && (
            <>
              <div className="flex items-center gap-2 px-1">
                <div className="w-px h-4 bg-slate-200 mx-4" />
              </div>
              <Link href={`/sche-list/${linkedSchedule.sche_idno}`}>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition cursor-pointer">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                    <Calendar size={15} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">일정</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{linkedSchedule.sche_name}</p>
                    {linkedSchedule.sche_date && (
                      <p className="text-xs text-amber-600 font-semibold">
                        {new Date(linkedSchedule.sche_date).toLocaleDateString("ko-KR")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusBadge status={linkedSchedule.sche_stat} />
                    <ArrowRight size={13} className="text-amber-300" />
                  </div>
                </div>
              </Link>
            </>
          )}

          {/* 영업일지 */}
          {linkedSchedule && linkedSchedule.sale_idno && (
            <>
              <div className="flex items-center gap-2 px-1">
                <div className="w-px h-4 bg-slate-200 mx-4" />
              </div>
              <Link href={`/sale-list/${linkedSchedule.sale_idno}`}>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition cursor-pointer">
                  <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shrink-0 shadow-sm">
                    <BookOpen size={15} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide">영업일지</p>
                    <p className="text-sm font-bold text-slate-800">영업일지 보기</p>
                  </div>
                  <ArrowRight size={13} className="text-blue-300 shrink-0" />
                </div>
              </Link>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
