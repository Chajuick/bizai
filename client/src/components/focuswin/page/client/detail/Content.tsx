// src/components/focuswin/client/detail/Content.tsx

// #region Imports
import { useState } from "react";
import { cn } from "@/lib/utils";

import { useClientDetailVM } from "@/hooks/focuswin/client/useClientDetailVM";

import ContactEditor from "@/components/focuswin/page/client/common/ContactEditor";

import ClientDetailKpi from "./Kpi";
import ClientDetailOrders from "./Orders";
import ClientDetailRecentSaleList from "./RecentSaleList";
import ClientDetailUpcomingSchedules from "./UpcomingSchedules";

import ClientDetailMetaCard from "./MetaCard";
import ClientDetailEditFormCard from "./EditFormCard";
// #endregion

// #region Types
type Props = {
  vm: ReturnType<typeof useClientDetailVM>;
};

type BottomTab = "sales" | "purchase";
// #endregion

export default function ClientDetailContent({ vm }: Props) {
  const isEditing = vm.isEditing;
  const clieType = vm.client?.clie_type ?? "sales";
  const [bottomTab, setBottomTab] = useState<BottomTab>("sales");

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

      {/* 보기 모드에서만 노출 */}
      {!isEditing && (
        <>
          {/* 공통 상단: 영업일지 + 예정 일정 (모든 거래처 유형) */}
          <ClientDetailRecentSaleList
            logs={vm.logs}
            loading={vm.logsLoading}
            clientName={vm.client?.clie_name ?? ""}
          />

          <ClientDetailUpcomingSchedules
            schedules={vm.schedules}
            loading={vm.schedulesLoading}
          />

          {/* 유형별 하단 섹션 */}
          {clieType === "sales" && (
            <>
              <ClientDetailKpi
                logsCount={vm.logs.length}
                totalOrderAmount={vm.totalOrderAmount}
              />
              <ClientDetailOrders
                orders={vm.orders}
                loading={vm.ordersLoading}
              />
            </>
          )}

          {clieType === "purchase" && (
            <PurchaseSection />
          )}

          {clieType === "both" && (
            <BothSection
              tab={bottomTab}
              onTabChange={setBottomTab}
              vm={vm}
            />
          )}
        </>
      )}
    </div>
  );
}

// #region PurchaseSection (매입사 전용)
function PurchaseSection() {
  return (
    <div
      className="rounded-3xl border border-orange-100 bg-orange-50/30 p-4 text-center py-10"
      style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
    >
      <p className="text-xs font-extrabold tracking-[0.18em] text-orange-400 uppercase mb-1">EXPENSES</p>
      <p className="text-sm font-black text-slate-800 mb-1">지출 내역</p>
      <p className="text-xs text-slate-500">지출 메뉴에서 이 거래처의 지출 내역을 관리하세요.</p>
    </div>
  );
}
// #endregion

// #region BothSection (매출+매입 토글)
function BothSection({
  tab,
  onTabChange,
  vm,
}: {
  tab: BottomTab;
  onTabChange: (t: BottomTab) => void;
  vm: ReturnType<typeof useClientDetailVM>;
}) {
  return (
    <div>
      {/* 탭 토글 */}
      <div className="flex rounded-2xl border border-slate-200 bg-slate-100 p-1 mb-4 w-fit gap-1">
        {(["sales", "purchase"] as BottomTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTabChange(t)}
            className={cn(
              "px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors",
              tab === t
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {t === "sales" ? "매출 정보" : "매입 정보"}
          </button>
        ))}
      </div>

      {tab === "sales" ? (
        <>
          <ClientDetailKpi
            logsCount={vm.logs.length}
            totalOrderAmount={vm.totalOrderAmount}
          />
          <div className="mt-4">
            <ClientDetailOrders
              orders={vm.orders}
              loading={vm.ordersLoading}
            />
          </div>
        </>
      ) : (
        <PurchaseSection />
      )}
    </div>
  );
}
// #endregion
