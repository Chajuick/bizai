import { Plus } from "lucide-react";

import { useSaleListVM } from "@/hooks/focuswin/sale/useSaleListVM";

import PageScaffold from "@/components/focuswin/common/page-scaffold";
import SaleListHeader from "@/components/focuswin/sale/list/Header";
import SaleListContent from "@/components/focuswin/sale/list/Content";
import SaleListEmpty from "@/components/focuswin/sale/list/Empty";

export default function SaleListPage() {
  // #region ViewModel
  const vm = useSaleListVM();
  // #endregion

  return (
    <PageScaffold
      kicker="SALES LOGS"
      title="영업일지"
      description="기록을 모아두면, 찾고 정리하기가 쉬워져요."
      primaryAction={{
        label: "작성",
        href: "/sale-list/regi",
        icon: <Plus size={16} />,
      }}
      status={vm.status}
      headerChildren={<SaleListHeader vm={vm} />}
      empty={<SaleListEmpty vm={vm} />}
      fab={{
        label: "일지 작성",
        href: "/sale-list/regi",
        icon: <Plus size={24} />,
      }}
    >
      <SaleListContent vm={vm} />
    </PageScaffold>
  );
}

// #endregion