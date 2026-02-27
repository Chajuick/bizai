import { int, varchar, timestamp, uniqueIndex } from "drizzle-orm/mysql-core";
import { table } from "../common/table";
import { auditColsNoUser } from "../common/default";

export const CORE_USER = table(
  "CORE_USER",
  {
    user_idno: int("user_idno").autoincrement().primaryKey(),          // 사용자 PK

    open_idno: varchar("open_idno", { length: 191 }).notNull(),        // OIDC sub 등(유니크)
    user_name: varchar("user_name", { length: 200 }),                  // 표시 이름
    mail_idno: varchar("mail_idno", { length: 320 }),                  // 이메일(옵션)
    passwd_hash: varchar("passwd_hash", { length: 255 }),              // bcrypt 해시 (이메일 가입자만)
    logi_mthd: varchar("logi_mthd", { length: 64 }),                   // 로그인 방식(google/email 등)

    user_auth: varchar("user_auth", { length: 16 }).default("user").notNull(), // 시스템 권한
    last_sign: timestamp("last_sign").defaultNow().notNull(),          // 마지막 로그인

    ...auditColsNoUser(),                                              // crea_date / modi_date
  },
  (t) => [
    uniqueIndex("ux_core_user_open").on(t.open_idno),
    uniqueIndex("ux_core_user_mail").on(t.mail_idno), // 이메일 중복 계정 방지
  ]
);

export type User = typeof CORE_USER.$inferSelect;
export type InsertUser = typeof CORE_USER.$inferInsert;