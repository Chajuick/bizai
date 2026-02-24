import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getDeliveries,
  createDelivery,
  updateDelivery,
  deleteDelivery,
  getOrderById,
} from "../db";

export const deliveriesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        orderId: z.number().optional(),
        billingStatus: z.enum(["unbilled", "billed", "paid"]).optional(),
      }).optional()
    )
    .query(({ ctx, input }) =>
      getDeliveries(ctx.user.id, {
        orderId: input?.orderId,
        billingStatus: input?.billingStatus,
      })
    ),

  create: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        clientName: z.string().min(1),
        revenueAmount: z.number().positive(),
        deliveryStatus: z.enum(["pending", "delivered", "invoiced", "paid"]).default("pending"),
        deliveredAt: z.string().optional(),
        billingStatus: z.enum(["unbilled", "billed", "paid"]).default("unbilled"),
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      createDelivery({
        ...input,
        userId: ctx.user.id,
        revenueAmount: String(input.revenueAmount),
        deliveredAt: input.deliveredAt ? new Date(input.deliveredAt) : undefined,
      })
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        deliveryStatus: z.enum(["pending", "delivered", "invoiced", "paid"]).optional(),
        deliveredAt: z.string().optional(),
        revenueAmount: z.number().positive().optional(),
        billingStatus: z.enum(["unbilled", "billed", "paid"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, revenueAmount, deliveredAt, ...rest } = input;
      return updateDelivery(id, ctx.user.id, {
        ...rest,
        ...(revenueAmount !== undefined ? { revenueAmount: String(revenueAmount) } : {}),
        ...(deliveredAt ? { deliveredAt: new Date(deliveredAt) } : {}),
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => deleteDelivery(input.id, ctx.user.id)),
});
