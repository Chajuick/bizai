// server/modules/crm/client/client.service.ts

// #region Imports
import { TRPCError } from "@trpc/server";

import type { ServiceCtx } from "../../../core/serviceCtx";
import { getDb } from "../../../core/db";

import { normalizePage } from "../shared/pagination";
import { withCreateAudit, withUpdateAudit } from "../shared/audit";

import type { AiContactItem, ClientContactCreatePayload, ClientContactUpdatePayload, ClientCreatePayload, ClientListInputType, ClientSort, ClientUpdatePayload, ClientUploadOutput } from "./client.dto";
import { ClientCreateWithContactsInput, ClientSaveWithContactsInput } from "./client.dto";
import { clientRepo } from "./client.repo";
import { tx } from "../../../core/db/tx";
import { z } from "zod";
// #endregion

// #region Helpers

/** mysql2 ER_DUP_ENTRY 여부 판별 (err 직접 또는 err.cause 래핑 모두 커버) */
function isDupKeyErr(err: unknown): boolean {
  const check = (e: unknown) =>
    (e as { errno?: number }).errno === 1062 ||
    (e as { code?: string }).code === "ER_DUP_ENTRY";
  return check(err) || check((err as { cause?: unknown }).cause);
}
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

    try {
      return await clientRepo.create({ db }, data);
    } catch (err) {
      if (isDupKeyErr(err)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "이미 동일한 이름의 거래처가 존재합니다.",
        });
      }
      throw err;
    }
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

  // #region syncContact — AI 추출 연락처를 거래처에 반영 (빈 필드만, 단일)
  async syncContact(
    ctx: ServiceCtx,
    input: { clie_idno: number; cont_name?: string; cont_tele?: string; cont_mail?: string }
  ) {
    const db = getDb();
    await clientRepo.syncContact({ db }, {
      comp_idno: ctx.comp_idno,
      clie_idno: input.clie_idno,
      cont_name: input.cont_name ?? null,
      cont_tele: input.cont_tele ?? null,
      cont_mail: input.cont_mail ?? null,
      crea_idno: ctx.user_idno,
    });
    return { success: true as const };
  },
  // #endregion

  // #region syncContacts — AI 추출 복수 담당자를 거래처에 upsert (이름 기준 중복 방지)
  async syncContacts(ctx: ServiceCtx, input: { clie_idno: number; contacts: AiContactItem[] }) {
    const db = getDb();

    const existing = await clientRepo.listContacts({ db }, { comp_idno: ctx.comp_idno, clie_idno: input.clie_idno });
    const hasMain = existing.some((c) => c.main_yesn);
    let needsMain = !hasMain; // 기존 대표 담당자가 없으면 첫 번째가 대표로

    for (const contact of input.contacts) {
      const normName = contact.cont_name.trim();
      if (!normName) continue;

      // 이름 기준 중복 탐지 (대소문자·공백 무시)
      const found = existing.find(
        (e) => e.cont_name.trim().toLowerCase() === normName.toLowerCase()
      );

      if (found) {
        // 빈 필드만 보완
        const updates: Record<string, unknown> = { modi_idno: ctx.user_idno, modi_date: new Date() };
        if (!found.cont_role && contact.cont_role) updates.cont_role = contact.cont_role;
        if (!found.cont_tele && contact.cont_tele) updates.cont_tele = contact.cont_tele;
        if (!found.cont_mail && contact.cont_mail) updates.cont_mail = contact.cont_mail;

        if (Object.keys(updates).length > 2) {
          await clientRepo.updateContact({ db }, { comp_idno: ctx.comp_idno, cont_idno: found.cont_idno, data: updates });
        }
      } else {
        // 신규 담당자 insert
        const isMain = needsMain;
        if (isMain) needsMain = false;

        await clientRepo.createContact({ db }, {
          comp_idno: ctx.comp_idno,
          clie_idno: input.clie_idno,
          cont_name: normName,
          cont_role: contact.cont_role ?? null,
          cont_tele: contact.cont_tele ?? null,
          cont_mail: contact.cont_mail ?? null,
          cont_memo: null,
          main_yesn: isMain,
          enab_yesn: true,
          crea_idno: ctx.user_idno,
          crea_date: new Date(),
          modi_idno: ctx.user_idno,
          modi_date: new Date(),
        });

        // 대표 담당자로 설정된 경우 CRM_CLIENT 캐시 갱신
        if (isMain) {
          await clientRepo.update({ db }, {
            comp_idno: ctx.comp_idno,
            clie_idno: input.clie_idno,
            data: {
              cont_name: normName,
              cont_tele: contact.cont_tele ?? null,
              cont_mail: contact.cont_mail ?? null,
            },
          });
        }
      }
    }

    return { success: true as const };
  },
  // #endregion

  // #region listContacts
  async listContacts(ctx: ServiceCtx, clie_idno: number) {
    const db = getDb();
    return clientRepo.listContacts({ db }, { comp_idno: ctx.comp_idno, clie_idno });
  },
  // #endregion

  // #region createContact
  async createContact(ctx: ServiceCtx, input: ClientContactCreatePayload) {
    const db = getDb();

    // main_yesn=true로 등록 시 기존 대표 담당자 해제
    if (input.main_yesn) {
      await clientRepo.clearMainContact({ db }, { comp_idno: ctx.comp_idno, clie_idno: input.clie_idno });
    }

    const result = await clientRepo.createContact({ db }, {
      comp_idno: ctx.comp_idno,
      clie_idno: input.clie_idno,
      cont_name: input.cont_name,
      cont_role: input.cont_role ?? null,
      cont_tele: input.cont_tele ?? null,
      cont_mail: input.cont_mail || null,
      cont_memo: input.cont_memo ?? null,
      main_yesn: input.main_yesn ?? false,
      enab_yesn: true,
      crea_idno: ctx.user_idno,
      crea_date: new Date(),
      modi_idno: ctx.user_idno,
      modi_date: new Date(),
    });

    // 대표 담당자면 CRM_CLIENT 캐시도 갱신
    if (input.main_yesn) {
      await clientRepo.update({ db }, {
        comp_idno: ctx.comp_idno,
        clie_idno: input.clie_idno,
        data: {
          cont_name: input.cont_name,
          cont_tele: input.cont_tele ?? null,
          cont_mail: input.cont_mail || null,
        },
      });
    }

    return result;
  },
  // #endregion

  // #region updateContact
  async updateContact(ctx: ServiceCtx, input: ClientContactUpdatePayload) {
    const db = getDb();

    const existing = await clientRepo.getContactById({ db }, { comp_idno: ctx.comp_idno, cont_idno: input.cont_idno });
    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "담당자를 찾을 수 없습니다." });

    // main_yesn=true로 변경 시 기존 대표 담당자 해제
    if (input.main_yesn && !existing.main_yesn) {
      await clientRepo.clearMainContact({ db }, { comp_idno: ctx.comp_idno, clie_idno: existing.clie_idno });
    }

    const patch: Parameters<typeof clientRepo.updateContact>[1]["data"] = {
      modi_idno: ctx.user_idno,
      modi_date: new Date(),
    };
    if (input.cont_name !== undefined) patch.cont_name = input.cont_name;
    if (input.cont_role !== undefined) patch.cont_role = input.cont_role ?? null;
    if (input.cont_tele !== undefined) patch.cont_tele = input.cont_tele ?? null;
    if (input.cont_mail !== undefined) patch.cont_mail = input.cont_mail || null;
    if (input.cont_memo !== undefined) patch.cont_memo = input.cont_memo ?? null;
    if (input.main_yesn !== undefined) patch.main_yesn = input.main_yesn;

    await clientRepo.updateContact({ db }, { comp_idno: ctx.comp_idno, cont_idno: input.cont_idno, data: patch });

    // 대표 담당자로 지정/수정된 경우 CRM_CLIENT 캐시 갱신
    const isMain = input.main_yesn ?? existing.main_yesn;
    if (isMain) {
      await clientRepo.update({ db }, {
        comp_idno: ctx.comp_idno,
        clie_idno: existing.clie_idno,
        data: {
          cont_name: input.cont_name ?? existing.cont_name,
          cont_tele: input.cont_tele ?? existing.cont_tele ?? null,
          cont_mail: input.cont_mail || existing.cont_mail || null,
        },
      });
    }

    return { success: true as const };
  },
  // #endregion

  // #region deleteContact (soft)
  async deleteContact(ctx: ServiceCtx, cont_idno: number) {
    const db = getDb();
    await clientRepo.disableContact({ db }, { comp_idno: ctx.comp_idno, cont_idno, modi_idno: ctx.user_idno });
    return { success: true as const };
  },
  // #endregion

  // #region createWithContacts — 거래처 + 담당자 트랜잭션 생성
  async createWithContacts(
    ctx: ServiceCtx,
    payload: z.infer<typeof ClientCreateWithContactsInput>
  ): Promise<{ clie_idno: number }> {
    return tx(async (trx) => {
      const { clie_idno } = await clientRepo.create(
        { db: trx },
        withCreateAudit(ctx, {
          comp_idno: ctx.comp_idno,
          enab_yesn: true,
          ...payload.client,
        })
      );

      const contacts = payload.contacts ?? [];
      const hasMain = contacts.some((c) => c.main_yesn);
      const normalized = hasMain
        ? contacts
        : contacts.map((c, i) => ({ ...c, main_yesn: i === 0 }));

      for (const c of normalized) {
        await clientRepo.createContact(
          { db: trx },
          withCreateAudit(ctx, {
            comp_idno: ctx.comp_idno,
            clie_idno,
            cont_name: c.cont_name,
            cont_role: c.cont_role ?? null,
            cont_tele: c.cont_tele ?? null,
            cont_mail: c.cont_mail || null,
            cont_memo: c.cont_memo ?? null,
            main_yesn: c.main_yesn,
            enab_yesn: true,
          })
        );
      }

      return { clie_idno };
    });
  },
  // #endregion

  // #region saveWithContacts — 거래처 + 담당자 트랜잭션 저장 (diff 기반)
  async saveWithContacts(
    ctx: ServiceCtx,
    payload: z.infer<typeof ClientSaveWithContactsInput>
  ): Promise<void> {
    try {
      const { client, contacts = [] } = payload;

      await tx(async (trx) => {
        const { clie_idno, ...patch } = client;

        await clientRepo.update(
          { db: trx },
          { comp_idno: ctx.comp_idno, clie_idno, data: withUpdateAudit(ctx, patch) }
        );

        const hasMainChange = contacts.some((c) => c.main_yesn && c._state !== "delete");
        if (hasMainChange) {
          await clientRepo.clearMainContact({ db: trx }, { comp_idno: ctx.comp_idno, clie_idno });
        }

        for (const c of contacts) {
          if (c._state === "new") {
            await clientRepo.createContact(
              { db: trx },
              withCreateAudit(ctx, {
                comp_idno: ctx.comp_idno,
                clie_idno,
                cont_name: c.cont_name,
                cont_role: c.cont_role ?? null,
                cont_tele: c.cont_tele ?? null,
                cont_mail: c.cont_mail || null,
                cont_memo: c.cont_memo ?? null,
                main_yesn: c.main_yesn ?? false,
                enab_yesn: true,
              })
            );
          } else if (c._state === "update" && c.cont_idno) {
            await clientRepo.updateContact(
              { db: trx },
              {
                comp_idno: ctx.comp_idno,
                cont_idno: c.cont_idno,
                data: withUpdateAudit(ctx, {
                  cont_name: c.cont_name,
                  cont_role: c.cont_role ?? null,
                  cont_tele: c.cont_tele ?? null,
                  cont_mail: c.cont_mail || null,
                  cont_memo: c.cont_memo ?? null,
                  main_yesn: c.main_yesn,
                }),
              }
            );
          } else if (c._state === "delete" && c.cont_idno) {
            await clientRepo.disableContact(
              { db: trx },
              { comp_idno: ctx.comp_idno, cont_idno: c.cont_idno, modi_idno: ctx.user_idno }
            );
          }
        }

        const aliveAfter = contacts.filter((c) => c._state !== "delete");
        if (aliveAfter.length > 0 && !aliveAfter.some((c) => c.main_yesn)) {
          const first = aliveAfter[0];
          if (first?.cont_idno) {
            await clientRepo.updateContact(
              { db: trx },
              {
                comp_idno: ctx.comp_idno,
                cont_idno: first.cont_idno,
                data: { main_yesn: true, modi_idno: ctx.user_idno },
              }
            );
          }
        }
      });
    } catch (err) {
      console.error("[crm.client.saveWithContacts] failed", {
        message: (err as any)?.message,
        code: (err as any)?.code,
        errno: (err as any)?.errno,
        sqlMessage: (err as any)?.sqlMessage ?? (err as any)?.cause?.sqlMessage,
        cause: (err as any)?.cause,
      });

      if (isDupKeyErr(err)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "이미 등록된 담당자 정보입니다.",
        });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "담당자 저장 중 오류가 발생했습니다.",
      });
    }
  },
  // #endregion

  // #region findOrCreateClient (normalize exact, idempotent)
  /**
   * 정규화 후 동일 이름이 있으면 기존 레코드 반환, 없으면 신규 생성.
   *
   * create(strict)와의 차이:
   * - createClient : 사용자 명시 생성 → 중복 시 CONFLICT(409) 전파
   * - findOrCreateClient : AI 전사·자동 해소용 → 중복 시 기존 레코드 반환 (idempotent)
   *
   * 레이스 컨디션(동시 insert) → ux_client_comp_name 위반 → dup key 내부 흡수 후 재조회
   */
  async findOrCreateClient(ctx: ServiceCtx, input: { clie_name: string }) {
    const db = getDb();

    const normTarget = normalizeCompanyName(input.clie_name);
    if (!normTarget) return null;

    // 1. 정규화 기준 기존 항목 검색
    const list = await clientRepo.listNames({ db }, { comp_idno: ctx.comp_idno });
    const existing = list.find((c) => normalizeCompanyName(c.clie_name) === normTarget);
    if (existing) {
      return clientRepo.getById({ db }, { comp_idno: ctx.comp_idno, clie_idno: existing.clie_idno });
    }

    // 2. 없으면 신규 insert (createClient 경유 X — dup key를 CONFLICT로 올리지 않음)
    const data = withCreateAudit(ctx, {
      comp_idno: ctx.comp_idno,
      enab_yesn: true,
      clie_name: input.clie_name,
    });

    try {
      const result = await clientRepo.create({ db }, data);
      return clientRepo.getById({ db }, { comp_idno: ctx.comp_idno, clie_idno: result.clie_idno });
    } catch (err) {
      // 레이스 컨디션: ux_client_comp_name 위반 → exact name으로 재조회해 idempotent 보장
      if (isDupKeyErr(err)) {
        return clientRepo.findByExactName({ db }, { comp_idno: ctx.comp_idno, name: input.clie_name });
      }
      throw err;
    }
  },
  // #endregion

  // #region uploadClients — 엑셀 기반 거래처 일괄 업로드 (사업자번호 upsert)
  async uploadClients(ctx: ServiceCtx, input: { fileBase64: string; fileName: string }): Promise<ClientUploadOutput> {
    // xlsx를 동적 import (서버 사이드 전용, 번들 분리)
    const XLSX = await import("xlsx");

    // base64 → Buffer → workbook
    const buffer = Buffer.from(input.fileBase64, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { inserted: 0, updated: 0, failed: 0, errors: [] };
    }
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      return { inserted: 0, updated: 0, failed: 0, errors: [] };
    }

    // JSON 변환 (헤더 행 포함)
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    if (rows.length === 0) {
      return { inserted: 0, updated: 0, failed: 0, errors: [] };
    }

    // 컬럼 헤더 정규화 매핑 (대소문자/공백 무시)
    const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase();

    function pickCol(row: Record<string, unknown>, candidates: string[]): string {
      for (const key of Object.keys(row)) {
        if (candidates.some((c) => normalize(c) === normalize(key))) {
          return String(row[key] ?? "").trim();
        }
      }
      return "";
    }

    // 사업자번호 정규화: 하이픈 제거 → 10자리 숫자 문자열 검증
    function normalizeBizrNumb(raw: string): string | null {
      const cleaned = raw.replace(/-/g, "").trim();
      if (/^\d{10}$/.test(cleaned)) return cleaned;
      return null;
    }

    const db = getDb();
    let inserted = 0;
    let updated = 0;
    const errors: ClientUploadOutput["errors"] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNo = i + 1; // 1-based, 헤더 제외
      const row = rows[i]!;

      const clie_name = pickCol(row, ["거래처명", "회사명", "업체명"]);
      const bizr_raw = pickCol(row, ["사업자번호", "사업자 번호", "bizr"]);
      const indu_type = pickCol(row, ["업종", "업태"]) || undefined;
      const clie_addr = pickCol(row, ["주소", "소재지"]) || undefined;
      const cont_name = pickCol(row, ["담당자명", "담당자"]) || undefined;
      const cont_tele = pickCol(row, ["연락처", "전화번호"]) || undefined;
      const cont_mail = pickCol(row, ["이메일"]) || undefined;

      // Validate
      if (!clie_name) {
        errors.push({ row: rowNo, reason: "거래처명이 비어있습니다." });
        continue;
      }
      if (!bizr_raw) {
        errors.push({ row: rowNo, reason: "사업자번호가 비어있습니다." });
        continue;
      }
      const bizn_numb = normalizeBizrNumb(bizr_raw);
      if (!bizn_numb) {
        errors.push({ row: rowNo, reason: "사업자번호가 10자리 숫자가 아닙니다." });
        continue;
      }

      // Upsert: 사업자번호 기준
      try {
        const existing = await clientRepo.findByBizrNumb({ db }, { comp_idno: ctx.comp_idno, bizn_numb });

        if (existing) {
          // UPDATE — CRM_CLIENT 캐시 갱신
          await clientRepo.update(
            { db },
            {
              comp_idno: ctx.comp_idno,
              clie_idno: existing.clie_idno,
              data: withUpdateAudit(ctx, {
                clie_name,
                indu_type: indu_type ?? null,
                clie_addr: clie_addr ?? null,
                cont_name: cont_name ?? null,
                cont_tele: cont_tele ?? null,
                cont_mail: cont_mail ?? null,
              }),
            }
          );

          // UPDATE — CRM_CLIENT_CONT: 대표 담당자 없을 때만 추가 (수동 입력 보호)
          if (cont_name) {
            const mainContact = await clientRepo.getMainContact(
              { db },
              { comp_idno: ctx.comp_idno, clie_idno: existing.clie_idno }
            );
            if (!mainContact) {
              await clientRepo.createContact(
                { db },
                withCreateAudit(ctx, {
                  comp_idno: ctx.comp_idno,
                  clie_idno: existing.clie_idno,
                  cont_name,
                  cont_tele: cont_tele ?? null,
                  cont_mail: cont_mail ?? null,
                  main_yesn: true,
                  enab_yesn: true,
                })
              );
            }
          }

          updated++;
        } else {
          // INSERT — CRM_CLIENT 생성
          const created = await clientRepo.create(
            { db },
            withCreateAudit(ctx, {
              comp_idno: ctx.comp_idno,
              clie_name,
              bizn_numb,
              indu_type: indu_type ?? null,
              clie_addr: clie_addr ?? null,
              cont_name: cont_name ?? null,
              cont_tele: cont_tele ?? null,
              cont_mail: cont_mail ?? null,
              enab_yesn: true,
            })
          );

          // INSERT — CRM_CLIENT_CONT: 담당자명 있으면 대표 담당자 생성
          if (cont_name) {
            await clientRepo.createContact(
              { db },
              withCreateAudit(ctx, {
                comp_idno: ctx.comp_idno,
                clie_idno: created.clie_idno,
                cont_name,
                cont_tele: cont_tele ?? null,
                cont_mail: cont_mail ?? null,
                main_yesn: true,
                enab_yesn: true,
              })
            );
          }

          inserted++;
        }
      } catch (_err) {
        // clie_name unique 충돌 등 예외
        errors.push({ row: rowNo, reason: "저장 중 오류가 발생했습니다." });
      }
    }

    return { inserted, updated, failed: errors.length, errors };
  },
  // #endregion
  
  // #region getClientPreview
  async getClientPreview(ctx: ServiceCtx, clie_idno: number) {
    const db = getDb();

    const client = await clientRepo.getById(
      { db },
      { comp_idno: ctx.comp_idno, clie_idno }
    );

    if (!client) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "거래처를 찾을 수 없습니다.",
      });
    }

    const [mainContact, recentSales, upcomingSchedules, openScheduleCount] =
      await Promise.all([
        clientRepo.getMainContact({ db }, { comp_idno: ctx.comp_idno, clie_idno }),
        clientRepo.listRecentSalesByClient({ db }, { comp_idno: ctx.comp_idno, clie_idno, limit: 3 }),
        clientRepo.listUpcomingSchedulesByClient({ db }, { comp_idno: ctx.comp_idno, clie_idno, limit: 3 }),
        clientRepo.countOpenSchedulesByClient({ db }, { comp_idno: ctx.comp_idno, clie_idno }),
      ]);

    const lastVistDate =
      recentSales.length > 0 ? recentSales[0]?.vist_date ?? null : null;

    return {
      clie_idno: Number(client.clie_idno),
      clie_name: client.clie_name,
      main_contact: mainContact
        ? {
          cont_name: mainContact.cont_name ?? null,
          cont_role: mainContact.cont_role ?? null,
          cont_tele: mainContact.cont_tele ?? null,
          cont_mail: mainContact.cont_mail ?? null,
        }
        : null,
      last_vist_date: lastVistDate,
      open_schedule_count: openScheduleCount,
      recent_sales: recentSales.map((s) => ({
        sale_idno: Number(s.sale_idno),
        vist_date: s.vist_date,
        orig_memo: s.orig_memo ?? null,
        aiex_summ: s.aiex_summ ?? null,
      })),
      upcoming_schedules: upcomingSchedules.map((s) => ({
        sche_idno: Number(s.sche_idno),
        sche_name: s.sche_name,
        sche_date: s.sche_date,
        sche_stat: s.sche_stat,
        actn_ownr: s.actn_ownr ?? null,
      })),
    };
  },
  // #endregion
} as const;
// #endregion