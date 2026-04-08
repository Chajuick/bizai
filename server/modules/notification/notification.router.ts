// server/modules/notification/notification.router.ts

import { z } from "zod";
import { protectedProcedure, router } from "../../core/trpc";
import { getDb } from "../../core/db";
import { CORE_PUSH_SUBSCRIPTION } from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { VAPID_PUBLIC_KEY } from "../../core/push";

const SubscribeInput = z.object({
  endpoint: z.string().min(1),
  p256dh:   z.string().min(1),
  auth:     z.string().min(1),
});

export const notificationRouter = router({
  /** VAPID public key 반환 (클라이언트가 구독 생성 시 필요) */
  getVapidPublicKey: protectedProcedure.query(() => {
    return { publicKey: VAPID_PUBLIC_KEY() ?? null };
  }),

  /** 푸시 구독 등록 */
  subscribe: protectedProcedure
    .input(SubscribeInput)
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const comp_idno = ctx.comp_idno;
      const user_idno = ctx.user.user_idno;

      await db
        .insert(CORE_PUSH_SUBSCRIPTION)
        .values({
          comp_idno,
          user_idno,
          endpoint: input.endpoint,
          p256dh:   input.p256dh,
          auth_key: input.auth,
          crea_date: new Date(),
        })
        .onDuplicateKeyUpdate({
          set: {
            p256dh:   input.p256dh,
            auth_key: input.auth,
          },
        });

      return { ok: true };
    }),

  /** 푸시 구독 해제 */
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(CORE_PUSH_SUBSCRIPTION)
        .where(
          and(
            eq(CORE_PUSH_SUBSCRIPTION.user_idno, ctx.user.user_idno),
            eq(CORE_PUSH_SUBSCRIPTION.endpoint, input.endpoint)
          )
        );
      return { ok: true };
    }),

  /** 현재 사용자의 구독 여부 조회 */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select({ subs_idno: CORE_PUSH_SUBSCRIPTION.subs_idno })
      .from(CORE_PUSH_SUBSCRIPTION)
      .where(
        and(
          eq(CORE_PUSH_SUBSCRIPTION.comp_idno, ctx.comp_idno),
          eq(CORE_PUSH_SUBSCRIPTION.user_idno, ctx.user.user_idno)
        )
      )
      .limit(1);
    return { subscribed: rows.length > 0 };
  }),
});
