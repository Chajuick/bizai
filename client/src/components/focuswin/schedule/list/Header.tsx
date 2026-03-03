import TabPills from "@/components/focuswin/common/ui/tab-pills";
import { useScheduleListVM } from "@/hooks/focuswin/schedule/useScheduleListVM";

type Props = { vm: ReturnType<typeof useScheduleListVM> };

export default function ScheduleListHeader({ vm }: Props) {
  return <TabPills tabs={vm.statusTabs} value={vm.activeTab} onChange={vm.setActiveTab} />;
}
