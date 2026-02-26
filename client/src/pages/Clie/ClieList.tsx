import { Plus, Users } from "lucide-react";

import { useClientsViewModel } from "@/hooks/focuswin/clie/useClientsViewModel";
import ClientsHeader from "@/components/focuswin/clie/list/clients-header";
import ClientsList from "@/components/focuswin/clie/list/clients-list";
import ClientFormDialog from "@/components/focuswin/clie/list/client-form-dialog";
import EmptyState from "@/components/focuswin/common/empty-state";
import SkeletonCardList from "@/components/focuswin/common/skeleton-card-list";
import PageShell from "@/components/focuswin/common/page-shell";
import Fab from "@/components/focuswin/common/fab";

export default function ClieList() {
  const vm = useClientsViewModel();

  return (
    <PageShell>
      <ClientsHeader
        search={vm.search}
        setSearch={vm.setSearch}
        onClear={() => vm.setSearch("")}
        filteredCount={vm.filteredCount}
        onCreate={vm.openCreate}
      />

      <div className="mt-4">
        {vm.isLoading ? (
          <SkeletonCardList count={6} variant="detailed" />
        ) : !vm.hasData ? (
          <EmptyState
            icon={<Users size={26} className="text-blue-600" />}
            title="고객사가 없습니다"
            description="첫 번째 고객사를 등록해보세요."
            actions={[{ label: "고객사 등록하기", onClick: vm.openCreate, icon: <Plus size={16} />, variant: "primary" }]}
            className="py-16"
          />
        ) : (
          <ClientsList clients={vm.clients ?? []} />
        )}
      </div>

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
        onSubmit={vm.handleCreate}
        isSubmitting={vm.createMutation.isPending}
      />
    </PageShell>
  );
}
