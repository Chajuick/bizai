// components/focuswin/page/order/detail/InfoCard.tsx

import { Banknote, Building2, CalendarCheck, CalendarClock, FileText, Calendar, BookOpen, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/focuswin/common/ui/card";
import MetaItem from "@/components/focuswin/common/ui/meta-item";
import { StepProgress } from "@/components/focuswin/common/progress/step-progress";
import type { useOrderDetailVM } from "@/hooks/focuswin/order/useOrderDetailVM";

type VM = ReturnType<typeof useOrderDetailVM>;

const ORDER_STEPS = [
  { key: "proposal",    label: "제안" },
  { key: "negotiation", label: "협상" },
  { key: "confirmed",   label: "확정" },
] as const;

export default function OrderDetailInfoCard({ vm }: { vm: VM }) {
  const { order, formatKRW } = vm;
  if (!order) return null;

  const stage = order.orde_stat === "canceled" ? "proposal" : order.orde_stat as "proposal" | "negotiation" | "confirmed";
  const isCanceled = order.orde_stat === "canceled";

  return (
    <div className="space-y-4">
      {/* 기본 정보 */}
      <Card>
        {/* 파이프라인 */}
        {!isCanceled && (
          <div className="mb-4">
            <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">PIPELINE</p>
            <StepProgress.Line steps={ORDER_STEPS} current={stage} showLabels />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetaItem icon={Building2}    label="거래처"   value={order.clie_name}                          tone="blue" />
          <MetaItem icon={Banknote}     label="계약금액" value={formatKRW(Number(order.orde_pric))}       tone="amber" />
          {order.ctrt_date && (
            <MetaItem icon={CalendarCheck} label="계약일"
              value={new Date(order.ctrt_date).toLocaleDateString("ko-KR")} tone="slate" />
          )}
          {order.expd_date && (
            <MetaItem icon={CalendarClock} label="납기일"
              value={new Date(order.expd_date).toLocaleDateString("ko-KR")} tone="violet" />
          )}
          {order.orde_memo && (
            <div className="sm:col-span-2">
              <MetaItem icon={FileText} label="메모" value={order.orde_memo} tone="slate" />
            </div>
          )}
        </div>
      </Card>

      {/* 연결 이력 */}
      {(order.sche_idno || order.sale_idno) && (
        <Card>
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-3">연결 이력</p>
          <div className="space-y-2">

            {/* 일정 */}
            {order.sche_idno && (
              <Link href={`/sche-list/${order.sche_idno}`}>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition cursor-pointer">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                    <Calendar size={15} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">일정</p>
                    <p className="text-sm font-bold text-slate-800">연결 일정 보기</p>
                  </div>
                  <ArrowRight size={13} className="text-amber-300 shrink-0" />
                </div>
              </Link>
            )}

            {/* 영업일지 */}
            {order.sale_idno && (
              <>
                {order.sche_idno && (
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-px h-4 bg-slate-200 mx-4" />
                  </div>
                )}
                <Link href={`/sale-list/${order.sale_idno}`}>
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
      )}
    </div>
  );
}
