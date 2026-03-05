// src/pages/focuswin/client/ClientDetailPage.tsx

import PageScaffold from "@/components/focuswin/common/page/scaffold/page-scaffold";

import { useClientDetailVM } from "@/hooks/focuswin/client/useClientDetailVM";

import ClientDetailContent from "@/components/focuswin/page/client/detail/Content";
import { ClientDetailModals } from "@/components/focuswin/page/client/detail/ClientDetailModals";

export default function ClientDetailPage() {
  const vm = useClientDetailVM(); // 내부에서 params 사용 중이므로 그대로

  return (
    <>
      <ClientDetailModals {...vm.modalProps} />

      <PageScaffold
        kicker="CLIENT DETAIL"
        title={vm.title}
        description="고객사 정보와 담당자를 관리하세요."
        status={vm.status}
        onBack={vm.goList}
        primaryAction={vm.primaryAction}
        actions={vm.actions}
        invalidState={vm.invalidState}
      >
        <ClientDetailContent vm={vm} />
      </PageScaffold>
    </>
  );
}