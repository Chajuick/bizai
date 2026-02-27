import { Plus, Users } from "lucide-react";
import EmptyState from "@/components/focuswin/common/empty-state";
import { useClientsViewModel } from "@/hooks/focuswin/client/useClientsViewModel";

type Props = { vm: ReturnType<typeof useClientsViewModel> };

export default function ClientListEmptyCard({ vm }: Props) {
  return (
    <EmptyState
      icon={<Users size={26} className="text-blue-600" />}
      title="고객사가 없습니다"
      description={vm.search ? "검색 결과가 없어요." : "첫 번째 고객사를 등록해보세요."}
      actions={[{ label: "고객사 등록하기", onClick: vm.openCreate, icon: <Plus size={16} />, variant: "primary" }]}
      className="py-16"
    />
  );
}
