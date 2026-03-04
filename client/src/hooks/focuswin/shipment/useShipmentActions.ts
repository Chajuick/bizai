// #region Imports
import { trpc } from "@/lib/trpc";
// #endregion

export function useShipmentActions() {
  // #region Base
  const utils = trpc.useUtils();
  // #endregion

  // #region Mutations
  const create = trpc.crm.shipment.create.useMutation();
  const update = trpc.crm.shipment.update.useMutation();
  const remove = trpc.crm.shipment.delete?.useMutation?.();
  // #endregion

  // #region Helpers
  const refresh = async () => {
    await Promise.all([
      utils.crm.shipment.list.invalidate(),
      utils.crm.shipment.stats.invalidate(),
      utils.crm.dashboard.stats.invalidate(),
    ]);
  };
  // #endregion

  // #region Wrappers
  const createShipment = async (input: Parameters<typeof create.mutateAsync>[0]) => {
    const res = await create.mutateAsync(input);
    await refresh();
    return res;
  };

  const updateShipment = async (input: Parameters<typeof update.mutateAsync>[0]) => {
    const res = await update.mutateAsync(input);
    await refresh();
    return res;
  };

  const deleteShipment = async (input: Parameters<typeof remove.mutateAsync>[0]) => {
    if (!remove) throw new Error("delete API not available");
    const res = await remove.mutateAsync(input);
    await refresh();
    return res;
  };
  // #endregion

  return {
    create,
    update,
    remove,

    createShipment,
    updateShipment,
    deleteShipment,
    refresh,
  };
}