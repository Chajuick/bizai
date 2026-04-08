// src/pages/focuswin/OrderList.tsx

// #region Imports
import { Plus } from "lucide-react";

import { useOrderListVM } from "@/hooks/focuswin/order/useOrderListVM";

import PageScaffold from "@/components/focuswin/common/page/scaffold/page-scaffold";
import SkeletonCardList from "@/components/focuswin/common/skeletons/skeleton-card-list";

import OrderListHeader from "@/components/focuswin/page/order//list/Header";
import OrderListEmptyCard from "@/components/focuswin/page/order//list/EmptyCard";
import OrderListContent from "@/components/focuswin/page/order//list/Content";
import { OrderModals } from "@/components/focuswin/page/order//list/OrderModals";
import KanbanView from "@/components/focuswin/page/order/kanban/KanbanView";
// #endregion

export default function OrderListPage() {
  const vm = useOrderListVM();

  return (
    <>
      {/* 모달 조립: VM의 상태/핸들러만 받아 렌더 */}
      <OrderModals {...vm.modalProps} />

      <PageScaffold
        size="lg"
        kicker="ORDERS"
        title="수주"
        description="파이프라인을 한눈에 보고, 상태를 빠르게 정리하세요."
        status={vm.status}
        headerChildren={<OrderListHeader vm={vm} />}
        empty={<OrderListEmptyCard vm={vm} />}
        loading={<SkeletonCardList count={6} variant="simple" />}
        primaryAction={{
          label: "수주 등록",
          icon: <Plus size={16} />,
          onClick: vm.primaryAction.onClick,
        }}
        hidePrimaryActionOnMobile
        fab={{
          label: "수주 등록",
          icon: <Plus size={24} />,
          onClick: vm.fab.onClick,
        }}
      >
        {vm.view === "kanban" ? (
          <KanbanView
            groups={vm.kanbanGroups}
            onStatusChange={vm.handleStatusChange}
            onOpenDelivery={vm.openDeliveryForm}
            statusChanging={vm.statusChanging}
          />
        ) : (
          <OrderListContent vm={vm} />
        )}
      </PageScaffold>
    </>
  );
}