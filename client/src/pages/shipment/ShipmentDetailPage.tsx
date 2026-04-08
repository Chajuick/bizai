// pages/shipment/ShipmentDetailPage.tsx

import { useParams } from "wouter";
import { useShipmentDetailVM } from "@/hooks/focuswin/shipment/useShipmentDetailVM";
import PageScaffold from "@/components/focuswin/common/page/scaffold/page-scaffold";
import ShipmentDetailContent from "@/components/focuswin/page/shipment/detail/Content";
import StatusBadge from "@/components/focuswin/common/badges/status-badge";
import ConfirmActionDialog from "@/components/focuswin/common/overlays/confirm-action-dialog";

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vm = useShipmentDetailVM(Number(id));
  const { shipment } = vm;

  return (
    <>
      <ConfirmActionDialog
        confirm={vm.confirm}
        setConfirm={vm.setConfirm}
        onConfirm={vm.handleConfirm}
      />

      <PageScaffold
        kicker="SHIPMENT DETAIL"
        title={
          <span className="flex items-center gap-2 flex-wrap">
            {shipment?.clie_name ?? "납품 상세"}
            {shipment && !vm.isEditing && <StatusBadge status={shipment.ship_stat} />}
          </span>
        }
        description={
          shipment?.ship_date
            ? new Date(shipment.ship_date).toLocaleDateString("ko-KR") + " · " + vm.formatKRW(Number(shipment.ship_pric))
            : shipment
            ? vm.formatKRW(Number(shipment.ship_pric))
            : undefined
        }
        status={vm.pageStatus}
        onBack={vm.isEditing ? vm.cancelEdit : vm.goList}
        invalidState={vm.isInvalid ? {
          title: "납품을 찾을 수 없어요",
          description: "삭제되었거나 존재하지 않는 납품입니다.",
          actions: [{ label: "목록으로", onClick: vm.goList }],
        } : null}
        actions={vm.headerActions}
        primaryAction={vm.primaryAction}
      >
        <ShipmentDetailContent vm={vm} />
      </PageScaffold>
    </>
  );
}
