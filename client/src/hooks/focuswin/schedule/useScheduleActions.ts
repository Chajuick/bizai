// src/hooks/focuswin/schedule/useScheduleActions.ts

// #region Imports
import { trpc } from "@/lib/trpc";
// #endregion

export function useScheduleActions() {
  // #region Base
  const utils = trpc.useUtils();
  // #endregion

  // #region Mutations
  const create = trpc.crm.schedule.create.useMutation();
  const update = trpc.crm.schedule.update.useMutation();
  const remove = trpc.crm.schedule.delete.useMutation();
  const complete = trpc.crm.schedule.complete.useMutation();
  const cancel = trpc.crm.schedule.cancel.useMutation();
  const createOrder = trpc.crm.order.create.useMutation();
  // #endregion

  // #region Helpers
  const refresh = async () => {
    await Promise.all([utils.crm.schedule.list.invalidate(), utils.crm.dashboard.stats.invalidate()]);
  };
  // #endregion

  // #region Schedule wrappers
  const createSchedule = async (input: Parameters<typeof create.mutateAsync>[0]) => {
    const res = await create.mutateAsync(input);
    await refresh();
    return res;
  };

  const updateSchedule = async (input: Parameters<typeof update.mutateAsync>[0]) => {
    const res = await update.mutateAsync(input);
    await refresh();
    return res;
  };

  const deleteSchedule = async (input: Parameters<typeof remove.mutateAsync>[0]) => {
    const res = await remove.mutateAsync(input);
    await refresh();
    return res;
  };

  const completeSchedule = async (input: Parameters<typeof complete.mutateAsync>[0]) => {
    const res = await complete.mutateAsync(input);
    await refresh();
    return res;
  };

  const cancelSchedule = async (input: Parameters<typeof cancel.mutateAsync>[0]) => {
    const res = await cancel.mutateAsync(input);
    await refresh();
    return res;
  };
  // #endregion

  // #region Order + complete schedule
  const createOrderAndCompleteSchedule = async (args: {
    order: Parameters<typeof createOrder.mutateAsync>[0];
    scheduleId?: number | null;
  }) => {
    const { order, scheduleId } = args;

    const orderRes = await createOrder.mutateAsync(order);

    if (scheduleId) {
      await complete.mutateAsync({ sche_idno: scheduleId });
    }

    await refresh();
    return orderRes;
  };
  // #endregion

  return {
    // raw mutations (pending 상태 등 UI에 필요하면 사용)
    create,
    update,
    remove,
    complete,
    cancel,
    createOrder,

    // page에서 쓰는 액션 함수들
    createSchedule,
    updateSchedule,
    deleteSchedule,
    completeSchedule,
    cancelSchedule,
    createOrderAndCompleteSchedule,
  };
}