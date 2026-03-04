// #region Imports
import { Plus } from "lucide-react";

import PageScaffold from "@/components/focuswin/common/page-scaffold";
import SkeletonCardList from "@/components/focuswin/common/skeleton-card-list";

import ShipmentListHeader from "@/components/focuswin/shipment/list/Header";
import ShipmentListEmptyCard from "@/components/focuswin/shipment/list/EmptyCard";
import ShipmentListContent from "@/components/focuswin/shipment/list/Content";

import { ShipmentModals } from "@/components/focuswin/shipment/list/ShipmentModals";

import { useShipmentListVM } from "@/hooks/focuswin/shipment/useShipmentListVM";
// #endregion

export default function ShipmentListPage() {
  const vm = useShipmentListVM();

  return (
    <>
      {/* 모달 조립: VM의 상태/핸들러를 받아 렌더 */}
      <ShipmentModals {...vm.modalProps} />

      <PageScaffold
        kicker="SHIPMENTS"
        title="납품/매출"
        description="납품 상태를 한 번에 관리해요."
        status={vm.status}
        headerChildren={<ShipmentListHeader vm={vm} />}
        empty={<ShipmentListEmptyCard vm={vm} />}
        loading={<SkeletonCardList count={6} variant="simple" />}
        primaryAction={{
          label: "납품 등록",
          icon: <Plus size={16} />,
          onClick: vm.primaryAction.onClick,
        }}
        fab={{
          label: "납품 등록",
          icon: <Plus size={24} />,
          onClick: vm.fab.onClick,
        }}
      >
        <ShipmentListContent vm={vm} />
      </PageScaffold>
    </>
  );
}