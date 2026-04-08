// pages/schedule/ScheduleDetailPage.tsx

import { useParams } from "wouter";
import { useScheduleDetailVM } from "@/hooks/focuswin/schedule/useScheduleDetailVM";
import PageScaffold from "@/components/focuswin/common/page/scaffold/page-scaffold";
import ScheduleDetailContent from "@/components/focuswin/page/schedule/detail/Content";
import StatusBadge from "@/components/focuswin/common/badges/status-badge";
import ConfirmActionDialog from "@/components/focuswin/common/overlays/confirm-action-dialog";
import CreateOrderModal from "@/components/focuswin/page/schedule/list/CreateOrderModal";
import type { EnhancedSchedule } from "@/types/schedule";

type EffectiveStatus = "scheduled" | "completed" | "canceled" | "overdue" | "imminent";

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vm = useScheduleDetailVM(Number(id));
  const { schedule } = vm;

  const effectiveStat: EffectiveStatus | undefined = schedule
    ? schedule.overdue
      ? "overdue"
      : schedule.imminent
      ? "imminent"
      : schedule.sche_stat as EffectiveStatus
    : undefined;

  return (
    <>
      {/* 수주 생성 모달 */}
      <CreateOrderModal
        open={vm.showOrderForm}
        onOpenChange={vm.setShowOrderForm}
        selectedPromise={schedule as EnhancedSchedule | null}
        orderForm={vm.orderForm}
        setOrderForm={vm.setOrderForm}
        onSubmit={vm.handleCreateOrder}
        isSubmitting={vm.isOrderSubmitting}
      />

      {/* 삭제/완료 확인 다이얼로그 */}
      <ConfirmActionDialog
        confirm={vm.confirm}
        setConfirm={vm.setConfirm}
        onConfirm={vm.handleConfirm}
      />

      <PageScaffold
        kicker="SCHEDULE DETAIL"
        title={
          <span className="flex flex-col items-start gap-1">
            {schedule?.sche_name ?? "일정 상세"}
            {schedule && !vm.isEditing && effectiveStat && (
              <StatusBadge status={effectiveStat} />
            )}
          </span>
        }
        description={schedule?.clie_name}
        status={vm.pageStatus}
        onBack={vm.isEditing ? vm.cancelEdit : vm.goList}
        invalidState={vm.isInvalid ? {
          title: "일정을 찾을 수 없어요",
          description: "삭제되었거나 존재하지 않는 일정입니다.",
          actions: [{ label: "목록으로", onClick: vm.goList }],
        } : null}
        actions={vm.headerActions}
        primaryAction={vm.primaryAction}
      >
        <ScheduleDetailContent vm={vm} />
      </PageScaffold>
    </>
  );
}
