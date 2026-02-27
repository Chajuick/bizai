import { Plus } from "lucide-react";

import { useDeliveriesViewModel } from "@/hooks/focuswin/shipment/useDeliveriesViewModel";
import PageScaffold from "@/components/focuswin/common/page-scaffold";
import ShipListHeadContent from "@/components/focuswin/shipment/list/HeadContent";
import ShipListEmptyCard from "@/components/focuswin/shipment/list/EmptyCard";
import ShipListContent from "@/components/focuswin/shipment/list/Content";
import DeliveryFormDialog from "@/components/focuswin/shipment/list/delivery-form-dialog";
import DeleteDeliveryDialog from "@/components/focuswin/shipment/list/delete-delivery-dialog";

export default function ShipList() {
  const vm = useDeliveriesViewModel();
  const status = vm.isLoading ? "loading" : vm.hasData ? "ready" : "empty";

  return (
    <>
      <PageScaffold
        kicker="SHIPMENTS"
        title="납품/매출"
        description="납품 상태를 한 번에 관리해요."
        primaryAction={{ label: "납품 등록", icon: <Plus size={16} />, onClick: vm.openCreate }}
        status={status}
        headerChildren={<ShipListHeadContent vm={vm} />}
        empty={<ShipListEmptyCard vm={vm} />}
        fab={{ label: "납품 등록", onClick: vm.openCreate, icon: <Plus size={24} /> }}
      >
        <ShipListContent vm={vm} />
      </PageScaffold>

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
    </>
  );
}
