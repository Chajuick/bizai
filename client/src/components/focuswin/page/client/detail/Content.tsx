// src/components/focuswin/client/detail/Content.tsx

// #region Imports
import { useState } from "react";
import { ShoppingCart, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

import { useClientDetailVM } from "@/hooks/focuswin/client/useClientDetailVM";

import ContactEditor from "@/components/focuswin/page/client/common/ContactEditor";
import ClientDetailMetaCard from "./MetaCard";
import ClientDetailEditFormCard from "./EditFormCard";
import ActiveDeals from "./ActiveDeals";
import PurchaseSection from "./PurchaseSection";
import ClientTimeline from "./Timeline";
// #endregion

// #region Types
type Props = {
  vm: ReturnType<typeof useClientDetailVM>;
};

type TradeTab = "sales" | "purchase";
// #endregion

export default function ClientDetailContent({ vm }: Props) {
  const isEditing = vm.isEditing;
  const clieType = vm.client?.clie_type ?? "sales";
  const [tradeTab, setTradeTab] = useState<TradeTab>("sales");

  return (
    <div className="flex flex-col gap-6">

      {/* 거래처 정보 */}
      {isEditing ? (
        <ClientDetailEditFormCard
          form={vm.clientForm}
          setForm={vm.setClientForm}
        />
      ) : (
        <ClientDetailMetaCard client={vm.client} />
      )}

      {/* 담당자 */}
      <ContactEditor
        disabled={!isEditing}
        contacts={vm.contactsDraft}
        onAdd={vm.addContact}
        onChange={vm.updateContact}
        onRemove={vm.removeContact}
      />

      {/* 매출/매입 섹션 (보기 모드에서만) */}
      {!isEditing && (
        <>
          {/* both 타입: 탭 전환 */}
          {clieType === "both" && (
            <div className="flex gap-1 p-1 rounded-2xl bg-slate-100">
              <TradeTabButton
                active={tradeTab === "sales"}
                icon={<ShoppingCart size={13} />}
                label="매출"
                onClick={() => setTradeTab("sales")}
              />
              <TradeTabButton
                active={tradeTab === "purchase"}
                icon={<Receipt size={13} />}
                label="매입"
                onClick={() => setTradeTab("purchase")}
              />
            </div>
          )}

          {/* 매출 섹션 */}
          {(clieType === "sales" || (clieType === "both" && tradeTab === "sales")) && (
            <ActiveDeals vm={vm} />
          )}

          {/* 매입 섹션 */}
          {(clieType === "purchase" || (clieType === "both" && tradeTab === "purchase")) && (
            <PurchaseSection vm={vm} />
          )}

          {/* 타임라인: 항상 표시 */}
          <ClientTimeline vm={vm} />
        </>
      )}
    </div>
  );
}

// #region TradeTabButton
function TradeTabButton({
  active, icon, label, onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all",
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
// #endregion
