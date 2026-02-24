import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../db";
import { notifyOwner } from "../_core/notification";

export const ordersRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["proposal", "negotiation", "confirmed", "canceled"]).optional(),
        clientId: z.number().optional(),
      }).optional()
    )
    .query(({ ctx, input }) =>
      getOrders(ctx.user.id, {
        status: input?.status,
        clientId: input?.clientId,
      })
    ),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => getOrderById(input.id, ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.number().optional(),
        salesLogId: z.number().optional(),
        clientName: z.string().min(1),
        productService: z.string().min(1),
        amount: z.number().positive(),
        status: z.enum(["proposal", "negotiation", "confirmed", "canceled"]).default("proposal"),
        contractDate: z.string().optional(),
        expectedDeliveryDate: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      createOrder({
        ...input,
        userId: ctx.user.id,
        amount: String(input.amount),
        contractDate: input.contractDate ? new Date(input.contractDate) : undefined,
        expectedDeliveryDate: input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : undefined,
      })
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        clientName: z.string().optional(),
        productService: z.string().optional(),
        amount: z.number().positive().optional(),
        status: z.enum(["proposal", "negotiation", "confirmed", "canceled"]).optional(),
        contractDate: z.string().optional(),
        expectedDeliveryDate: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, amount, contractDate, expectedDeliveryDate, status, ...rest } = input;

      const prevOrder = await getOrderById(id, ctx.user.id);

      await updateOrder(id, ctx.user.id, {
        ...rest,
        ...(amount !== undefined ? { amount: String(amount) } : {}),
        ...(contractDate ? { contractDate: new Date(contractDate) } : {}),
        ...(expectedDeliveryDate ? { expectedDeliveryDate: new Date(expectedDeliveryDate) } : {}),
        ...(status ? { status } : {}),
      });

      // 수주 확정 시 알림
      if (status === "confirmed" && prevOrder?.status !== "confirmed") {
        await notifyOwner({
          title: `수주 확정: ${prevOrder?.clientName}`,
          content: `${prevOrder?.productService} - ${Number(prevOrder?.amount).toLocaleString()}원 수주가 확정되었습니다.`,
        });
      }

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => deleteOrder(input.id, ctx.user.id)),
});
