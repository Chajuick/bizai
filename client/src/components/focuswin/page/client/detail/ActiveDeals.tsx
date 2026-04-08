// client/src/components/focuswin/page/client/detail/ActiveDeals.tsx

import { useMemo } from "react";
import { formatKRW } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { useClientDetailVM } from "@/hooks/focuswin/client/useClientDetailVM";

type VM = ReturnType<typeof useClientDetailVM>;

// #region Config
const STEPS = [
  { key: "proposal",    label: "견적" },
  { key: "negotiation", label: "협상" },
  { key: "confirmed",   label: "확정" },
  { key: "pending",     label: "준비" },
  { key: "delivered",   label: "출하" },
  { key: "invoiced",    label: "청구" },
  { key: "paid",        label: "수금" },
] as const;
// #endregion

// #region Helpers
function getStepIndex(orderStat: string, shipStat?: string): number {
  if (orderStat === "proposal")    return 0;
  if (orderStat === "negotiation") return 1;
  if (orderStat === "confirmed") {
    if (!shipStat || shipStat === "pending")  return 3;
    if (shipStat === "delivered") return 4;
    if (shipStat === "invoiced")  return 5;
    if (shipStat === "paid")      return 6;
    return 2;
  }
  return 2; // confirmed, no shipment yet
}
// #endregion

// #region Main
export default function ActiveDeals({ vm }: { vm: VM }) {
  const clieType = vm.client?.clie_type ?? "sales";
  if (clieType === "purchase") return null;

  const activeDeals = useMemo(() => {
    // 수주별 납품 그룹핑
    const shipByOrder = new Map<number, typeof vm.shipments>();
    for (const s of vm.shipments) {
      const arr = shipByOrder.get(s.orde_idno) ?? [];
      arr.push(s);
      shipByOrder.set(s.orde_idno, arr);
    }

    return vm.orders
      .filter(o => o.orde_stat !== "canceled")
      .map(o => {
        const ships = shipByOrder.get(o.orde_idno) ?? [];
        const currentStep =
          ships.length > 0
            ? Math.max(...ships.map(s => getStepIndex(o.orde_stat, s.ship_stat)))
            : getStepIndex(o.orde_stat);
        return { order: o, currentStep };
      })
      .filter(d => d.currentStep < 6)
      .sort((a, b) => b.currentStep - a.currentStep);
  }, [vm.orders, vm.shipments]);

  if (vm.ordersLoading || vm.shipmentsLoading) return null;
  if (activeDeals.length === 0) return null;

  return (
    <div
      className="rounded-3xl border border-slate-100 bg-white p-4"
      style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
    >
      <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase mb-1">ACTIVE DEALS</p>
      <p className="text-sm font-black text-slate-900 mb-4">
        진행 중인 계약{" "}
        <span className="text-slate-400 font-normal text-xs">{activeDeals.length}건</span>
      </p>

      <div className="space-y-6">
        {activeDeals.map(({ order, currentStep }) => (
          <DealRow
            key={order.orde_idno}
            title={order.prod_serv}
            amount={Number(order.orde_pric)}
            currentStep={currentStep}
          />
        ))}
      </div>
    </div>
  );
}
// #endregion

// #region DealRow
function DealRow({ title, amount, currentStep }: {
  title: string;
  amount: number;
  currentStep: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-xs font-semibold text-slate-800 truncate">{title}</span>
        <span className="text-xs font-bold text-slate-400 shrink-0">{formatKRW(amount)}</span>
      </div>
      <StepProgress currentStep={currentStep} />
    </div>
  );
}
// #endregion

// #region StepProgress
function StepProgress({ currentStep }: { currentStep: number }) {
  const fillPct = (currentStep / (STEPS.length - 1)) * 100;

  return (
    <div className="relative">
      {/* 전체 트랙 */}
      <div className="absolute top-1 left-0 right-0 h-px bg-slate-200" />
      {/* 완료 구간 채우기 */}
      {currentStep > 0 && (
        <div
          className="absolute top-1 left-0 h-px bg-emerald-300 transition-all"
          style={{ width: `${fillPct}%` }}
        />
      )}
      {/* dot + label */}
      <div className="relative flex justify-between">
        {STEPS.map((step, i) => {
          const done   = i < currentStep;
          const active = i === currentStep;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-2 h-2 rounded-full z-10 transition-colors",
                done   ? "bg-emerald-400" :
                active ? "bg-blue-500 ring-2 ring-blue-200" :
                         "bg-slate-200"
              )} />
              <span className={cn(
                "text-[9px] font-semibold leading-none whitespace-nowrap",
                done   ? "text-emerald-500" :
                active ? "text-blue-600 font-bold" :
                         "text-slate-300"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
// #endregion
