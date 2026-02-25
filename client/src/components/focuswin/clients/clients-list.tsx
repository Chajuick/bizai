// client/src/components/focuswin/clients/clients-list.tsx
"use client";

import { Link } from "wouter";
import { ChevronRight, Users, Plus } from "lucide-react";

function getInitial(name: string) {
  const t = (name || "").trim();
  return t ? t[0] : "C";
}

export default function ClientsList({
  clients,
  onCreate,
}: {
  clients: any[];
  onCreate: () => void;
}) {
  if ((clients?.length ?? 0) === 0) {
    return (
      <div className="text-center py-14">
        <div className="mx-auto w-14 h-14 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <Users size={26} className="text-blue-600" />
        </div>
        <p className="mt-4 text-base font-black text-slate-900">고객사가 없습니다</p>
        <p className="mt-1 text-sm text-slate-500">첫 번째 고객사를 등록해보세요.</p>
        <div className="mt-5 flex justify-center">
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: "rgb(37, 99, 235)" }}
          >
            <Plus size={16} />
            고객사 등록하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clients.map((client) => (
        <Link key={client.id} href={`/clients/${client.id}`}>
          <div
            className={[
              "group rounded-3xl border border-slate-100 bg-white p-4 transition cursor-pointer",
              "hover:shadow-[0_16px_40px_rgba(15,23,42,0.06)] hover:border-blue-100",
              "focus-within:ring-2 focus-within:ring-blue-200",
            ].join(" ")}
            style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-blue-600">{getInitial(client.name)}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-black text-slate-900 text-sm truncate">{client.name}</p>
                  {client.industry && (
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        background: "rgba(37,99,235,0.08)",
                        borderColor: "rgba(37,99,235,0.18)",
                        color: "rgb(37,99,235)",
                      }}
                    >
                      {client.industry}
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  {client.contactPerson && <span>담당: {client.contactPerson}</span>}
                  {client.contactPhone && <span className="font-semibold">{client.contactPhone}</span>}
                  {client.contactEmail && <span className="truncate">{client.contactEmail}</span>}
                </div>

                {client.address && (
                  <p className="mt-2 text-xs text-slate-500 line-clamp-1">📍 {client.address}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center transition group-hover:bg-blue-50 group-hover:border-blue-100">
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}