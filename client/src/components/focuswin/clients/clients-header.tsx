// client/src/components/focuswin/clients/clients-header.tsx
"use client";

import { Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

function chip(active: boolean) {
  return active
    ? {
        background: "rgba(37,99,235,0.10)",
        borderColor: "rgba(37,99,235,0.25)",
        color: "rgb(37,99,235)",
      }
    : {
        background: "white",
        borderColor: "rgba(15,23,42,0.08)",
        color: "rgb(100,116,139)",
      };
}

export default function ClientsHeader({
  search,
  setSearch,
  filteredCount,
  onCreate,
}: {
  search: string;
  setSearch: (v: string) => void;
  filteredCount: number;
  onCreate: () => void;
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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
            CLIENTS
          </p>
          <h1 className="text-base sm:text-lg font-black text-slate-900">고객사 관리</h1>
          <p className="mt-1 text-sm text-slate-500">고객사/담당자 정보를 빠르게 찾아요.</p>
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
          고객사 추가
        </button>
      </div>

      <div className="mt-3 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        {!!search.trim() && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center"
            aria-label="검색어 지우기"
          >
            <X size={14} className="text-slate-600" />
          </button>
        )}
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="고객사명, 담당자로 검색…"
          className="pl-9 pr-10 py-3 text-sm rounded-2xl border border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-blue-200"
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
          style={chip(true)}
        >
          전체{" "}
          <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-600 text-white">
            {filteredCount}
          </span>
        </span>
        {!!search.trim() && (
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
            style={chip(false)}
          >
            검색중
          </span>
        )}
      </div>
    </div>
  );
}