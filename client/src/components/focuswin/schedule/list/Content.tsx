import PromiseCard from "./promise-card";
import { usePromisesPageViewModel } from "@/hooks/focuswin/schedule/useSchedulePageViewModel";

type Props = { vm: ReturnType<typeof usePromisesPageViewModel> };

export default function ScheduleListContent({ vm }: Props) {
  return (
    <div className="space-y-2">
      {vm.displayList.map(p => (
        <PromiseCard
          key={p.sche_idno}
          p={p}
          onCreateOrder={vm.openOrderForm}
          onComplete={vm.handleComplete}
          onEdit={vm.handleEdit}
          onCancelRequest={vm.requestCancel}
          onDeleteRequest={vm.requestDelete}
          completePending={vm.completePending}
        />
      ))}
    </div>
  );
}
