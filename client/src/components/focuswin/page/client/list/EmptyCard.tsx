import { Plus, Users } from "lucide-react";
import EmptyState from "@/components/focuswin/common/feedback/empty-state";
import { useClientListVM } from "@/hooks/focuswin/client/useClientListVM";

type Props = { vm: ReturnType<typeof useClientListVM> };

export default function ClientListEmptyCard({ vm }: Props) {
  return (
    <EmptyState
      icon={<Users size={26} className="text-blue-600" />}
      title={vm.emptyTitle}
      description={vm.emptyDesc}
      actions={[{ label: "거래처 등록하기", onClick: vm.goRegist, icon: <Plus size={16} />, variant: "primary" }]}
      className="py-16"
    />
  );
}
