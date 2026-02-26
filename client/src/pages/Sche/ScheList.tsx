import { Plus, Calendar } from "lucide-react";

import { usePromisesPageViewModel } from "@/hooks/focuswin/sche/usePromisesPageViewModel";
import PageHeader from "@/components/focuswin/common/page-header";
import TabPills from "@/components/focuswin/common/ui/tab-pills";
import EmptyState from "@/components/focuswin/common/empty-state";
import SkeletonCardList from "@/components/focuswin/common/skeleton-card-list";
import ListNotice from "@/components/focuswin/sche/list/list-notice";
import PromiseFormDialog from "@/components/focuswin/sche/list/promise-form-dialog";
import CreateOrderDialog from "@/components/focuswin/common/create-order-dialog";
import ConfirmActionDialog from "@/components/focuswin/common/confirm-action-dialog";
import PromiseCard from "@/components/focuswin/sche/list/promise-card";
import PageShell from "@/components/focuswin/common/page-shell";
import Fab from "@/components/focuswin/common/fab";

export default function ScheList() {
  const vm = usePromisesPageViewModel();

  return (
    <PageShell>
      <PageHeader
        kicker="SCHEDULE"
        title="일정 관리"
        description="후속 미팅과 할 일을 상태별로 관리하세요."
        primaryAction={{ label: "일정 추가", onClick: vm.openCreate, icon: <Plus size={16} /> }}
      >
        <TabPills tabs={vm.statusTabs} value={vm.activeTab} onChange={vm.setActiveTab} />
      </PageHeader>

      <div className="mt-4">
        {(vm.overdueInList > 0 || vm.imminentInList > 0) && (
          <ListNotice tone={vm.overdueInList > 0 ? "warning" : "primary"} className="mb-2">
            {vm.overdueInList > 0 ? `지연 ${vm.overdueInList}건` : null}
            {vm.overdueInList > 0 && vm.imminentInList > 0 ? " · " : null}
            {vm.imminentInList > 0 ? `임박 ${vm.imminentInList}건` : null}이 있어요.
          </ListNotice>
        )}

        {vm.isLoading ? (
          <SkeletonCardList count={4} variant="simple" />
        ) : !vm.hasData ? (
          <EmptyState
            icon={<Calendar size={26} className="text-blue-600" />}
            title="일정이 없습니다"
            description="영업일지 AI 분석 시 자동으로 등록됩니다"
            actions={[{ label: "일정 추가", onClick: vm.openCreate, icon: <Plus size={16} />, variant: "primary" }]}
            className="py-16"
          />
        ) : (
          <div className="space-y-2">
            {vm.displayList.map(p => (
              <PromiseCard
                key={p.id}
                p={p}
                onCreateOrder={vm.openOrderForm}
                onComplete={vm.handleComplete}
                onEdit={vm.handleEdit}
                onCancelRequest={vm.requestCancel}
                onDeleteRequest={vm.requestDelete}
                completePending={vm.completePending}
              />
            ))}
          </div>
        )}
      </div>

      <Fab onClick={vm.openCreate} label="일정 추가">
        <Plus size={24} />
      </Fab>

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
    </PageShell>
  );
}
