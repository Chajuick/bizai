// client/src/pages/expense/ExpenseListPage.tsx

import { Plus } from "lucide-react";
import { useExpenseListVM } from "@/hooks/focuswin/expense/useExpenseListVM";
import PageScaffold from "@/components/focuswin/common/page/scaffold/page-scaffold";
import SkeletonCardList from "@/components/focuswin/common/skeletons/skeleton-card-list";
import ExpenseListHeader from "@/components/focuswin/page/expense/list/Header";
import ExpenseListContent from "@/components/focuswin/page/expense/list/Content";
import ExpenseListEmpty from "@/components/focuswin/page/expense/list/Empty";

export default function ExpenseListPage() {
  const vm = useExpenseListVM();

  return (
    <PageScaffold
      size="lg"
      kicker="EXPENSE"
      title="지출"
      description="매입 비용과 운영 지출을 관리하세요."
      status={vm.status}
      headerChildren={<ExpenseListHeader vm={vm} />}
      empty={<ExpenseListEmpty onAdd={vm.openCreate} />}
      loading={<SkeletonCardList count={4} variant="simple" />}
      primaryAction={{
        label: "지출 추가",
        icon: <Plus size={16} />,
        href: "/expe-list/new",
      }}
      hidePrimaryActionOnMobile
      fab={{
        label: "지출 추가",
        icon: <Plus size={24} />,
        href: "/expe-list/new",
      }}
    >
      <ExpenseListContent vm={vm} />
    </PageScaffold>
  );
}
