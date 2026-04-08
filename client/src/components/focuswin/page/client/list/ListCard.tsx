// client/src/components/focuswin/clients/ListCard.tsx

// #region Imports
import { ChevronRight, MapPin, Star } from "lucide-react";
import { WorkItemCard } from "@/components/focuswin/common/cards/work-item-card";
import { cn } from "@/lib/utils";
import type { ClientRow } from "@/types/client";
// #endregion

// #region Helpers
function getInitial(name: string) {
  const t = (name || "").trim();
  return t ? t[0] : "C";
}
// #endregion

// #region Types
type Props = {
  client: ClientRow;
  onToggleFavorite: (clie_idno: number) => void;
};
// #endregion

export default function ClientsListCard({ client, onToggleFavorite }: Props) {
  return (
    <WorkItemCard interactive className="group">
      {/* #region Left Icon (Initial Avatar) */}
      <WorkItemCard.Icon>
        <span className="text-sm font-black text-slate-700">{getInitial(client.clie_name)}</span>
      </WorkItemCard.Icon>
      {/* #endregion */}

      {/* #region Main Content */}
      <div className="min-w-0 flex-1">
        {/* #region Header */}
        <WorkItemCard.Header
          title={client.clie_name}
          tags={
            client.indu_type ? (
              <span
                className={["inline-flex items-center", "text-[11px] font-semibold", "px-2 py-0.5 rounded-full", "border", "text-slate-700"].join(" ")}
                style={{
                  background: "rgba(59,130,246,0.06)",
                  borderColor: "rgba(59,130,246,0.12)",
                  color: "rgba(30,64,175,0.90)",
                }}
              >
                {client.indu_type}
              </span>
            ) : null
          }
          actions={
            <div className="flex items-center gap-1">
              {/* 즐겨찾기 버튼 */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite(client.clie_idno);
                }}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
                  client.favr_yesn
                    ? "border-amber-300 bg-amber-50 text-amber-400"
                    : "border-slate-200 bg-white text-slate-300 opacity-0 group-hover:opacity-100"
                )}
                aria-label={client.favr_yesn ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              >
                <Star size={12} fill={client.favr_yesn ? "currentColor" : "none"} />
              </button>
              <ChevronRight size={18} className="text-slate-300 transition group-hover:text-slate-500" aria-hidden />
            </div>
          }
        />
        {/* #endregion */}

        {/* #region Body */}
        <WorkItemCard.Body>
          {/* #region Meta Row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {client.bizn_numb && (
              <span className="text-slate-400 font-mono">
                {`${client.bizn_numb.slice(0, 3)}-${client.bizn_numb.slice(3, 5)}-${client.bizn_numb.slice(5)}`}
              </span>
            )}
            {client.cont_name && <span className="text-slate-700 font-medium">담당: {client.cont_name}</span>}
            {client.cont_tele && <span className="text-slate-500 font-semibold">{client.cont_tele}</span>}
            {client.cont_mail && <span className="text-slate-500 truncate">{client.cont_mail}</span>}
          </div>
          {/* #endregion */}

          {/* #region Address */}
          {client.clie_addr && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 line-clamp-1">
              <MapPin size={14} className="shrink-0 text-slate-400" aria-hidden />
              <span className="min-w-0 truncate">{client.clie_addr}</span>
            </p>
          )}
          {/* #endregion */}
        </WorkItemCard.Body>
        {/* #endregion */}
      </div>
      {/* #endregion */}
    </WorkItemCard>
  );
}
