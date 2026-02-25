"use client";

import { ArrowLeft } from "lucide-react";

export default function ClientDetailHeader({
  name,
  onBack,
}: {
  name: string;
  onBack: () => void;
}) {
  return (
    <div
      className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 pt-3 pb-4 border-b mb-4"
      style={{
        background: "rgba(255,255,255,0.86)",
        borderColor: "rgba(15,23,42,0.08)",
        backdropFilter: "blur(18px)",
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-slate-700" />
        </button>

        <div className="min-w-0">
          <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
            CLIENT DETAIL
          </p>
          <h1 className="text-base sm:text-lg font-black text-slate-900 truncate">
            {name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            연락처/기록/수주를 한 화면에서 확인해요.
          </p>
        </div>
      </div>
    </div>
  );
}