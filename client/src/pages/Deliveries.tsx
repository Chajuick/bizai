import { Plus, TrendingUp } from "lucide-react";

import { useDeliveriesViewModel } from "@/hooks/focuswin/deliveries/useDeliveriesViewModel";
import DeliveriesHeader from "@/components/focuswin/deliveries/deliveries-header";
import DeliveryCard from "@/components/focuswin/deliveries/delivery-card";
import DeliveryFormDialog from "@/components/focuswin/deliveries/delivery-form-dialog";
import DeleteDeliveryDialog from "@/components/focuswin/deliveries/delete-delivery-dialog";
import EmptyState from "@/components/focuswin/empty-state";
import SkeletonCardList from "@/components/focuswin/skeleton-card-list";
import PageShell from "@/components/focuswin/common/page-shell";
import Fab from "@/components/focuswin/fab";

export default function Deliveries() {
  const vm = useDeliveriesViewModel();

  return (
    <PageShell>
      <DeliveriesHeader
        activeTab={vm.activeTab}
        setActiveTab={vm.setActiveTab}
        onCreate={vm.openCreate}
        isLoading={vm.isLoading}
        hasData={vm.hasData}
        stats={vm.stats}
        formatKRW={vm.formatKRW}
      />

      <div className="mt-4">
        {vm.isLoading ? (
          <SkeletonCardList count={6} variant="detailed" />
        ) : !vm.hasData ? (
          <EmptyState
            icon={<TrendingUp size={26} className="text-blue-600" />}
            title="납품 건이 없습니다"
            description='"납품 등록"으로 첫 매출을 추가해보세요.'
            actions={[{ label: "납품 등록하기", onClick: vm.openCreate, icon: <Plus size={16} />, variant: "primary" }]}
            className="py-14"
          />
        ) : (
          <DeliveryCard
            deliveries={vm.deliveries!}
            formatKRW={vm.formatKRW}
            onEdit={vm.handleEdit}
            onAskDelete={d => vm.setConfirmDelete({ id: d.id, title: d.clientName })}
            onStatusUpdate={vm.handleStatusUpdate}
            statusUpdatePending={vm.updateMutation.isPending}
          />
        )}
      </div>

      <Fab onClick={vm.openCreate} label="납품 등록">
        <Plus size={24} />
      </Fab>

      <DeliveryFormDialog
        open={vm.showForm}
        onOpenChange={o => { vm.setShowForm(o); if (!o) vm.resetForm(); }}
        editing={!!vm.editingId}
        form={vm.form}
        setForm={vm.setForm}
        orders={vm.orders}
        onSubmit={vm.handleCreateOrUpdate}
        isSubmitting={vm.isSubmitting}
      />

      <DeleteDeliveryDialog
        confirm={vm.confirmDelete}
        setConfirm={vm.setConfirmDelete}
        onConfirm={vm.handleDelete}
      />
    </PageShell>
  );
}
