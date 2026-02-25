// client/src/pages/Deliveries.tsx
"use client";

import { Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import DeliveriesHeader from "@/components/focuswin/deliveries/deliveries-header";
import DeliveryCard from "@/components/focuswin/deliveries/delivery-card";
import DeliveryFormDialog from "@/components/focuswin/deliveries/delivery-form-dialog";
import DeleteDeliveryDialog from "@/components/focuswin/deliveries/delete-delivery-dialog";
import { useDeliveriesViewModel } from "@/hooks/focuswin/deliveries/useDeliveriesViewModel";
import PageShell from "@/components/focuswin/common/page-shell";
import Fab from "@/components/focuswin/fab";

export default function Deliveries() {
  const vm = useDeliveriesViewModel();

  const hasData = (vm.deliveries?.length ?? 0) > 0;

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vm.form.clientName || !vm.form.revenueAmount) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }

    try {
      const payload = {
        orderId: Number(vm.form.orderId) || 0,
        clientName: vm.form.clientName,
        revenueAmount: Number(vm.form.revenueAmount),
        deliveryStatus: vm.form.deliveryStatus,
        deliveredAt: vm.form.deliveredAt || undefined,
        notes: vm.form.notes || undefined,
      };

      if (!vm.editingId) {
        await vm.createMutation.mutateAsync(payload);
        toast.success("납품 건이 등록되었습니다.");
      } else {
        await vm.updateMutation.mutateAsync({ id: vm.editingId, ...payload });
        toast.success("납품 건이 수정되었습니다.");
      }

      vm.invalidateAll();
      vm.setShowForm(false);
      vm.resetForm();
    } catch {
      toast.error(vm.editingId ? "수정에 실패했습니다." : "등록에 실패했습니다.");
    }
  };

  const handleEdit = (d: any) => {
    vm.setEditingId(d.id);
    vm.setForm({
      orderId: d.orderId ? String(d.orderId) : "",
      clientName: d.clientName || "",
      revenueAmount: String(d.revenueAmount ?? ""),
      deliveryStatus: d.deliveryStatus,
      deliveredAt: d.deliveredAt ? new Date(d.deliveredAt).toISOString().split("T")[0] : "",
      notes: d.notes || "",
    });
    vm.setShowForm(true);
  };

  const handleStatusUpdate = async (id: number, deliveryStatus: any) => {
    try {
      await vm.updateMutation.mutateAsync({ id, deliveryStatus });
      vm.invalidateAll();
      toast.success("상태가 변경되었습니다.");
    } catch {
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!vm.deleteMutation) {
      toast.error("삭제 API가 아직 연결되어 있지 않아요.");
      return;
    }
    try {
      await vm.deleteMutation.mutateAsync({ id });
      vm.invalidateAll();
      toast.success("삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  return (
    <PageShell>
      <DeliveriesHeader activeTab={vm.activeTab} setActiveTab={vm.setActiveTab} onCreate={vm.openCreate} isLoading={vm.isLoading} hasData={hasData} stats={vm.stats} formatKRW={vm.formatKRW} />

      {vm.isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-3xl border border-slate-100 bg-white p-4 animate-pulse" style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100" />
                <div className="flex-1">
                  <div className="h-3 w-40 bg-slate-100 rounded mb-2" />
                  <div className="h-3 w-full bg-slate-100 rounded mb-2" />
                  <div className="h-3 w-2/3 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !hasData ? (
        <div className="text-center py-14">
          <div className="mx-auto w-14 h-14 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <TrendingUp size={26} className="text-blue-600" />
          </div>
          <p className="mt-4 text-base font-black text-slate-900">납품 건이 없습니다</p>
          <p className="mt-1 text-sm text-slate-500">"납품 등록"으로 첫 매출을 추가해보세요.</p>
          <div className="mt-5 flex justify-center">
            <button onClick={vm.openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white" style={{ background: "rgb(37, 99, 235)" }}>
              <Plus size={16} />
              납품 등록하기
            </button>
          </div>
        </div>
      ) : (
        <DeliveryCard
          deliveries={vm.deliveries!}
          formatKRW={vm.formatKRW}
          onEdit={handleEdit}
          onAskDelete={d => vm.setConfirmDelete({ id: d.id, title: d.clientName })}
          onStatusUpdate={handleStatusUpdate}
          statusUpdatePending={vm.updateMutation.isPending}
        />
      )}

      <Fab onClick={vm.openCreate} label="납품 등록">
        <Plus size={24} />
      </Fab>

      <DeliveryFormDialog
        open={vm.showForm}
        onOpenChange={o => {
          vm.setShowForm(o);
          if (!o) vm.resetForm();
        }}
        editing={!!vm.editingId}
        form={vm.form}
        setForm={vm.setForm}
        orders={vm.orders}
        onSubmit={handleCreateOrUpdate}
        isSubmitting={vm.isSubmitting}
      />

      <DeleteDeliveryDialog confirm={vm.confirmDelete} setConfirm={vm.setConfirmDelete} onConfirm={handleDelete} />
    </PageShell>
  );
}
