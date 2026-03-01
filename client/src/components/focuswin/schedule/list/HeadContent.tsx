import TabPills from "@/components/focuswin/common/ui/tab-pills";
import { usePromisesPageViewModel } from "@/hooks/focuswin/schedule/useSchedulePageViewModel";

type Props = { vm: ReturnType<typeof usePromisesPageViewModel> };

export default function ScheduleListHeadContent({ vm }: Props) {
  return <TabPills tabs={vm.statusTabs} value={vm.activeTab} onChange={vm.setActiveTab} />;
}
