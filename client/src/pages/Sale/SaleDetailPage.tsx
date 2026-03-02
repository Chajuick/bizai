import { useParams } from "wouter";
import { useSaleDetailVM } from "@/hooks/focuswin/sale/useSaleDetailVM";

import PageScaffold from "@/components/focuswin/common/page-scaffold";
import SaleDetailContent from "@/components/focuswin/sale/detail/Content";
import { SaleDetailHeaderTitle } from "@/components/focuswin/sale/detail/HeaderTitle";


// #region Component

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  // #region ViewModel
  const vm = useSaleDetailVM(Number(id));
  // #endregion

  return (
    <>
      {/* VM이 제공하는 모달 */}
      <vm.Modals />

      <PageScaffold
        kicker="LOG DETAIL"
        title={
          <SaleDetailHeaderTitle
            title={vm.title}
            isProcessed={!vm.log?.sale.aiex_done}
          />
        }
        description={vm.visitedLabel}
        status={vm.status}
        onBack={vm.goList}
        primaryAction={vm.primaryAction}
        actions={vm.actions}
      >
        <SaleDetailContent vm={vm} />
      </PageScaffold>
    </>
  );
}

// #endregion