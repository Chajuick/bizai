import type React from "react";
import { Phone, Mail, MapPin, Users } from "lucide-react";
import type { ClientRow } from "@/types/client";

function getInitial(name: string) {
  return (name || "").trim()?.[0] ?? "C";
}

export default function ClientProfileCard({ client }: { client: ClientRow }) {
  return (
    <div
      className="rounded-3xl border border-slate-100 bg-white p-4 mb-4"
      style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <span className="text-lg font-black text-blue-600">
            {getInitial(client.clie_name)}
          </span>
        </div>

        <div className="flex-1">
          <p className="text-base font-black text-slate-900">{client.clie_name}</p>

          <div className="mt-3 space-y-2 text-sm">
            {client.cont_name && (
              <Row icon={Users} label="담당" value={client.cont_name} />
            )}
            {client.cont_tele && (
              <Row icon={Phone} label="연락처" value={client.cont_tele} />
            )}
            {client.cont_mail && (
              <Row icon={Mail} label="이메일" value={client.cont_mail} />
            )}
            {client.clie_addr && (
              <Row icon={MapPin} label="주소" value={client.clie_addr} />
            )}
          </div>

          {client.clie_memo && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-1">메모</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {client.clie_memo}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-slate-600">
      <Icon size={14} className="text-slate-400" />
      <span className="font-semibold text-slate-700">{label}</span>
      <span>{value}</span>
    </div>
  );
}