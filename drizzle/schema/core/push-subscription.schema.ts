import { int, varchar, timestamp, index, uniqueIndex } from "drizzle-orm/mysql-core";
import { table } from "../common/table";

export const CORE_PUSH_SUBSCRIPTION = table(
  "CORE_PUSH_SUBSCRIPTION",
  {
    subs_idno: int("subs_idno").autoincrement().primaryKey(),
    comp_idno: int("comp_idno").notNull(),
    user_idno: int("user_idno").notNull(),
    endpoint:  varchar("endpoint", { length: 2048 }).notNull(),
    p256dh:    varchar("p256dh",   { length: 512 }).notNull(),
    auth_key:  varchar("auth_key", { length: 256 }).notNull(),
    crea_date: timestamp("crea_date").defaultNow().notNull(),
  },
  (t) => [
    index("ix_push_sub_user").on(t.comp_idno, t.user_idno),
    uniqueIndex("ux_push_sub_endpoint").on(t.endpoint),
  ]
);

export type PushSubscription = typeof CORE_PUSH_SUBSCRIPTION.$inferSelect;
export type InsertPushSubscription = typeof CORE_PUSH_SUBSCRIPTION.$inferInsert;
