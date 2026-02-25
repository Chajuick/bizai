// client/src/components/focuswin/clients/clients-list.tsx

import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { WorkItemCard } from "@/components/focuswin/common/work-item-card";
import type { ClientRow } from "@/types/client";

function getInitial(name: string) {
  const t = (name || "").trim();
  return t ? t[0] : "C";
}

export default function ClientsList({ clients }: { clients: ClientRow[] }) {
  return (
    <div className="space-y-2">
      {clients.map((client) => (
        <Link key={client.id} href={`/clients/${client.id}`} className="block">
          <WorkItemCard interactive>
            {/* 이니셜 아바타 */}
            <WorkItemCard.Icon>
              <span className="text-sm font-black">{getInitial(client.name)}</span>
            </WorkItemCard.Icon>

            <div className="min-w-0 flex-1">
              <WorkItemCard.Header
                title={client.name}
                tags={
                  client.industry ? (
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
                  ) : null
                }
                actions={
                  <div className="w-8 h-8 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center transition group-hover:bg-blue-50 group-hover:border-blue-100">
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" />
                  </div>
                }
              />

              <WorkItemCard.Body>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  {client.contactPerson && <span>담당: {client.contactPerson}</span>}
                  {client.contactPhone && <span className="font-semibold">{client.contactPhone}</span>}
                  {client.contactEmail && <span className="truncate">{client.contactEmail}</span>}
                </div>
                {client.address && (
                  <p className="mt-1 text-xs text-slate-500 line-clamp-1">📍 {client.address}</p>
                )}
              </WorkItemCard.Body>
            </div>
          </WorkItemCard>
        </Link>
      ))}
    </div>
  );
}
