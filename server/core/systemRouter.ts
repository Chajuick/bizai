// server/core/systemRouter.ts

// #region Imports
import { z } from "zod";

import { notifyOwner as deliverNotifyOwner } from "./notification";
import { publicProcedure, router, systemAdminProcedure } from "./trpc";
// #endregion

// #region Router
export const systemRouter = router({
  // #region Healthcheck
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({ ok: true })),
  // #endregion

  // #region Notify Owner (system admin only)
  notifyOwner: systemAdminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await deliverNotifyOwner(input);
      return { success: delivered } as const;
    }),
  // #endregion
});
// #endregion