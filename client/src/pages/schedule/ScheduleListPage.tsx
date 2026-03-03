// src/pages/focuswin/ScheduleList.tsx

import { Plus } from "lucide-react";

import { useScheduleListVM } from "@/hooks/focuswin/schedule/useScheduleListVM";

import SkeletonCardList from "@/components/focuswin/common/skeleton-card-list";
import PageScaffold from "@/components/focuswin/common/page-scaffold";

import ScheduleListHeadContent from "@/components/focuswin/schedule/list/Header";
import ScheduleListEmptyCard from "@/components/focuswin/schedule/list/Empty";
import ScheduleListContent from "@/components/focuswin/schedule/list/Content";

export default function ScheduleList() {
  const vm = useScheduleListVM();
  const Modals = vm.modals;

  return (
    <>
      {vm.modals}

      <PageScaffold
        kicker="SCHEDULE"
        title="일정"
        description="후속 미팅과 할 일을 상태별로 관리하세요."
        status={vm.status}
        notice={vm.notice}
        headerChildren={<ScheduleListHeadContent vm={vm} />}
        empty={<ScheduleListEmptyCard vm={vm} />}
        loading={<SkeletonCardList count={4} variant="simple" />}
        primaryAction={{
          label: "일정 추가",
          icon: <Plus size={16} />,
          onClick: vm.openCreate,
        }}
        fab={{
          label: "일정 추가",
          icon: <Plus size={24} />,
          onClick: vm.openCreate,
        }}
      >
        <ScheduleListContent vm={vm} />
      </PageScaffold>
    </>
  );
}