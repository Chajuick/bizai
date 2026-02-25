// client/src/components/focuswin/deliveries/deliveries-header.tsx
"use client";

import { Plus } from "lucide-react";
import type { DeliveryStatus } from "./deliveries.types";
import { deliveryTabs } from "./deliveries.types";

export default function DeliveriesHeader({
  activeTab,
  setActiveTab,
  onCreate,
  isLoading,
  hasData,
  stats,
  formatKRW,
}: {
  activeTab: DeliveryStatus | "all";
  setActiveTab: (v: DeliveryStatus | "all") => void;
  onCreate: () => void;
  isLoading: boolean;
  hasData: boolean;
  stats: { paid: number; pending: number };
  formatKRW: (n: number) => string;
}) {
  return (
    <div
      className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 border-b mb-4"
      style={{
        background: "rgba(255,255,255,0.86)",
        borderColor: "rgba(15,23,42,0.08)",
        backdropFilter: "blur(18px)",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
            DELIVERIES
          </p>
          <h1 className="text-base sm:text-lg font-black text-slate-900">납품/매출</h1>
          <p className="mt-1 text-sm text-slate-500">납품 상태를 한 번에 관리해요.</p>
        </div>

        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-white transition active:scale-[0.99]"
          style={{
            background: "rgb(37, 99, 235)",
            boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
          }}
        >
          <Plus size={16} />
          납품 등록
        </button>
      </div>

      {!isLoading && hasData && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2">
            <p className="text-[11px] font-extrabold tracking-[0.16em] text-slate-400 uppercase">PAID</p>
            <p className="mt-0.5 text-base font-black text-slate-900">{formatKRW(stats.paid)}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">수금 완료</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2">
            <p className="text-[11px] font-extrabold tracking-[0.16em] text-slate-400 uppercase">PENDING</p>
            <p className="mt-0.5 text-base font-black text-slate-900">{formatKRW(stats.pending)}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">미수금</p>
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {deliveryTabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition"
              style={
                active
                  ? {
                      background: "rgba(37,99,235,0.10)",
                      borderColor: "rgba(37,99,235,0.25)",
                      color: "rgb(37,99,235)",
                    }
                  : {
                      background: "white",
                      borderColor: "rgba(15,23,42,0.08)",
                      color: "rgb(100,116,139)",
                    }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
