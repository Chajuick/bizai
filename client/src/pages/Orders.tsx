"use client";

import { useOrdersViewModel } from "@/hooks/focuswin/orders/useOrdersViewModel";

import OrdersHeader from "@/components/focuswin/orders/orders-header";
import OrdersSkeleton from "@/components/focuswin/orders/orders-skeleton";
import OrdersEmpty from "@/components/focuswin/orders/orders-empty";
import OrdersList from "@/components/focuswin/orders/orders-list";

import OrderFormDialog from "@/components/focuswin/orders/order-form-dialog";
import DeliveryFormDialog from "@/components/focuswin/orders/delivery-form-dialog";
import DeleteOrderAlert from "@/components/focuswin/orders/delete-order-alert";
import PageShell from "@/components/focuswin/common/page-shell";
import Fab from "@/components/focuswin/fab";
import { Plus } from "lucide-react";

export default function Orders() {
  const vm = useOrdersViewModel();

  return (
    <PageShell>
      <OrdersHeader activeTab={vm.activeTab} setActiveTab={vm.setActiveTab} stats={vm.stats} formatKRW={vm.formatKRW} statusTabs={vm.statusTabs} onCreate={vm.openCreate} />

      {vm.isLoading ? (
        <OrdersSkeleton />
      ) : (vm.orders?.length ?? 0) === 0 ? (
        <OrdersEmpty onCreate={vm.openCreate} />
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

      {/* FAB */}
      <Fab onClick={vm.openCreate} label="수주 등록">
        <Plus size={24} />
      </Fab>

      {/* Create/Edit */}
      <OrderFormDialog
        open={vm.showForm}
        onOpenChange={o => {
          vm.setShowForm(o);
          if (!o) vm.resetForm();
        }}
        editing={!!vm.editingId}
        form={vm.form}
        setForm={vm.setForm}
        onSubmit={vm.editingId ? vm.handleUpdate : vm.handleCreate}
        isSubmitting={vm.createMutation.isPending || vm.updateMutation.isPending}
      />

      {/* Delivery */}
      <DeliveryFormDialog
        open={vm.showDeliveryForm}
        onOpenChange={o => {
          vm.setShowDeliveryForm(o);
          if (!o) vm.resetDeliveryForm();
        }}
        selectedOrder={vm.selectedOrder}
        deliveryForm={vm.deliveryForm}
        setDeliveryForm={vm.setDeliveryForm}
        onSubmit={vm.handleCreateDelivery}
        isSubmitting={vm.createDeliveryMutation.isPending}
      />

      {/* Delete confirm */}
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
