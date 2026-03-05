import { Plus } from "lucide-react";

import { useClientListVM } from "@/hooks/focuswin/client/useClientListVM";
import PageScaffold from "@/components/focuswin/common/page/scaffold/page-scaffold";
import ClientListHeadContent from "@/components/focuswin/page/client/list/HeadContent";
import ClientListEmptyCard from "@/components/focuswin/page/client/list/EmptyCard";
import ClientListContent from "@/components/focuswin/page/client/list/Content";

export default function ClientListPage() {
  const vm = useClientListVM();

  return (
    <PageScaffold
      kicker="CLIENTS"
      title="고객사"
      description="고객사/담당자 정보를 빠르게 찾고 관리해요."
      primaryAction={{ label: "고객사 추가", icon: <Plus size={16} />, onClick: vm.goRegist }}
      status={vm.status}
      headerChildren={<ClientListHeadContent vm={vm} />}
      empty={<ClientListEmptyCard vm={vm} />}
      fab={{ label: "고객사 추가", onClick: vm.goRegist, icon: <Plus size={24} /> }}
    >
      <ClientListContent vm={vm} />
    </PageScaffold>
  );
}
