import { Plus } from "lucide-react";
import SkeletonCardList from "@/components/focuswin/common/skeleton-card-list";

import { usePromisesPageViewModel } from "@/hooks/focuswin/schedule/useSchedulePageViewModel";
import PageScaffold from "@/components/focuswin/common/page-scaffold";
import ScheduleListHeadContent from "@/components/focuswin/schedule/list/HeadContent";
import ScheduleListEmptyCard from "@/components/focuswin/schedule/list/EmptyCard";
import ScheduleListContent from "@/components/focuswin/schedule/list/Content";
import ListNotice from "@/components/focuswin/schedule/list/list-notice";
import PromiseFormDialog from "@/components/focuswin/schedule/list/promise-form-dialog";
import CreateOrderDialog from "@/components/focuswin/common/create-order-dialog";
import ConfirmActionDialog from "@/components/focuswin/common/confirm-action-dialog";

export default function ScheduleList() {
  const vm = usePromisesPageViewModel();
  const status = vm.isLoading ? "loading" : vm.hasData ? "ready" : "empty";

  const notice =
    vm.overdueInList > 0 || vm.imminentInList > 0 ? (
      <ListNotice tone={vm.overdueInList > 0 ? "warning" : "primary"}>
        {vm.overdueInList > 0 ? `지연 ${vm.overdueInList}건` : null}
        {vm.overdueInList > 0 && vm.imminentInList > 0 ? " · " : null}
        {vm.imminentInList > 0 ? `임박 ${vm.imminentInList}건` : null}이 있어요.
      </ListNotice>
    ) : undefined;

  return (
    <>
      <PageScaffold
        kicker="SCHEDULE"
        title="일정"
        description="후속 미팅과 할 일을 상태별로 관리하세요."
        primaryAction={{ label: "일정 추가", icon: <Plus size={16} />, onClick: vm.openCreate }}
        status={status}
        headerChildren={<ScheduleListHeadContent vm={vm} />}
        notice={notice}
        empty={<ScheduleListEmptyCard vm={vm} />}
        loading={<SkeletonCardList count={4} variant="simple" />}
        fab={{ label: "일정 추가", onClick: vm.openCreate, icon: <Plus size={24} /> }}
      >
        <ScheduleListContent vm={vm} />
      </PageScaffold>

      <PromiseFormDialog
        open={vm.showForm}
        onOpenChange={o => { vm.setShowForm(o); if (!o) vm.resetForm(); }}
        editing={!!vm.editingId}
        form={vm.form}
        setForm={vm.setForm}
        onSubmit={vm.editingId ? vm.handleUpdate : vm.handleCreate}
        isSubmitting={vm.isSubmitting}
      />

      <CreateOrderDialog
        open={vm.showOrderForm}
        onOpenChange={vm.setShowOrderForm}
        selectedPromise={vm.selectedPromise}
        orderForm={vm.orderForm}
        setOrderForm={vm.setOrderForm}
        onSubmit={vm.handleCreateOrder}
        isSubmitting={vm.createOrderPending}
      />

      <ConfirmActionDialog
        confirm={vm.confirm}
        setConfirm={vm.setConfirm}
        onConfirm={vm.handleConfirm}
      />
    </>
  );
}
