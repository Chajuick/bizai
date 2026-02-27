import { Plus } from "lucide-react";

import { useOrdersViewModel } from "@/hooks/focuswin/order/useOrdersViewModel";
import PageScaffold from "@/components/focuswin/common/page-scaffold";
import OrderListHeadContent from "@/components/focuswin/order/list/HeadContent";
import OrderListEmptyCard from "@/components/focuswin/order/list/EmptyCard";
import OrderListContent from "@/components/focuswin/order/list/Content";
import OrderFormDialog from "@/components/focuswin/order/list/order-form-dialog";
import DeliveryFormDialog from "@/components/focuswin/order/list/delivery-form-dialog";
import DeleteOrderAlert from "@/components/focuswin/order/list/delete-order-alert";

export default function OrderList() {
  const vm = useOrdersViewModel();
  const status = vm.isLoading ? "loading" : (vm.orders?.length ?? 0) > 0 ? "ready" : "empty";

  return (
    <>
      <PageScaffold
        kicker="ORDERS"
        title="수주"
        description="파이프라인을 한눈에 보고, 상태를 빠르게 정리하세요."
        primaryAction={{ label: "수주 등록", icon: <Plus size={16} />, onClick: vm.openCreate }}
        status={status}
        headerChildren={<OrderListHeadContent vm={vm} />}
        empty={<OrderListEmptyCard vm={vm} />}
        fab={{ label: "수주 등록", onClick: vm.openCreate, icon: <Plus size={24} /> }}
      >
        <OrderListContent vm={vm} />
      </PageScaffold>

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
    </>
  );
}
