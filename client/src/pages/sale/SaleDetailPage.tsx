// src/pages/sale/SaleDetailPage.tsx

import { useParams } from "wouter";
import { useSaleDetailVM } from "@/hooks/focuswin/sale/useSaleDetailVM";

import PageScaffold from "@/components/focuswin/common/page/scaffold/page-scaffold";
import SaleDetailContent from "@/components/focuswin/page/sale/detail/Content";
import { SaleDetailHeaderTitle } from "@/components/focuswin/page/sale/detail/HeaderTitle";
import { SaleDetailModals } from "@/components/focuswin/page/sale/detail/SaleDetailModals";
import ProcessingOverlay from "@/components/focuswin/common/overlays/processing-overlay";

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();

  const saleId = Number(id);
  const vm = useSaleDetailVM(saleId);

  return (
    <>
      {/* 등록→상세 이동 시 AI 분석 완료까지 오버레이 */}
      <ProcessingOverlay visible={vm.showAnalysisOverlay} message="영업일지를 분석 중입니다..." />

      {/* 모달 조립: VM의 상태/핸들러를 받아 렌더 */}
      <SaleDetailModals {...vm.modalProps} />

      <PageScaffold
        kicker="LOG DETAIL"
        title={<SaleDetailHeaderTitle title={vm.title} isProcessed={!!vm.log?.sale.aiex_done} />}
        description={vm.visitedLabel}
        status={vm.status}
        onBack={vm.goList}
        primaryAction={vm.primaryAction}
        actions={vm.actions}
        invalidState={vm.invalidState}
      >
        <SaleDetailContent vm={vm} />
      </PageScaffold>
    </>
  );
}
