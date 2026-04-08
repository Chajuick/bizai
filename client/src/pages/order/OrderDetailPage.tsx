// pages/order/OrderDetailPage.tsx

import { useParams } from "wouter";
import { useOrderDetailVM } from "@/hooks/focuswin/order/useOrderDetailVM";
import PageScaffold from "@/components/focuswin/common/page/scaffold/page-scaffold";
import OrderDetailContent from "@/components/focuswin/page/order/detail/Content";
import StatusBadge from "@/components/focuswin/common/badges/status-badge";
import ConfirmActionDialog from "@/components/focuswin/common/overlays/confirm-action-dialog";
import CreateShipmetModal from "@/components/focuswin/page/order/list/CreateShipmetModal";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vm = useOrderDetailVM(Number(id));
  const order = vm.order;

  return (
    <>
      {/* 납품 등록 모달 — 삭제/경고 외 유일한 다이얼로그 */}
      <CreateShipmetModal
        open={vm.showDeliveryForm}
        onOpenChange={vm.handleDeliveryOpenChange}
        selectedOrder={order ?? null}
        deliveryForm={vm.deliveryForm}
        setDeliveryForm={vm.setDeliveryForm}
        onSubmit={vm.handleCreateDelivery}
        isSubmitting={vm.isDeliverySubmitting}
      />

      {/* 삭제 확인 */}
      <ConfirmActionDialog
        confirm={vm.confirm}
        setConfirm={vm.setConfirm}
        onConfirm={vm.handleConfirm}
      />

      <PageScaffold
        kicker="ORDER DETAIL"
        title={
          <span className="flex items-center gap-2 flex-wrap">
            {order?.prod_serv ?? "수주 상세"}
            {order && !vm.isEditing && <StatusBadge status={order.orde_stat} />}
          </span>
        }
        description={order?.clie_name}
        status={vm.pageStatus}
        onBack={vm.isEditing ? vm.cancelEdit : vm.goList}
        invalidState={vm.isInvalid ? {
          title: "수주를 찾을 수 없어요",
          description: "삭제되었거나 존재하지 않는 수주입니다.",
          actions: [{ label: "목록으로", onClick: vm.goList }],
        } : null}
        actions={vm.headerActions}
        primaryAction={vm.primaryAction}
      >
        <OrderDetailContent vm={vm} />
      </PageScaffold>
    </>
  );
}
