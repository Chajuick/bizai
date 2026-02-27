import { Plus } from "lucide-react";

import { useClientsViewModel } from "@/hooks/focuswin/client/useClientsViewModel";
import PageScaffold from "@/components/focuswin/common/page-scaffold";
import ClientListHeadContent from "@/components/focuswin/client/list/HeadContent";
import ClientListEmptyCard from "@/components/focuswin/client/list/EmptyCard";
import ClientListContent from "@/components/focuswin/client/list/Content";
import ClientFormDialog from "@/components/focuswin/client/list/client-form-dialog";

export default function ClientList() {
  const vm = useClientsViewModel();
  const status = vm.isLoading ? "loading" : vm.hasData ? "ready" : "empty";

  return (
    <>
      <PageScaffold
        kicker="CLIENTS"
        title="고객사"
        description="고객사/담당자 정보를 빠르게 찾아요."
        primaryAction={{ label: "고객사 추가", icon: <Plus size={16} />, onClick: vm.openCreate }}
        status={status}
        headerChildren={<ClientListHeadContent vm={vm} />}
        empty={<ClientListEmptyCard vm={vm} />}
        fab={{ label: "고객사 추가", onClick: vm.openCreate, icon: <Plus size={24} /> }}
      >
        <ClientListContent vm={vm} />
      </PageScaffold>

      <ClientFormDialog
        open={vm.showForm}
        onOpenChange={o => { vm.setShowForm(o); if (!o) vm.resetForm(); }}
        form={vm.form}
        setForm={vm.setForm}
        onSubmit={vm.handleCreate}
        isSubmitting={vm.createMutation.isPending}
      />
    </>
  );
}
