// src/pages/focuswin/ScheduleList.tsx

import { Plus } from "lucide-react";

import { useScheduleListVM } from "@/hooks/focuswin/schedule/useScheduleListVM";

import SkeletonCardList from "@/components/focuswin/common/skeleton-card-list";
import PageScaffold from "@/components/focuswin/common/page-scaffold";
import ListNotice from "@/components/focuswin/schedule/list/ListNotice";
import { ScheduleModals } from "@/components/focuswin/schedule/list/ScheduleModals";

import ScheduleListHeadContent from "@/components/focuswin/schedule/list/Header";
import ScheduleListEmptyCard from "@/components/focuswin/schedule/list/Empty";
import ScheduleListContent from "@/components/focuswin/schedule/list/Content";

export default function ScheduleList() {
  const vm = useScheduleListVM();

  // notice: VM은 숫자만 제공, JSX 조립은 Page에서
  const notice =
    vm.overdueInList > 0 || vm.imminentInList > 0 ? (
      <ListNotice tone={vm.overdueInList > 0 ? "warning" : "primary"}>
        {vm.overdueInList > 0 ? `지연 ${vm.overdueInList}건` : null}
        {vm.overdueInList > 0 && vm.imminentInList > 0 ? " · " : null}
        {vm.imminentInList > 0 ? `임박 ${vm.imminentInList}건` : null}이 있어요.
      </ListNotice>
    ) : undefined;

  return (
    <>
      {/* 모달 조립: VM의 상태/핸들러를 받아 렌더 */}
      <ScheduleModals {...vm.modalProps} />

      <PageScaffold
        kicker="SCHEDULE"
        title="일정"
        description="후속 미팅과 할 일을 상태별로 관리하세요."
        status={vm.status}
        notice={notice}
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
