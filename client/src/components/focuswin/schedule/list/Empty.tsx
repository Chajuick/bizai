import { Plus, Calendar } from "lucide-react";
import EmptyState from "@/components/focuswin/common/empty-state";
import { useScheduleListVM } from "@/hooks/focuswin/schedule/useScheduleListVM";

type Props = { vm: ReturnType<typeof useScheduleListVM> };

export default function ScheduleListEmpty({ vm }: Props) {
  return (
    <EmptyState
      icon={<Calendar size={26} className="text-blue-600" />}
      title="일정이 없습니다"
      description="영업일지 AI 분석 시 자동으로 등록됩니다"
      actions={[{ label: "일정 추가", onClick: vm.openCreate, icon: <Plus size={16} />, variant: "primary" }]}
      className="py-16"
    />
  );
}
