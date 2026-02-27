// server/modules/crm/shipment/shipment.router.ts

// #region Imports
import { protectedProcedure, router } from "../../../core/trpc";
import { svcCtxFromTrpc } from "../../../core/svcCtx";

import {
  ShipmentCreateInput,
  ShipmentDeleteInput,
  ShipmentIdInput,
  ShipmentListInput,
  ShipmentListOutput,
  ShipmentUpdateInput,
} from "./shipment.dto";

import { shipmentService } from "./shipment.service";
// #endregion

// #region Router
export const shipmentRouter = router({
  // #region list
  list: protectedProcedure
    .input(ShipmentListInput)
    .output(ShipmentListOutput)
    .query(({ ctx, input }) => shipmentService.listShipments(svcCtxFromTrpc(ctx), input ?? undefined)),
  // #endregion

  // #region get
  get: protectedProcedure
    .input(ShipmentIdInput)
    .query(({ ctx, input }) => shipmentService.getShipment(svcCtxFromTrpc(ctx), input.ship_idno)),
  // #endregion

  // #region create
  create: protectedProcedure
    .input(ShipmentCreateInput)
    .mutation(({ ctx, input }) => shipmentService.createShipment(svcCtxFromTrpc(ctx), input)),
  // #endregion

  // #region update
  update: protectedProcedure
    .input(ShipmentUpdateInput)
    .mutation(({ ctx, input }) => {
      const { ship_idno, ...patch } = input;
      return shipmentService.updateShipment(svcCtxFromTrpc(ctx), ship_idno, patch);
    }),
  // #endregion

  // #region delete
  delete: protectedProcedure
    .input(ShipmentDeleteInput)
    .mutation(({ ctx, input }) => shipmentService.disableShipment(svcCtxFromTrpc(ctx), input.ship_idno)),
  // #endregion
});
// #endregion