// server/modules/crm/order/order.router.ts

// #region Imports
import { protectedProcedure, router } from "../../../core/trpc";
import { svcCtxFromTrpc } from "../../../core/svcCtx";

import {
  OrderCreateInput,
  OrderDeleteInput,
  OrderIdInput,
  OrderListInput,
  OrderListOutput,
  OrderUpdateInput,
} from "./order.dto";

import { orderService } from "./order.service";
// #endregion

// #region Router
export const orderRouter = router({
  // #region list
  list: protectedProcedure
    .input(OrderListInput)
    .output(OrderListOutput)
    .query(({ ctx, input }) => orderService.listOrders(svcCtxFromTrpc(ctx), input ?? undefined)),
  // #endregion

  // #region get
  get: protectedProcedure
    .input(OrderIdInput)
    .query(({ ctx, input }) => orderService.getOrder(svcCtxFromTrpc(ctx), input.orde_idno)),
  // #endregion

  // #region create
  create: protectedProcedure
    .input(OrderCreateInput)
    .mutation(({ ctx, input }) => orderService.createOrder(svcCtxFromTrpc(ctx), input)),
  // #endregion

  // #region update
  update: protectedProcedure
    .input(OrderUpdateInput)
    .mutation(({ ctx, input }) => {
      const { orde_idno, ...patch } = input;
      return orderService.updateOrder(svcCtxFromTrpc(ctx), orde_idno, patch);
    }),
  // #endregion

  // #region delete (soft-disable)
  delete: protectedProcedure
    .input(OrderDeleteInput)
    .mutation(({ ctx, input }) => orderService.disableOrder(svcCtxFromTrpc(ctx), input.orde_idno)),
  // #endregion
});
// #endregion