// src/pages/sale/SaleRegistPage.tsx

import { useSaleRegistVM } from "@/hooks/focuswin/sale/useSaleRegistVM";

import PageScaffold from "@/components/focuswin/common/page-scaffold";
import SaleRegistContent from "@/components/focuswin/sale/regist/Content";

export default function SaleRegistPage() {
  const vm = useSaleRegistVM();
  const Modals = vm.Modals;

  return (
    <>
      <Modals />

      <PageScaffold
        kicker="NEW LOG"
        title="영업일지 작성"
        description="내용을 기록하면 AI가 일정/요약을 도와줘요"
        status={vm.status}
        notice={vm.notice}
        onBack={vm.goList}
        primaryAction={vm.primaryAction}
        actions={vm.actions}
      >
        <SaleRegistContent vm={vm} />
      </PageScaffold>
    </>
  );
}
