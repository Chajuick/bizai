// src/pages/sale/SaleRegistPage.tsx

import { useSaleRegistVM } from "@/hooks/focuswin/sale/useSaleRegistVM";

import PageScaffold from "@/components/focuswin/common/page-scaffold";
import SaleRegistContent from "@/components/focuswin/sale/regist/Content";
import SaleRegistAnalysisBanner from "@/components/focuswin/sale/regist/AnalysisBanner";
import { SaleRegistModals } from "@/components/focuswin/sale/regist/SaleRegistModals";

export default function SaleRegistPage() {
  const vm = useSaleRegistVM();

  // notice: VM은 banner 상태값만 제공, JSX 조립은 Page에서
  const notice = (
    <SaleRegistAnalysisBanner
      state={vm.bannerState}
      message={vm.bannerMessage}
      onDismiss={vm.canDismissBanner ? vm.dismissBanner : undefined}
    />
  );

  return (
    <>
      {/* 모달 조립: VM의 상태/핸들러를 받아 렌더 */}
      <SaleRegistModals {...vm.modalProps} />

      <PageScaffold
        kicker="NEW LOG"
        title="영업일지 작성"
        description="내용을 기록하면 AI가 일정/요약을 도와줘요"
        status={vm.status}
        notice={notice}
        onBack={vm.goList}
        primaryAction={vm.primaryAction}
        actions={vm.actions}
      >
        <SaleRegistContent vm={vm} />
      </PageScaffold>
    </>
  );
}
