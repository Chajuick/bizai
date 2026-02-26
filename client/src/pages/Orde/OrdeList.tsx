import { Plus, ShoppingCart } from "lucide-react";

import { useOrdersViewModel } from "@/hooks/focuswin/orde/useOrdersViewModel";
import OrdersHeader from "@/components/focuswin/orde/list/orders-header";
import OrdersList from "@/components/focuswin/orde/list/orders-list";
import OrderFormDialog from "@/components/focuswin/orde/list/order-form-dialog";
import DeliveryFormDialog from "@/components/focuswin/orde/list/delivery-form-dialog";
import DeleteOrderAlert from "@/components/focuswin/orde/list/delete-order-alert";
import EmptyState from "@/components/focuswin/common/empty-state";
import SkeletonCardList from "@/components/focuswin/common/skeleton-card-list";
import PageShell from "@/components/focuswin/common/page-shell";
import Fab from "@/components/focuswin/common/fab";

export default function OrdeList() {
  const vm = useOrdersViewModel();

  const hasData = (vm.orders?.length ?? 0) > 0;

  return (
    <PageShell>
      <OrdersHeader
        activeTab={vm.activeTab}
        setActiveTab={vm.setActiveTab}
        stats={vm.stats}
        formatKRW={vm.formatKRW}
        statusTabs={vm.statusTabs}
        onCreate={vm.openCreate}
      />

      <div className="mt-4">
        {vm.isLoading ? (
          <SkeletonCardList count={5} variant="detailed" />
        ) : !hasData ? (
          <EmptyState
            icon={<ShoppingCart size={26} className="text-blue-600" />}
            title="수주가 없습니다"
            description='일정에서 수주를 생성하거나, "수주 등록"으로 직접 추가할 수 있어요.'
            actions={[{ label: "수주 등록하기", onClick: vm.openCreate, icon: <Plus size={16} />, variant: "primary" }]}
            className="py-16"
          />
        ) : (
          <OrdersList
            orders={vm.orders!}
            formatKRW={vm.formatKRW}
            onEdit={vm.handleEdit}
            onDeleteRequest={vm.requestDelete}
            onStatusChange={vm.handleStatusChange}
            statusChanging={vm.updateMutation.isPending}
            onOpenDelivery={vm.openDeliveryForm}
          />
        )}
      </div>

      <Fab onClick={vm.openCreate} label="수주 등록">
        <Plus size={24} />
      </Fab>

      <OrderFormDialog
        open={vm.showForm}
        onOpenChange={o => { vm.setShowForm(o); if (!o) vm.resetForm(); }}
        editing={!!vm.editingId}
        form={vm.form}
        setForm={vm.setForm}
        onSubmit={vm.editingId ? vm.handleUpdate : vm.handleCreate}
        isSubmitting={vm.createMutation.isPending || vm.updateMutation.isPending}
      />

      <DeliveryFormDialog
        open={vm.showDeliveryForm}
        onOpenChange={o => { vm.setShowDeliveryForm(o); if (!o) vm.resetDeliveryForm(); }}
        selectedOrder={vm.selectedOrder}
        deliveryForm={vm.deliveryForm}
        setDeliveryForm={vm.setDeliveryForm}
        onSubmit={vm.handleCreateDelivery}
        isSubmitting={vm.createDeliveryMutation.isPending}
      />

      <DeleteOrderAlert
        confirm={vm.confirm}
        setConfirm={vm.setConfirm}
        onConfirm={async () => {
          if (!vm.confirm) return;
          await vm.handleDelete(vm.confirm.id);
          vm.setConfirm(null);
        }}
      />
    </PageShell>
  );
}
