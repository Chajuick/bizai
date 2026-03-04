// src/hooks/focuswin/order/useOrderActions.ts

// #region Imports
import { trpc } from "@/lib/trpc";
// #endregion

export function useOrderActions() {
  // #region Base
  const utils = trpc.useUtils();
  // #endregion

  // #region Mutations
  const create = trpc.crm.order.create.useMutation();
  const update = trpc.crm.order.update.useMutation();
  const remove = trpc.crm.order.delete.useMutation();
  const createDelivery = trpc.crm.shipment.create.useMutation();
  // #endregion

  // #region Helpers
  const refresh = async () => {
    await Promise.all([
      utils.crm.order.list.invalidate(),
      utils.crm.order.stats.invalidate(),
      utils.crm.shipment.list.invalidate(),
      utils.crm.dashboard.stats.invalidate(),
    ]);
  };
  // #endregion

  // #region Wrappers
  const createOrder = async (input: Parameters<typeof create.mutateAsync>[0]) => {
    const res = await create.mutateAsync(input);
    await refresh();
    return res;
  };

  const updateOrder = async (input: Parameters<typeof update.mutateAsync>[0]) => {
    const res = await update.mutateAsync(input);
    await refresh();
    return res;
  };

  const deleteOrder = async (input: Parameters<typeof remove.mutateAsync>[0]) => {
    const res = await remove.mutateAsync(input);
    await refresh();
    return res;
  };

  const createShipment = async (input: Parameters<typeof createDelivery.mutateAsync>[0]) => {
    const res = await createDelivery.mutateAsync(input);
    await refresh();
    return res;
  };
  // #endregion

  return {
    // raw
    create,
    update,
    remove,
    createDelivery,

    // wrapped
    createOrder,
    updateOrder,
    deleteOrder,
    createShipment,
    refresh,
  };
}