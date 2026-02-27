// server/core/auth/user.repo.ts

// #region Imports
import { eq } from "drizzle-orm";

import type { InsertUser, User } from "../../../drizzle/schema";
import { CORE_USER } from "../../../drizzle/schema";

import { getDb } from "../db";
import { ENV } from "../env/env";
// #endregion

// #region Types
type OAuthInput = {
  open_idno: string;   // Google sub ID
  user_name: string | null;
  mail_idno: string | null;
  logi_mthd: string;   // "google"
};

type EmailInput = {
  open_idno: string;   // 이메일 주소를 open_idno로 사용
  user_name: string | null;
  mail_idno: string;
  passwd_hash: string;
  logi_mthd: "email";
};
// #endregion

// #region Helpers
function resolveAuth(open_idno: string, provided?: string | null): string {
  if (provided) return provided;
  if (ENV.ownerEmail && open_idno === ENV.ownerEmail) return "admin";
  return "user";
}
// #endregion

// #region Repo
export const userRepo = {
  /** 세션 검증용: PK로 조회 */
  async findById(userId: number): Promise<User | null> {
    const db = await getDb();
    const rows = await db
      .select()
      .from(CORE_USER)
      .where(eq(CORE_USER.user_idno, userId))
      .limit(1);
    return (rows[0] ?? null) as User | null;
  },

  /** open_idno(Google sub / 이메일)로 조회 */
  async findByOpenId(openId: string): Promise<User | null> {
    const db = await getDb();
    const rows = await db
      .select()
      .from(CORE_USER)
      .where(eq(CORE_USER.open_idno, openId))
      .limit(1);
    return (rows[0] ?? null) as User | null;
  },

  /** 이메일/비밀번호 로그인용: 이메일로 조회 */
  async findByEmail(email: string): Promise<User | null> {
    const db = await getDb();
    const rows = await db
      .select()
      .from(CORE_USER)
      .where(eq(CORE_USER.mail_idno, email))
      .limit(1);
    return (rows[0] ?? null) as User | null;
  },

  /** 마지막 로그인 시간 등 부분 업데이트 */
  async upsertById(userId: number, patch: Partial<InsertUser>): Promise<void> {
    const db = await getDb();
    await db
      .update(CORE_USER)
      .set({ ...patch })
      .where(eq(CORE_USER.user_idno, userId));
  },

  /** Google OAuth upsert */
  async upsertByOAuth(input: OAuthInput): Promise<void> {
    const db = await getDb();

    const user_auth = resolveAuth(input.mail_idno ?? input.open_idno);

    const values: InsertUser = {
      open_idno: input.open_idno,
      user_name: input.user_name,
      mail_idno: input.mail_idno,
      logi_mthd: input.logi_mthd,
      user_auth,
      last_sign: new Date(),
    };

    await db
      .insert(CORE_USER)
      .values(values)
      .onDuplicateKeyUpdate({
        set: {
          user_name: values.user_name ?? null,
          mail_idno: values.mail_idno ?? null,
          logi_mthd: values.logi_mthd ?? null,
          last_sign: values.last_sign ?? new Date(),
        },
      });
  },

  /** 이메일/비밀번호 가입 */
  async createByEmail(input: EmailInput): Promise<void> {
    const db = await getDb();

    const user_auth = resolveAuth(input.mail_idno);

    const values: InsertUser = {
      open_idno: input.open_idno,
      user_name: input.user_name,
      mail_idno: input.mail_idno,
      passwd_hash: input.passwd_hash,
      logi_mthd: input.logi_mthd,
      user_auth,
      last_sign: new Date(),
    };

    await db.insert(CORE_USER).values(values);
  },

  /** 레거시 호환: open_idno 기준 upsert (기존 코드와 호환 유지) */
  async upsert(input: InsertUser): Promise<void> {
    const db = await getDb();

    const user_auth =
      input.user_auth ??
      resolveAuth(input.mail_idno ?? input.open_idno, undefined);

    const values: InsertUser = {
      ...input,
      user_auth,
      last_sign: input.last_sign ?? new Date(),
    };

    await db
      .insert(CORE_USER)
      .values(values)
      .onDuplicateKeyUpdate({
        set: {
          user_name: values.user_name ?? null,
          mail_idno: values.mail_idno ?? null,
          logi_mthd: values.logi_mthd ?? null,
          user_auth: values.user_auth ?? undefined,
          last_sign: values.last_sign ?? new Date(),
        },
      });
  },
};
// #endregion
