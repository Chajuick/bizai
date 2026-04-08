// components/focuswin/page/schedule/detail/Content.tsx

import type { useScheduleDetailVM } from "@/hooks/focuswin/schedule/useScheduleDetailVM";
import ScheduleDetailInfoCard from "./InfoCard";
import ScheduleDetailEditFormCard from "./EditFormCard";

type VM = ReturnType<typeof useScheduleDetailVM>;

export default function ScheduleDetailContent({ vm }: { vm: VM }) {
  if (!vm.schedule) return null;

  return (
    <div className="space-y-4">
      {vm.isEditing ? (
        <ScheduleDetailEditFormCard form={vm.form} setForm={vm.setForm} />
      ) : (
        <ScheduleDetailInfoCard vm={vm} />
      )}
    </div>
  );
}
