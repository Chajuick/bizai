// src/components/focuswin/order/list/EmptyCard.tsx

// #region Imports
import { Plus, ShoppingCart } from "lucide-react";
import EmptyState from "@/components/focuswin/common/empty-state";
import { useOrderListVM } from "@/hooks/focuswin/order/useOrderListVM";
// #endregion

type Props = { vm: ReturnType<typeof useOrderListVM> };

export default function OrderListEmptyCard({ vm }: Props) {
  return (
    <EmptyState
      icon={<ShoppingCart size={26} className="text-blue-600" />}
      title="수주가 없습니다"
      description='일정에서 수주를 생성하거나, "수주 등록"으로 직접 추가할 수 있어요.'
      actions={[
        {
          label: "수주 등록하기",
          onClick: vm.primaryAction.onClick,
          icon: <Plus size={16} />,
          variant: "primary",
        },
      ]}
      className="py-16"
    />
  );
}