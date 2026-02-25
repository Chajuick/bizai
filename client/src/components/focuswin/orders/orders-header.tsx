import { Plus } from "lucide-react";
import type { OrderStatus } from "@/hooks/focuswin/orders/useOrdersViewModel";

export default function OrdersHeader({
  activeTab,
  setActiveTab,
  stats,
  formatKRW,
  statusTabs,
  onCreate,
}: {
  activeTab: OrderStatus | "all";
  setActiveTab: (v: OrderStatus | "all") => void;
  stats: { total: number; confirmed: number };
  formatKRW: (n: number) => string;
  statusTabs: { key: OrderStatus | "all"; label: string }[];
  onCreate: () => void;
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
            ORDERS
          </p>
          <h1 className="text-base sm:text-lg font-black text-slate-900">수주 관리</h1>
          <p className="mt-1 text-sm text-slate-500">
            파이프라인을 한눈에 보고, 상태를 빠르게 정리하세요.
          </p>
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
          수주 등록
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2">
          <p className="text-[11px] font-extrabold tracking-[0.16em] text-slate-400 uppercase">
            PIPELINE
          </p>
          <p className="mt-0.5 text-base font-black text-slate-900">{formatKRW(stats.total)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2">
          <p className="text-[11px] font-extrabold tracking-[0.16em] text-slate-400 uppercase">
            CONFIRMED
          </p>
          <p className="mt-0.5 text-base font-black text-slate-900">{formatKRW(stats.confirmed)}</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {statusTabs.map((tab) => {
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