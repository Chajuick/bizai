// src/components/focuswin/client/detail/MetaCard.tsx

// #region Imports
import { Building2, Hash, MapPin } from "lucide-react";
import { Card } from "@/components/focuswin/common/ui/card";
import MetaItem from "@/components/focuswin/common/ui/meta-item";

import type { ClientRow } from "@/types/client";
// #endregion

// #region Types
type Props = {
  client?: ClientRow | null;
};

const CLIENT_TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  sales:    { label: "매출사", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  purchase: { label: "매입사", cls: "bg-orange-100 text-orange-700 border-orange-200" },
  both:     { label: "매출+매입", cls: "bg-purple-100 text-purple-700 border-purple-200" },
};
// #endregion

export default function ClientDetailMetaCard({ client }: Props) {
  if (!client) return null;

  const hasMeta = client.clie_name || client.bizn_numb || client.indu_type || client.clie_addr || client.clie_memo;

  if (!hasMeta) return null;

  const typeBadge = CLIENT_TYPE_BADGE[client.clie_type ?? "sales"] ?? CLIENT_TYPE_BADGE.sales;

  return (
    <Card>
      {/* 거래처 유형 뱃지 */}
      <div className="mb-3">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${typeBadge.cls}`}>
          {typeBadge.label}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {client.clie_name && <MetaItem icon={Building2} label="거래처" value={client.clie_name} tone="blue" />}

        {client.bizn_numb && (
          <MetaItem
            icon={Hash}
            label="사업자번호"
            value={`${client.bizn_numb.slice(0, 3)}-${client.bizn_numb.slice(3, 5)}-${client.bizn_numb.slice(5)}`}
            tone="slate"
          />
        )}

        {client.indu_type && <MetaItem icon={Building2} label="업종" value={client.indu_type} tone="sky" />}

        {client.clie_addr && (
          <div>
            <MetaItem icon={MapPin} label="주소" value={client.clie_addr} tone="violet" />
          </div>
        )}
      </div>

      {client.clie_memo && (
        <div className="mt-2 pt-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">메모</p>

          <div className="max-h-32 overflow-auto pr-1">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{client.clie_memo}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
