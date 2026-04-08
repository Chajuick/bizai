// src/pages/focuswin/ScheduleList.tsx

import { Plus } from "lucide-react";
import { useLocation } from "wouter";

import { useScheduleListVM } from "@/hooks/focuswin/schedule/useScheduleListVM";

import SkeletonCardList from "@/components/focuswin/common/skeletons/skeleton-card-list";
import PageScaffold from "@/components/focuswin/common/page/scaffold/page-scaffold";
import ListNotice from "@/components/focuswin/page/schedule/list/ListNotice";
import { ScheduleModals } from "@/components/focuswin/page/schedule/list/ScheduleModals";
import NotificationPermissionBanner, {
  NotificationDeniedHint,
} from "@/components/focuswin/common/feedback/NotificationPermissionBanner";

import ScheduleListHeadContent from "@/components/focuswin/page/schedule/list/Header";
import ScheduleListEmptyCard from "@/components/focuswin/page/schedule/list/Empty";
import ScheduleListContent from "@/components/focuswin/page/schedule/list/Content";
import CalendarView from "@/components/focuswin/page/schedule/calendar/CalendarView";

export default function ScheduleList() {
  const vm = useScheduleListVM();
  const [, navigate] = useLocation();

  const listNotice =
    vm.overdueInList > 0 || vm.imminentInList > 0 ? (
      <ListNotice tone={vm.overdueInList > 0 ? "danger" : "warning"}>
        {vm.overdueInList > 0 ? `지연 ${vm.overdueInList}건` : null}
        {vm.overdueInList > 0 && vm.imminentInList > 0 ? " · " : null}
        {vm.imminentInList > 0 ? `임박 ${vm.imminentInList}건` : null}이 있어요.
      </ListNotice>
    ) : null;

  const composedNotice = (
    <div className="space-y-2">
      <NotificationPermissionBanner />
      <NotificationDeniedHint />
      {listNotice}
    </div>
  );

  return (
    <>
      <ScheduleModals {...vm.modalProps} />

      <PageScaffold
        size="lg"
        kicker="SCHEDULE"
        title="일정"
        description="후속 미팅과 할 일을 상태별로 관리하세요."
        status={vm.view === "calendar" ? "ready" : vm.status}
        notice={composedNotice}
        headerChildren={<ScheduleListHeadContent vm={vm} />}
        empty={<ScheduleListEmptyCard vm={vm} />}
        loading={<SkeletonCardList count={4} variant="simple" />}
        primaryAction={{
          label: "일정 추가",
          icon: <Plus size={16} />,
          onClick: vm.openCreate,
        }}
        hidePrimaryActionOnMobile
        fab={{
          label: "일정 추가",
          icon: <Plus size={24} />,
          onClick: vm.openCreate,
        }}
      >
        {vm.view === "calendar" ? (
          <CalendarView
            year={vm.calendarYear}
            month={vm.calendarMonth}
            items={vm.calendarItems}
            isLoading={vm.isCalendarLoading}
            onPrev={vm.prevMonth}
            onNext={vm.nextMonth}
            onDateClick={vm.openCreateForDate}
            onItemClick={(item) => navigate(`/sche-list/${item.sche_idno}`)}
          />
        ) : (
          <ScheduleListContent vm={vm} />
        )}
      </PageScaffold>
    </>
  );
}