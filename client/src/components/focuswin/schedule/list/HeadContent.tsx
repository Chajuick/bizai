import TabPills from "@/components/focuswin/common/ui/tab-pills";
import { usePromisesPageViewModel } from "@/hooks/focuswin/schedule/usePromisesPageViewModel";

type Props = { vm: ReturnType<typeof usePromisesPageViewModel> };

export default function ScheListHeadContent({ vm }: Props) {
  return <TabPills tabs={vm.statusTabs} value={vm.activeTab} onChange={vm.setActiveTab} />;
}
