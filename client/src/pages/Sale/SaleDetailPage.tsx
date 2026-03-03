import { useParams } from "wouter";
import { useSaleDetailVM } from "@/hooks/focuswin/sale/useSaleDetailVM";

import PageScaffold from "@/components/focuswin/common/page-scaffold";
import SaleDetailContent from "@/components/focuswin/sale/detail/Content";
import { SaleDetailHeaderTitle } from "@/components/focuswin/sale/detail/HeaderTitle";

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();

  const saleId = Number(id);
  const vm = useSaleDetailVM(saleId);

  const Modals = vm.Modals;

  return (
    <>
      <Modals />

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