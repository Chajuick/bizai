// server/modules/org/bootstrap/bootstrap.service.ts
// 최초 로그인/가입 시 개인 워크스페이스 + 구독 자동 생성 (멱등)

// #region Imports
import type { Plan } from "../../../../drizzle/schema";
import { getDb } from "../../../core/db";
import { tx } from "../../../core/db/tx";
import { logger } from "../../../core/logger";
import { bootstrapRepo } from "./bootstrap.repo";
// #endregion

// #region Plan seed definitions
type PlanSeed = {
  plan_code: Plan["plan_code"];
  plan_name: string;
  seat_limt: number;
  tokn_mont: number;
};

const PLAN_SEEDS: PlanSeed[] = [
  { plan_code: "free",       plan_name: "Free",       seat_limt: 1,      tokn_mont: 10_000 },
  { plan_code: "pro",        plan_name: "Pro",        seat_limt: 1,      tokn_mont: 200_000 },
  { plan_code: "team",       plan_name: "Team",       seat_limt: 5,      tokn_mont: 1_000_000 },
  { plan_code: "enterprise", plan_name: "Enterprise", seat_limt: 999_999, tokn_mont: 10_000_000 },
];
// #endregion

// #region Helpers
/** 10자리 숫자 bizn_numb 생성 (충돌 시 재시도) */
async function generateUniqueBiznNumb(db: ReturnType<typeof getDb>): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = String(Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000);
    const existing = await bootstrapRepo.findCompanyByBiznNumb({ db }, candidate);
    if (!existing) return candidate;
  }
  throw new Error("Failed to generate unique bizn_numb after 10 attempts");
}
// #endregion

// #region Service
export const bootstrapService = {
  /**
   * bootstrapForUser
   * - 이미 회사가 있으면 기본 comp_idno 반환 (owner 우선, 없으면 가장 오래된 active)
   * - 없으면 개인 워크스페이스 + 멤버십(owner) + free 구독 생성
   */
  async bootstrapForUser(args: {
    user_idno: number;
    user_name: string | null;
    mail_idno: string | null;
  }): Promise<{ comp_idno: number }> {
    const { user_idno, user_name, mail_idno } = args;
    const db = getDb();

    // 1) 기존 활성 멤버십 확인
    const memberships = await bootstrapRepo.findActiveMembership({ db }, user_idno);
    if (memberships.length > 0) {
      const owner = memberships.find((m) => m.role_code === "owner");
      const defaultMembership = owner ?? memberships[0];
      return { comp_idno: defaultMembership!.comp_idno };
    }

    // 2) 워크스페이스 + 멤버십 + 구독 트랜잭션 생성
    let comp_idno!: number;

    await tx(async (trx) => {
      // 2-1) CORE_COMPANY 생성
      const bizn_numb = await generateUniqueBiznNumb(db);
      const comp_name = `${user_name ?? mail_idno ?? "My"} Workspace`;

      comp_idno = await bootstrapRepo.insertCompany(
        { db: trx },
        { comp_name, bizn_numb, need_appr: 0, invt_link_ok: 1, invt_mail_ok: 0 },
      );

      // 2-2) CORE_COMPANY_USER (owner)
      await bootstrapRepo.insertCompanyUser(
        { db: trx },
        { comp_idno, user_idno, role_code: "owner", status_code: "active", crea_idno: user_idno },
      );

      // 2-3) BILLING_PLAN seed (멱등) — 트랜잭션 밖에서 해도 되지만 일관성 위해 포함
      let freePlanId: number | null = null;
      for (const seed of PLAN_SEEDS) {
        const existing = await bootstrapRepo.findPlanByCode({ db: trx }, seed.plan_code);
        if (existing) {
          if (seed.plan_code === "free") freePlanId = existing.plan_idno;
        } else {
          const id = await bootstrapRepo.insertPlan({ db: trx }, seed);
          if (seed.plan_code === "free") freePlanId = id;
        }
      }

      if (!freePlanId) throw new Error("Free plan seed failed");

      // 2-4) BILLING_SUBSCRIPTION (free, active)
      const existing_sub = await bootstrapRepo.findActiveSub({ db: trx }, comp_idno);
      if (!existing_sub) {
        const now = new Date();
        const ends = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await bootstrapRepo.insertSubscription(
          { db: trx },
          { comp_idno, plan_idno: freePlanId, subs_stat: "active", star_date: now, ends_date: ends, crea_idno: user_idno },
        );
      }
    });

    logger.info({ user_idno, comp_idno }, "bootstrap: workspace created");
    return { comp_idno };
  },
};
// #endregion
