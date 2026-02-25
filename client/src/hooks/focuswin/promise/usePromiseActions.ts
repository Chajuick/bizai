// hooks/focuswin/promise/usePromiseActions.ts
import { trpc } from "@/lib/trpc";

export function usePromiseActions() {
  const utils = trpc.useUtils();

  const create = trpc.promises.create.useMutation();
  const update = trpc.promises.update.useMutation();
  const remove = trpc.promises.delete.useMutation();
  const complete = trpc.promises.complete.useMutation();
  const cancel = trpc.promises.cancel.useMutation();
  const createOrder = trpc.orders.create.useMutation();

  const refresh = async () => {
    await Promise.all([
      utils.promises.list.invalidate(),
      utils.dashboard.stats.invalidate(),
    ]);
  };

  // ✅ "mutation + refresh"를 한 번에 처리하는 래퍼
  const createPromise = async (input: Parameters<typeof create.mutateAsync>[0]) => {
    const res = await create.mutateAsync(input);
    await refresh();
    return res;
  };

  const updatePromise = async (input: Parameters<typeof update.mutateAsync>[0]) => {
    const res = await update.mutateAsync(input);
    await refresh();
    return res;
  };

  const deletePromise = async (input: Parameters<typeof remove.mutateAsync>[0]) => {
    const res = await remove.mutateAsync(input);
    await refresh();
    return res;
  };

  const completePromise = async (input: Parameters<typeof complete.mutateAsync>[0]) => {
    const res = await complete.mutateAsync(input);
    await refresh();
    return res;
  };

  const cancelPromise = async (input: Parameters<typeof cancel.mutateAsync>[0]) => {
    const res = await cancel.mutateAsync(input);
    await refresh();
    return res;
  };

  // ✅ 수주 생성 + (선택) 해당 일정 완료처리 + refresh 1번만
  const createOrderAndCompletePromise = async (args: {
    order: Parameters<typeof createOrder.mutateAsync>[0];
    promiseId?: number | null;
  }) => {
    const { order, promiseId } = args;

    const orderRes = await createOrder.mutateAsync(order);

    if (promiseId) {
      await complete.mutateAsync({ id: promiseId });
    }

    await refresh();
    return orderRes;
  };

  const isBusy =
    create.isPending ||
    update.isPending ||
    remove.isPending ||
    complete.isPending ||
    cancel.isPending ||
    createOrder.isPending;

  return {
    // raw mutations (pending 상태 등 UI에 필요하면 사용)
    create,
    update,
    remove,
    complete,
    cancel,
    createOrder,

    // ✅ page에서 쓰는 "실무식" 액션 함수들
    createPromise,
    updatePromise,
    deletePromise,
    completePromise,
    cancelPromise,
    createOrderAndCompletePromise,

    isBusy,
  };
}