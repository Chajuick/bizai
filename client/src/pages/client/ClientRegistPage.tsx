// src/pages/client/ClientRegistPage.tsx

import { useClientRegistVM } from "@/hooks/focuswin/client/useClientRegistVM";
import PageScaffold from "@/components/focuswin/common/page-scaffold";
import ClientRegistContent from "@/components/focuswin/client/regist/Content";

export default function ClientRegistPage() {
  const vm = useClientRegistVM();

  return (
    <PageScaffold
      kicker="CLIENTS"
      title="고객사 등록"
      description="고객사와 담당자 정보를 입력하세요."
      status={vm.status}
      onBack={vm.goList}
      primaryAction={vm.primaryAction}
      actions={vm.actions}
    >
      <ClientRegistContent vm={vm} />
    </PageScaffold>
  );
}
