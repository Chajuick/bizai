// src/components/focuswin/client/detail/MetaCard.tsx

// #region Imports
import { Building2, MapPin } from "lucide-react";
import { Card } from "@/components/focuswin/common/ui/card";
import MetaItem from "@/components/focuswin/common/ui/meta-item";

import type { ClientRow } from "@/types/client";
// #endregion

// #region Types
type Props = {
  client?: ClientRow | null;
};
// #endregion

export default function ClientDetailMetaCard({ client }: Props) {
  if (!client) return null;

  const hasMeta = client.clie_name || client.indu_type || client.clie_addr || client.clie_memo;

  if (!hasMeta) return null;

  return (
    <Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {client.clie_name && <MetaItem icon={Building2} label="고객사" value={client.clie_name} tone="blue" />}

        {client.indu_type && <MetaItem icon={Building2} label="업종" value={client.indu_type} tone="sky" />}

        {client.clie_addr && (
          <div className="sm:col-span-2">
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
