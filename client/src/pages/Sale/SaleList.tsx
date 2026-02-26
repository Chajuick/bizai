import { Plus } from "lucide-react";

import { useSaleListViewModel } from "@/hooks/focuswin/sale/useSaleListViewModel";
import PageScaffold from "@/components/focuswin/common/page-scaffold";
import SaleListHeadContent from "@/components/focuswin/sale/list/HeadContent";
import SaleListEmptyCard from "@/components/focuswin/sale/list/EmptyCard";
import SaleListContent from "@/components/focuswin/sale/list/Content";

export default function SaleList() {
  const vm = useSaleListViewModel();

  const status = vm.isLoading ? "loading" : vm.hasData ? "ready" : "empty";

  return (
    <PageScaffold
      kicker="SALES LOGS"
      title="영업일지"
      description="기록을 모아두면, 찾고 정리하기가 쉬워져요."
      primaryAction={{ label: "작성", href: "/sale-list/regi", icon: <Plus size={16} /> }}
      status={status}
      headerChildren={<SaleListHeadContent vm={vm} />}
      empty={<SaleListEmptyCard vm={vm} />}
      fab={{ label: "일지 작성", href: "/sale-list/regi", icon: <Plus size={24} /> }}
    >
      <SaleListContent vm={vm} />
    </PageScaffold>
  );
}
