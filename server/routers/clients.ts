import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  findBestClientMatch,
  findOrCreateClient,
} from "../db";

export const clientsRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional(), limit: z.number().optional() }).optional())
    .query(({ ctx, input }) => getClients(ctx.user.id, input?.search, input?.limit)),

  findBestMatch: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .query(({ ctx, input }) => findBestClientMatch(ctx.user.id, input.name)),

  findOrCreate: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(({ ctx, input }) => findOrCreateClient(ctx.user.id, input.name)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => getClientById(input.id, ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        industry: z.string().optional(),
        contactPerson: z.string().optional(),
        contactPhone: z.string().optional(),
        contactEmail: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      createClient({ ...input, userId: ctx.user.id })
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        industry: z.string().optional(),
        contactPerson: z.string().optional(),
        contactPhone: z.string().optional(),
        contactEmail: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateClient(id, ctx.user.id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => deleteClient(input.id, ctx.user.id)),
});
