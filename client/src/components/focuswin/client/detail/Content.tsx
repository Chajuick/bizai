// src/components/focuswin/client/detail/Content.tsx

// #region Imports
import { useClientDetailVM } from "@/hooks/focuswin/client/useClientDetailVM";

import ContactEditor from "@/components/focuswin/client/common/ContactEditor";

import ClientDetailKpi from "./Kpi";
import ClientDetailOrders from "./Orders";
import ClientDetailRecentSaleList from "./RecentSaleList";

import ClientDetailMetaCard from "./MetaCard";
import ClientDetailEditFormCard from "./EditFormCard";
// #endregion

// #region Types
type Props = {
  vm: ReturnType<typeof useClientDetailVM>;
};
// #endregion

export default function ClientDetailContent({ vm }: Props) {
  const isEditing = vm.isEditing;

  return (
    <div className="flex flex-col gap-6">

      {/* 고객사 정보 */}
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
          <ClientDetailKpi
            logsCount={vm.logs.length}
            totalOrderAmount={vm.totalOrderAmount}
          />

          <ClientDetailRecentSaleList
            logs={vm.logs}
            loading={vm.logsLoading}
            clientName={vm.client?.clie_name ?? ""}
          />

          <ClientDetailOrders
            orders={vm.orders}
            loading={vm.ordersLoading}
          />
        </>
      )}
    </div>
  );
}