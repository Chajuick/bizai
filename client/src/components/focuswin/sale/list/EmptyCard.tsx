import { Plus, BookOpen } from "lucide-react";
import EmptyState from "@/components/focuswin/common/empty-state";
import { useSaleListViewModel } from "@/hooks/focuswin/sale/useSaleListViewModel";

type Props = {
  vm: ReturnType<typeof useSaleListViewModel>;
};

export default function SaleListEmptyCard({ vm }: Props) {
  const showReset = !!vm.search.trim() || vm.filter !== "all";

  const actions = [
    {
      label: "일지 작성하기",
      href: "/sale-list/regi",
      icon: <Plus size={16} />,
      variant: "primary" as const,
    },
    ...(showReset
      ? [
          {
            label: "초기화",
            onClick: vm.handleReset,
            variant: "secondary" as const,
          },
        ]
      : []),
  ];

  return (
    <EmptyState
      icon={<BookOpen size={26} className="text-blue-600" />}
      title={vm.emptyTitle}
      description={vm.emptyDesc}
      actions={actions}
      className="py-16"
    />
  );
}