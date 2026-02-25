// client/src/pages/Clients.tsx
"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { useClientsViewModel } from "@/hooks/focuswin/clients/useClientsViewModel";
import ClientsHeader from "@/components/focuswin/clients/clients-header";
import ClientsList from "@/components/focuswin/clients/clients-list";
import ClientFormDialog from "@/components/focuswin/clients/client-form-dialog";
import PageShell from "@/components/focuswin/common/page-shell";
import Fab from "@/components/focuswin/fab";

export default function Clients() {
  const vm = useClientsViewModel();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vm.form.name.trim()) {
      toast.error("고객사명을 입력해주세요.");
      return;
    }

    try {
      await vm.createMutation.mutateAsync({
        name: vm.form.name.trim(),
        industry: vm.form.industry.trim() || undefined,
        contactPerson: vm.form.contactPerson.trim() || undefined,
        contactPhone: vm.form.contactPhone.trim() || undefined,
        contactEmail: vm.form.contactEmail.trim() || undefined,
        address: vm.form.address.trim() || undefined,
        notes: vm.form.notes.trim() || undefined,
      });

      vm.invalidate();
      toast.success("고객사가 등록되었습니다.");
      vm.closeCreate();
    } catch {
      toast.error("등록에 실패했습니다.");
    }
  };

  return (
    <PageShell>
      <ClientsHeader search={vm.search} setSearch={vm.setSearch} filteredCount={vm.filteredCount} onCreate={vm.openCreate} />

      {vm.isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-3xl border border-slate-100 bg-white p-4 animate-pulse" style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100" />
                <div className="flex-1">
                  <div className="h-3 w-40 bg-slate-100 rounded mb-2" />
                  <div className="h-3 w-2/3 bg-slate-100 rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ClientsList clients={vm.clients ?? []} onCreate={vm.openCreate} />
      )}

      {/* FAB */}
      <Fab onClick={vm.openCreate} label="고객사 추가">
        <Plus size={24} />
      </Fab>

      <ClientFormDialog
        open={vm.showForm}
        onOpenChange={o => {
          vm.setShowForm(o);
          if (!o) vm.resetForm();
        }}
        form={vm.form}
        setForm={vm.setForm}
        onSubmit={handleCreate}
        isSubmitting={vm.createMutation.isPending}
      />
    </PageShell>
  );
}
