import { Plus, TrendingUp } from "lucide-react";
import EmptyState from "@/components/focuswin/common/empty-state";
import { useShipmentListVM } from "@/hooks/focuswin/shipment/useShipmentListVM";

type Props = { vm: ReturnType<typeof useShipmentListVM> };

export default function ShipmentListEmptyCard({ vm }: Props) {
  return (
    <EmptyState
      icon={<TrendingUp size={26} className="text-blue-600" />}
      title="납품 건이 없습니다"
      description='"납품 등록"으로 첫 매출을 추가해보세요.'
      actions={[{ label: "납품 등록하기", onClick: vm.primaryAction.onClick, icon: <Plus size={16} />, variant: "primary" }]}
      className="py-14"
    />
  );
}
