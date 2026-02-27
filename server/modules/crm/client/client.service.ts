// server/modules/crm/client/client.service.ts

// #region Imports
import type { ServiceCtx } from "../../../core/serviceCtx";
import { getDb } from "../../../core/db";

import { normalizePage } from "../shared/pagination";
import { withCreateAudit, withUpdateAudit } from "../shared/audit";

import type { ClientCreatePayload, ClientListInputType, ClientSort, ClientUpdatePayload } from "./client.dto";
import { clientRepo } from "./client.repo";
// #endregion

// #region Matching Policy (legacy db.ts compatible)
/**
 * normalizeCompanyName
 * - 레거시(db.ts)의 규칙을 그대로 이식
 * - core로 빼지 말 것 (도메인 정책)
 */
function normalizeCompanyName(name: string): string {
  return name
    .replace(/\(\s*주\s*\)/g, "") // (주)나산 → 나산
    .replace(/㈜/g, "") // ㈜나산 → 나산
    .replace(/\s*주식회사\s*/g, "") // 주식회사 나산 → 나산
    .replace(/\(\s*유\s*\)/g, "")
    .replace(/\s*유한회사\s*/g, "")
    .replace(/^주(?=[가-힣]{2,})/g, "") // 주나산 → 나산 (비공식 (주) 표기)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function levenshteinSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;

  const m = a.length;
  const n = b.length;

  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return 1 - dp[m][n] / Math.max(m, n);
}
// #endregion

// #region Service
export const clientService = {
  // #region listClients
  async listClients(ctx: ServiceCtx, input?: ClientListInputType) {
    const db = getDb();

    // legacy limit -> page.limit로 흡수
    const fallbackLimit = input?.limit;
    const page = normalizePage(input?.page ?? { limit: fallbackLimit ?? 20, offset: 0 });

    const sort = input?.sort
      ? ({ field: input.sort.field, dir: input.sort.dir } satisfies ClientSort)
      : undefined;

    const rows = await clientRepo.list(
      { db },
      {
        comp_idno: ctx.comp_idno,
        search: input?.search,
        limit: page.limit,
        offset: page.offset,
        sort,
        onlyEnabled: true,
      }
    );

    const hasMore = rows.length > page.limit;

    return {
      items: hasMore ? rows.slice(0, page.limit) : rows,
      page: { ...page, hasMore },
    };
  },
  // #endregion

  // #region createClient
  async createClient(ctx: ServiceCtx, input: ClientCreatePayload) {
    const db = getDb();

    const data = withCreateAudit(ctx, {
      comp_idno: ctx.comp_idno,
      enab_yesn: true,
      ...input,
    });

    return clientRepo.create({ db }, data);
  },
  // #endregion

  // #region getClient
  async getClient(ctx: ServiceCtx, clie_idno: number) {
    const db = getDb();

    return clientRepo.getById({ db }, { comp_idno: ctx.comp_idno, clie_idno });
  },
  // #endregion

  // #region updateClient
  async updateClient(ctx: ServiceCtx, clie_idno: number, patch: ClientUpdatePayload) {
    const db = getDb();

    const data = withUpdateAudit(ctx, patch);

    await clientRepo.update(
      { db },
      { comp_idno: ctx.comp_idno, clie_idno, data }
    );

    return { success: true as const };
  },
  // #endregion

  // #region disableClient (soft)
  async disableClient(ctx: ServiceCtx, clie_idno: number) {
    const db = getDb();

    const data = withUpdateAudit(ctx, {});

    await clientRepo.disable(
      { db },
      { comp_idno: ctx.comp_idno, clie_idno, data }
    );

    return { success: true as const };
  },
  // #endregion

  // #region findBestClientMatch (fuzzy)
  async findBestClientMatch(ctx: ServiceCtx, input: { name: string; minConfidence?: number }) {
    const db = getDb();

    const minConfidence = input.minConfidence ?? 0.7;
    const normInput = normalizeCompanyName(input.name);
    if (!normInput) return null;

    const list = await clientRepo.listNames({ db }, { comp_idno: ctx.comp_idno });
    if (!list.length) return null;

    let best: { clie_idno: number; clie_name: string; confidence: number } | null = null;

    for (const c of list) {
      const normClient = normalizeCompanyName(c.clie_name);

      const sim = Math.max(
        levenshteinSimilarity(normInput, normClient),
        normInput.includes(normClient) || normClient.includes(normInput) ? 0.85 : 0
      );

      if (sim >= minConfidence && (!best || sim > best.confidence)) {
        best = { clie_idno: c.clie_idno, clie_name: c.clie_name, confidence: sim };
      }
    }

    return best;
  },
  // #endregion

  // #region findOrCreateClient (normalize exact)
  /**
   * 레거시 정책:
   * - 정규화 후 exact(동일)면 기존 반환
   * - 없으면 신규 생성
   *
   * 주의:
   * - DB에서는 normalized name을 저장하지 않으므로, 여기서 listNames를 가져와 비교한다.
   * - 규모가 커지면 별도 normalized 컬럼/인덱스 전략이 필요할 수 있음 (초기 단계에서는 OK)
   */
  async findOrCreateClient(ctx: ServiceCtx, input: { clie_name: string }) {
    const db = getDb();

    const normTarget = normalizeCompanyName(input.clie_name);
    if (!normTarget) return null;

    const list = await clientRepo.listNames({ db }, { comp_idno: ctx.comp_idno });

    const existing = list.find((c) => normalizeCompanyName(c.clie_name) === normTarget);
    if (existing) {
      return clientRepo.getById({ db }, { comp_idno: ctx.comp_idno, clie_idno: existing.clie_idno });
    }

    const created = await this.createClient(ctx, { clie_name: input.clie_name });
    return this.getClient(ctx, created.clie_idno);
  },
  // #endregion
} as const;
// #endregion