// server/modules/crm/sale/sale.service.ts

// #region Imports

import type { ServiceCtx } from "../../../core/serviceCtx";
import { throwAppError } from "../../../core/trpc/appError";
import { getDb } from "../../../core/db";
import { logger } from "../../../core/logger";

import { withCreateAudit, withUpdateAudit } from "../shared/audit";
import { normalizePage } from "../shared/pagination";

import { saleRepo } from "./sale.repo";
import type { SaleCreatePayload, SaleUpdatePayload } from "./sale.dto";
import type { InsertSale } from "./sale.repo";

import { CRM_SALE_AUDIO_JOB } from "../../../../drizzle/schema";
import { fileLinkService } from "../file/fileLink.service";
import { storageGetBuffer } from "../../../storage";
import { transcribeBuffer } from "../../../core/ai/voiceTranscription";
import { invokeLLM } from "../../../core/llm";
import { aiService } from "../../ai/ai.service";
import { aiRepo } from "../../ai/ai.repo";
import { clientService } from "../client/client.service";
import { clientRepo } from "../client/client.repo";

import { makeAiApptKey, toAiCore } from "../../ai/ai.util";

// #endregion

// #region Helpers

// #region STT Cleaning

/**
 * STT 텍스트 정리
 * - speech filler 제거
 * - 공백 정리
 * - 문장 구조 정리
 */
function cleanTranscript(text: string): string {
  if (!text) return text;

  return text
    .replace(/\s+/g, " ")
    .replace(/\.{2,}/g, ".")
    .replace(/\s+\./g, ".")
    .trim();
}

// #endregion

// #region AI Confidence

/**
 * AI 결과 신뢰도 계산
 * 간단한 휴리스틱 기반 (0~1)
 */
type AiParsedResult = {
  client_name?: string | null;
  contacts?: { name?: string | null }[] | null;
  appointments?: { date?: string | null }[] | null;
  pricing?: unknown | null;
};

function computeAiConfidence(parsed: AiParsedResult, sourceText: string): number {
  let score = 0;

  const text = sourceText.toLowerCase();

  // 1️⃣ client_name이 실제 텍스트에 있는지
  if (parsed.client_name) {
    const name = parsed.client_name.toLowerCase();
    if (text.includes(name)) {
      score += 0.3;
    } else {
      score += 0.1; // hallucination 가능성
    }
  }

  // 2️⃣ contact 이름이 텍스트에 등장하는지
  if (parsed.contacts?.length) {
    const validContacts = parsed.contacts.filter((c) => {
      if (!c?.name) return false;
      return text.includes(c.name.toLowerCase());
    });

    if (validContacts.length > 0) {
      score += 0.2;
    }
  }

  // 3️⃣ appointment 날짜 유효성
  if (parsed.appointments?.length) {
    const validDates = parsed.appointments.filter((a) => {
      if (!a?.date) return false;
      const d = new Date(a.date);
      return !Number.isNaN(d.getTime());
    });

    if (validDates.length > 0) {
      score += 0.25;
    }
  }

  // 4️⃣ pricing 구조 존재
  if (parsed.pricing) {
    score += 0.25;
  }

  return Number(Math.min(score, 1).toFixed(2));
}

// #endregion

function sanitizeAiTitle(title: string): string {
  if (!title) return "후속 일정";

  let v = title.trim();

  // 자주 튀는 혼합 표기 보정
  v = v
    .replace(/比較표/g, "비교표")
    .replace(/比較/g, "비교")
    .replace(/見積서/g, "견적서")
    .replace(/提案서/g, "제안서")
    .replace(/發送/g, "발송")
    .replace(/確認/g, "확인");

  // 한자 제거
  v = v.replace(/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g, "");

  // 한글/영문/숫자/공백만 허용
  v = v.replace(/[^가-힣a-zA-Z0-9\s]/g, "");

  // 공백 정리
  v = v.replace(/\s+/g, " ").trim();

  if (!v) return "후속 일정";

  return v.slice(0, 30);
}

function inferBetterTitle(title: string, desc?: string | null): string {
  const raw = `${title ?? ""} ${desc ?? ""}`;
  const safe = sanitizeAiTitle(title);

  // 자료 발송류는 하나의 표현으로 통일
  if (/견적서|제안서|사양서|소개 자료|기능 소개|비교표|비교 자료|자료 발송|메일 발송/.test(raw)) {
    return "자료 발송";
  }

  // 결재/검토/회신 추적
  if (/결재|내부 결재|검토 결과|회신|피드백/.test(raw)) {
    return "결과 확인";
  }

  // 미팅/방문/회의
  if (/미팅|회의|방문|데모|발표|협의/.test(raw)) {
    return "후속 미팅";
  }

  return safe || "후속 일정";
}

type AiAppointment = {
  title?: string;
  date?: string | null;
  date_adjusted?: boolean;
  adjust_reason?: string;
  desc?: string;
  action_owner?: "self" | "client" | "shared";
};

function normalizeAiAppointments(appts?: AiAppointment[] | null): AiAppointment[] {
  if (!appts?.length) return [];

  const normalized = appts.map((appt) => {
    const title = inferBetterTitle(appt.title ?? "", appt.desc ?? null);
    const normalizedTitle =
      title === "자료 발송" ||
        /발송|전달|메일/.test(title)
        ? "자료 발송"
        : title;
    return {
      ...appt,
      title: normalizedTitle,
      desc: appt.desc?.trim() ?? "",
      action_owner: appt.action_owner ?? "self",
      date_adjusted: !!appt.date_adjusted,
      adjust_reason: appt.adjust_reason ?? "",
    };
  });

  // 같은 날짜 + 같은 action_owner + 같은 "자료 발송"류는 하나로 합치기
  const mergedMap = new Map<string, AiAppointment>();

  for (const appt of normalized) {
    const title = appt.title ?? "후속 일정";
    const date = appt.date ?? "null";
    const owner = appt.action_owner ?? "self";

    const isMaterialSend = title === "자료 발송";
    const descKey = (appt.desc ?? "").trim().slice(0, 20);
    const mergeKey = isMaterialSend
      ? `material|${date}|${owner}|${descKey}`
      : `${title}|${date}|${owner}`;

    const existing = mergedMap.get(mergeKey);

    if (!existing) {
      mergedMap.set(mergeKey, { ...appt });
      continue;
    }

    // desc 합치기
    const descParts = [existing.desc ?? "", appt.desc ?? ""]
      .map((v) => v.trim())
      .filter(Boolean);

    const uniqueDesc = Array.from(new Set(descParts));
    existing.desc = uniqueDesc.join(" / ");

    // 보정 여부는 하나라도 true면 true
    existing.date_adjusted = !!existing.date_adjusted || !!appt.date_adjusted;

    // adjust_reason도 합치기
    const reasonParts = [existing.adjust_reason ?? "", appt.adjust_reason ?? ""]
      .map((v) => v.trim())
      .filter(Boolean);

    existing.adjust_reason = Array.from(new Set(reasonParts)).join(" / ");
  }

  return Array.from(mergedMap.values());
}

function parseDateOrThrow(v: string | number, errMsg: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throwAppError({ tRPCCode: "BAD_REQUEST", appCode: "INVALID_DATE", message: errMsg, displayType: "toast" });
  return d;
}

function toIso(v: Date | string | number): string {
  const d = v instanceof Date ? v : new Date(v);
  return d.toISOString();
}

type InsertSaleAudioJob = typeof CRM_SALE_AUDIO_JOB.$inferInsert;
type AudioJobBase = Omit<InsertSaleAudioJob, "jobs_idno" | "crea_idno" | "crea_date" | "modi_idno" | "modi_date">;

function normalizePageInput(page?: { limit?: number; offset?: number } | null): { limit: number; offset: number } {
  const limit = page?.limit ?? 20;
  const offset = page?.offset ?? 0;
  return { limit, offset };
}

// #endregion

// #region Service

export const saleService = {
  // #region listSales

  async listSales(
    ctx: ServiceCtx,
    input?: {
      clie_idno?: number;
      search?: string;
      page?: { limit?: number; offset?: number } | null;
      sort?: { field?: "vist_date" | "modi_date" | "crea_date"; dir?: "asc" | "desc" } | null;
    }
  ) {
    const db = getDb();

    const page = normalizePage(normalizePageInput(input?.page));
    const sort_field = input?.sort?.field ?? "vist_date";
    const sort_dir = input?.sort?.dir ?? "desc";

    const isAdminOrOwner = ctx.comp_role === "owner" || ctx.comp_role === "admin";

    const rows = await saleRepo.list(
      { db },
      {
        comp_idno: ctx.comp_idno,
        owne_idno: isAdminOrOwner ? undefined : ctx.user_idno,
        clie_idno: input?.clie_idno,
        search: input?.search,
        limit: page.limit,
        offset: page.offset,
        sort_field,
        sort_dir,
      }
    );

    const hasMore = rows.length > page.limit;
    const sliced = hasMore ? rows.slice(0, page.limit) : rows;

    return {
      items: sliced.map((r) => ({
        sale_idno: Number(r.sale_idno),

        clie_idno: r.clie_idno == null ? null : Number(r.clie_idno),
        clie_name: r.clie_name ?? null,

        cont_name: r.cont_name ?? null,
        cont_role: r.cont_role ?? null,
        cont_mail: r.cont_mail ?? null,
        cont_tele: r.cont_tele ?? null,

        sale_loca: r.sale_loca ?? null,

        vist_date: toIso(r.vist_date),
        sale_pric: r.sale_pric ?? null,

        orig_memo: String(r.orig_memo),

        aiex_done: !!r.aiex_done,
        aiex_summ: r.aiex_summ ?? null,
        aiex_stat: (r.aiex_stat ?? "pending") as "pending" | "processing" | "completed" | "failed",
      })),
      page: { limit: page.limit, offset: page.offset, hasMore },
    };
  },

  // #endregion

  // #region getSale

  async getSale(ctx: ServiceCtx, sale_idno: number) {
    const db = getDb();

    const isAdminOrOwner = ctx.comp_role === "owner" || ctx.comp_role === "admin";
    const sale = await saleRepo.getById({ db }, {
      comp_idno: ctx.comp_idno,
      owne_idno: isAdminOrOwner ? undefined : ctx.user_idno,
      sale_idno,
    });
    if (!sale) return null;

    const attachments = await saleRepo.listAttachments({ db }, { comp_idno: ctx.comp_idno, sale_idno });

    // 연결된 거래처의 공식 연락처 조회
    let client_contact: {
      cont_name: string | null;
      cont_tele: string | null;
      cont_mail: string | null;
      clie_addr: string | null;
    } | null = null;

    if (sale.clie_idno) {
      const clie_idno = Number(sale.clie_idno);
      const client = await clientRepo.getById({ db }, { comp_idno: ctx.comp_idno, clie_idno });
      if (client) {
        const mainContact = await clientRepo.getMainContact({ db }, { comp_idno: ctx.comp_idno, clie_idno });
        client_contact = {
          cont_name: mainContact?.cont_name ?? client.cont_name ?? null,
          cont_tele: mainContact?.cont_tele ?? client.cont_tele ?? null,
          cont_mail: mainContact?.cont_mail ?? client.cont_mail ?? null,
          clie_addr: client.clie_addr ?? null,
        };
      }
    }

    // ✅ aiex_text -> aiex_core(필요한 것만)
    const aiex_core = sale.aiex_text ? toAiCore(sale.aiex_text) : null;

    // ✅ confidence 추출
    const aiex_confidence =
      typeof (sale.aiex_text as { confidence?: unknown } | null)?.confidence === "number"
        ? ((sale.aiex_text as { confidence?: number | null }).confidence ?? null)
        : null;

    // ✅ sale 기준 일정 목록(생성 여부 구분용)
    const schedules = await saleRepo.listSchedulesBySale(
      { db },
      { comp_idno: ctx.comp_idno, owne_idno: ctx.user_idno, sale_idno }
    );

    return {
      sale: {
        sale_idno: Number(sale.sale_idno),

        clie_idno: sale.clie_idno == null ? null : Number(sale.clie_idno),
        clie_name: sale.clie_name ?? null,

        cont_name: sale.cont_name ?? null,
        cont_role: sale.cont_role ?? null,
        cont_mail: sale.cont_mail ?? null,
        cont_tele: sale.cont_tele ?? null,

        sale_loca: sale.sale_loca ?? null,

        vist_date: toIso(sale.vist_date),
        sale_pric: sale.sale_pric ?? null,

        orig_memo: String(sale.orig_memo),
        sttx_text: sale.sttx_text ?? null,
        edit_text: sale.edit_text ?? null,

        aiex_done: !!sale.aiex_done,
        aiex_summ: sale.aiex_summ ?? null,
        aiex_stat: (sale.aiex_stat ?? "pending") as "pending" | "processing" | "completed" | "failed",
        aiex_confidence,
        aiex_core,
      },
      client_contact,
      attachments,
      schedules: schedules.map((s) => ({
        sche_idno: Number(s.sche_idno),
        sche_name: s.sche_name,
        sche_date: toIso(s.sche_date),
        sche_desc: s.sche_desc ?? null,
        sche_stat: s.sche_stat,
        actn_ownr: s.actn_ownr ?? null,
        auto_gene: !!s.auto_gene,
        aiex_keys: s.aiex_keys ?? null,
      })),
    };
  },

  // #endregion

  // #region createSale

  async createSale(ctx: ServiceCtx, input: SaleCreatePayload) {
    const db = getDb();
    const vist_date = parseDateOrThrow(input.vist_date, "vist_date가 올바른 날짜 형식이 아닙니다.");

    const base = {
      comp_idno: ctx.comp_idno,
      owne_idno: ctx.user_idno,

      clie_idno: input.clie_idno ?? null,
      clie_name: input.clie_name ?? null,
      cont_name: input.cont_name ?? null,
      sale_loca: input.sale_loca ?? null,

      vist_date,
      orig_memo: input.orig_memo,

      sttx_text: input.sttx_text ?? null,
      edit_text: input.edit_text ?? null,

      aiex_done: false,
      aiex_summ: null,
      aiex_text: null,
      aiex_stat: "pending" as const,

      enab_yesn: true,
    };

    const data = withCreateAudit(ctx, base);
    const { sale_idno } = await saleRepo.create({ db }, data as InsertSale);

    if (input.attachments?.length) {
      await fileLinkService.linkFilesToRef(ctx, {
        ref_type: "sale_info",
        refe_idno: sale_idno,
        attachments: input.attachments.map((a, i) => ({
          file_idno: a.file_idno,
          purp_type: a.purp_type ?? null,
          sort_orde: a.sort_orde ?? i,
        })),
      });
    }

    return { sale_idno };
  },

  // #endregion

  // #region updateSale

  async updateSale(ctx: ServiceCtx, sale_idno: number, patch: SaleUpdatePayload) {
    const db = getDb();

    const { vist_date: rawDate, ...restPatch } = patch;
    const data: Partial<InsertSale> = restPatch as Partial<InsertSale>;

    if (rawDate !== undefined) {
      data.vist_date =
        rawDate === null ? undefined : parseDateOrThrow(rawDate, "vist_date가 올바른 날짜 형식이 아닙니다.");
    }

    const audited = withUpdateAudit(ctx, data);
    await saleRepo.update({ db }, { comp_idno: ctx.comp_idno, owne_idno: ctx.user_idno, sale_idno, data: audited });

    return { success: true as const };
  },

  // #endregion

  // #region deleteSale

  async deleteSale(ctx: ServiceCtx, sale_idno: number) {
    const db = getDb();

    const patch = withUpdateAudit(ctx, { enab_yesn: false });
    await saleRepo.remove({ db }, { comp_idno: ctx.comp_idno, owne_idno: ctx.user_idno, sale_idno, data: patch });

    return { success: true as const };
  },

  // #endregion

  // #region transcribe (비동기 큐 등록)

  /**
   * STT 큐 등록 (HTTP 즉시 응답)
   * - job 생성 후 즉시 반환 — 실제 STT는 background worker가 처리
   * - 결과는 getTranscribeJobResult로 polling 조회
   */
  async transcribe(ctx: ServiceCtx, input: { sale_idno: number; file_idno: number; language?: string }) {
    const db = getDb();

    const exists = await saleRepo.getAudioJobByRef(
      { db },
      { comp_idno: ctx.comp_idno, sale_idno: input.sale_idno, file_idno: input.file_idno, jobs_type: "transcribe" }
    );

    if (exists) {
      return { jobs_idno: Number(exists.jobs_idno), jobs_stat: exists.jobs_stat };
    }

    const jobBase: AudioJobBase = {
      comp_idno: ctx.comp_idno,
      sale_idno: input.sale_idno,
      file_idno: input.file_idno,
      jobs_type: "transcribe",
      jobs_stat: "queued",
      fail_mess: null,
      sttx_text: null,
      aiex_summ: null,
      aiex_text: null,
      sttx_name: null,
      llmd_name: null,
      meta_json: { task: "transcribe", language: input.language ?? null },
      reqe_date: new Date(),
      fini_date: null,
    };
    const job = withCreateAudit(ctx, jobBase) as InsertSaleAudioJob;
    const created = await saleRepo.createAudioJob({ db }, job);

    return { jobs_idno: created.jobs_idno, jobs_stat: "queued" as const };
  },

  // #endregion

  // #region processQueuedTranscribeJob (Worker용)

  /**
   * queued 상태의 transcribe job 처리 — background worker 전용
   */
  async processQueuedTranscribeJob(jobs_idno: number) {
    const db = getDb();

    const job = await saleRepo.getAudioJobById({ db }, jobs_idno);
    if (!job || job.jobs_stat !== "queued") return;

    // sale_idno 없는 transcribe job은 processQueuedFileTranscribeJob이 처리해야 함
    // 여기에 잘못 라우팅된 경우 queued 상태로 방치하면 무한루프 — failed로 마킹
    if (job.sale_idno == null) {
      await saleRepo.updateAudioJob({ db }, {
        jobs_idno,
        data: { jobs_stat: "failed", fail_mess: "잘못된 라우팅: sale_idno 없는 transcribe job", fini_date: new Date() },
      });
      return;
    }

    await saleRepo.updateAudioJob({ db }, { jobs_idno, data: { jobs_stat: "running" } });

    const language = (job.meta_json as { language?: string | null } | null)?.language ?? "ko";
    const file_idno = job.file_idno;
    const comp_idno = Number(job.comp_idno);

    if (!file_idno) {
      await saleRepo.updateAudioJob({ db }, {
        jobs_idno,
        data: { jobs_stat: "failed", fail_mess: "file_idno가 없습니다.", fini_date: new Date() },
      });
      return;
    }

    const fileRow = await aiRepo.findFileById({ db }, { file_idno: Number(file_idno), comp_idno });
    if (!fileRow) {
      await saleRepo.updateAudioJob({ db }, {
        jobs_idno,
        data: { jobs_stat: "failed", fail_mess: "파일을 찾을 수 없습니다.", fini_date: new Date() },
      });
      return;
    }

    const estimate = (fileRow.dura_secs ?? 100) * 10;
    try {
      await aiService.checkAndDeductQuota(comp_idno, estimate);
    } catch {
      await saleRepo.updateAudioJob({ db }, {
        jobs_idno,
        data: { jobs_stat: "failed", fail_mess: "토큰 부족", fini_date: new Date() },
      });
      return;
    }

    let buffer: Buffer;
    let contentType: string;

    try {
      const result = await storageGetBuffer(fileRow.file_path);
      buffer = result.buffer;
      contentType = fileRow.mime_type ?? result.contentType;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "스토리지 다운로드 실패";
      await aiService.refundQuota(comp_idno, estimate);
      await saleRepo.updateAudioJob({ db }, {
        jobs_idno,
        data: { jobs_stat: "failed", fail_mess: msg, fini_date: new Date() },
      });
      return;
    }

    const sttResult = await transcribeBuffer(buffer, contentType, { language });

    if ("error" in sttResult) {
      await aiService.refundQuota(comp_idno, estimate);
      await saleRepo.updateAudioJob({ db }, {
        jobs_idno,
        data: { jobs_stat: "failed", fail_mess: sttResult.error, fini_date: new Date() },
      });
      return;
    }

    const sttx_text = sttResult.text;

    await saleRepo.update({ db }, {
      comp_idno,
      owne_idno: Number(job.crea_idno),
      sale_idno: Number(job.sale_idno),
      data: { sttx_text },
    });

    await saleRepo.updateAudioJob({ db }, {
      jobs_idno,
      data: { jobs_stat: "done", sttx_text, sttx_name: "whisper", fini_date: new Date() },
    });

    // 후처리: 실패해도 job은 이미 done — 별도 try-catch로 상태 보호
    try {
      await aiService.recordUsage(db, {
        comp_idno,
        user_idno: Number(job.crea_idno),
        feat_code: "stt",
        mode_name: "whisper",
        tokn_inpt: 0,
        tokn_outs: estimate,
        meta_json: { file_idno, dura_secs: fileRow.dura_secs },
      });
    } catch (err) {
      logger.error({ err, jobs_idno }, "[transcribe] recordUsage 실패 (non-fatal, job은 done 유지)");
    }
  },

  // #endregion

  // #region getTranscribeJobResult (deprecated)

  /**
   * @deprecated sale_idno 기준으로 "가장 최신 transcribe job"을 반환하므로
   * 파일이 여러 개인 경우 엉뚱한 job 상태를 반환할 수 있음.
   * 대신 getTranscribeJobResultById(jobs_idno) 를 사용할 것.
   */
  async getTranscribeJobResult(ctx: ServiceCtx, sale_idno: number) {
    const db = getDb();

    const isAdminOrOwner = ctx.comp_role === "owner" || ctx.comp_role === "admin";
    const sale = await saleRepo.getById({ db }, {
      comp_idno: ctx.comp_idno,
      owne_idno: isAdminOrOwner ? undefined : ctx.user_idno,
      sale_idno,
    });
    if (!sale) throwAppError({ tRPCCode: "NOT_FOUND", appCode: "SALE_NOT_FOUND", message: "영업일지를 찾을 수 없습니다.", displayType: "toast" });

    const job = await saleRepo.getLatestTranscribeJob({ db }, { sale_idno, comp_idno: ctx.comp_idno });

    return {
      jobs_stat: (job?.jobs_stat ?? null) as "queued" | "running" | "done" | "failed" | null,
      sttx_text: job?.sttx_text ?? null,
      fail_mess: job?.fail_mess ?? null,
    };
  },

  // #endregion

  // #region getTranscribeJobResultById

  /**
   * STT 결과 조회 — jobs_idno 기준 (transcribe 뮤테이션이 반환한 값으로 polling)
   * - 파일이 여러 개인 경우에도 정확한 job을 반환
   */
  async getTranscribeJobResultById(ctx: ServiceCtx, jobs_idno: number) {
    const db = getDb();

    const job = await saleRepo.getAudioJobById({ db }, jobs_idno);

    // 존재 여부 + 본인 회사 job인지 확인
    if (!job || Number(job.comp_idno) !== ctx.comp_idno) {
      throwAppError({ tRPCCode: "NOT_FOUND", appCode: "JOB_NOT_FOUND", message: "작업을 찾을 수 없습니다.", displayType: "toast" });
    }

    return {
      jobs_stat: job.jobs_stat as "queued" | "running" | "done" | "failed",
      sttx_text: job.sttx_text ?? null,
      fail_mess: job.fail_mess ?? null,
    };
  },

  // #endregion

  // #region queueAnalyze

  /**
   * AI 분석 큐 등록 (HTTP 즉시 응답)
   * - 잡 생성 + 토큰 선차감 + aiex_stat = "pending" 설정 후 즉시 반환
   * - 실제 LLM 처리는 background worker(processQueuedAnalyzeJob)가 수행
   */
  async queueAnalyze(ctx: ServiceCtx, sale_idno: number, file_idno?: number) {
    const db = getDb();

    const isAdminOrOwner = ctx.comp_role === "owner" || ctx.comp_role === "admin";
    const sale = await saleRepo.getById({ db }, {
      comp_idno: ctx.comp_idno,
      owne_idno: isAdminOrOwner ? undefined : ctx.user_idno,
      sale_idno,
    });
    if (!sale) throwAppError({ tRPCCode: "NOT_FOUND", appCode: "SALE_NOT_FOUND", message: "영업일지를 찾을 수 없습니다.", displayType: "toast" });

    const text = sale.edit_text?.trim() || sale.orig_memo;
    if (!text?.trim()) {
      throwAppError({ tRPCCode: "BAD_REQUEST", appCode: "SALE_NO_TEXT", message: "분석할 텍스트가 없습니다. 먼저 음성을 전사해주세요.", displayType: "toast" });
    }

    let targetFileId = file_idno;
    if (!targetFileId) {
      const atts = await saleRepo.listAttachments({ db }, { comp_idno: ctx.comp_idno, sale_idno });
      targetFileId = atts[0]?.file_idno;
    }

    // 잡 생성/재사용
    let jobs_idno: number;
    if (targetFileId) {
      const exists = await saleRepo.getAudioJobByRef({ db }, { comp_idno: ctx.comp_idno, sale_idno, file_idno: targetFileId, jobs_type: "analyze" });
      if (exists) {
        const existStat = exists.jobs_stat;

        // running 중이면 재요청 차단 — 워커가 LLM 호출 중인 job을 되돌리면 이중 처리 발생
        if (existStat === "running") {
          throwAppError({ tRPCCode: "CONFLICT", appCode: "JOB_ALREADY_RUNNING", message: "AI 분석이 이미 진행 중입니다. 잠시 후 다시 시도해주세요.", displayType: "toast" });
        }

        // 이미 queued — 토큰 차감 없이 기존 job 반환
        if (existStat === "queued") {
          return { jobs_idno: Number(exists.jobs_idno), jobs_stat: "queued" as const };
        }

        // done / failed — 재실행: 초기화 후 이어서 토큰 차감
        jobs_idno = Number(exists.jobs_idno);
        await saleRepo.updateAudioJob({ db }, {
          jobs_idno,
          data: { jobs_stat: "queued", fail_mess: null, aiex_summ: null, aiex_text: null, reqe_date: new Date(), fini_date: null },
        });
      } else {
        const jobBase: AudioJobBase = {
          comp_idno: ctx.comp_idno, sale_idno, file_idno: targetFileId,
          jobs_stat: "queued", fail_mess: null, sttx_text: null,
          aiex_summ: null, aiex_text: null, sttx_name: null, llmd_name: null,
          meta_json: { task: "analyze" }, reqe_date: new Date(), fini_date: null,
        };
        const job = withCreateAudit(ctx, jobBase) as InsertSaleAudioJob;
        const created = await saleRepo.createAudioJob({ db }, job);
        jobs_idno = created.jobs_idno;
      }
    } else {
      // file 없는 분석 — 기존 job 재사용
      const existingNoFile = await saleRepo.getLatestAnalyzeNoFileJob({ db }, { comp_idno: ctx.comp_idno, sale_idno });
      if (existingNoFile) {
        const existStat = existingNoFile.jobs_stat;

        // running 중이면 재요청 차단
        if (existStat === "running") {
          throwAppError({ tRPCCode: "CONFLICT", appCode: "JOB_ALREADY_RUNNING", message: "AI 분석이 이미 진행 중입니다. 잠시 후 다시 시도해주세요.", displayType: "toast" });
        }

        // 이미 queued — 토큰 차감 없이 기존 job 반환
        if (existStat === "queued") {
          return { jobs_idno: Number(existingNoFile.jobs_idno), jobs_stat: "queued" as const };
        }

        // done / failed — 재실행: 초기화 후 이어서 토큰 차감
        jobs_idno = Number(existingNoFile.jobs_idno);
        await saleRepo.updateAudioJob({ db }, {
          jobs_idno,
          data: { jobs_stat: "queued", fail_mess: null, aiex_summ: null, aiex_text: null, reqe_date: new Date(), fini_date: null },
        });
      } else {
        const jobBase: AudioJobBase = {
          comp_idno: ctx.comp_idno, sale_idno, file_idno: null,
          jobs_stat: "queued", fail_mess: null, sttx_text: null,
          aiex_summ: null, aiex_text: null, sttx_name: null, llmd_name: null,
          meta_json: { task: "analyze_text" }, reqe_date: new Date(), fini_date: null,
        };
        const job = withCreateAudit(ctx, jobBase) as InsertSaleAudioJob;
        const created = await saleRepo.createAudioJob({ db }, job);
        jobs_idno = created.jobs_idno;
      }
    }

    // 토큰 선차감 — 부족 시 잡을 failed로 마킹하고 에러 throw
    try {
      await aiService.checkAndDeductQuota(ctx.comp_idno, 1500);
    } catch (err) {
      await saleRepo.updateAudioJob({ db }, {
        jobs_idno,
        data: { jobs_stat: "failed", fail_mess: "AI 토큰 부족", fini_date: new Date() },
      });
      throw err;
    }

    await saleRepo.update({ db }, {
      comp_idno: ctx.comp_idno, owne_idno: ctx.user_idno, sale_idno,
      data: { aiex_stat: "pending" as const },
    });

    return { jobs_idno, jobs_stat: "queued" as const };
  },

  // #endregion

  // #region processQueuedAnalyzeJob

  /**
   * Worker: 큐에서 잡 하나를 꺼내 LLM 분석 실행
   * - billing.jobs.ts의 runAiJobWorker가 5초마다 호출
   * - 결과는 CRM_SALE_AUDIO_JOB.aiex_text에 저장 (analyzeResult 엔드포인트로 조회)
   */
  async processQueuedAnalyzeJob(jobs_idno: number): Promise<void> {
    const db = getDb();

    const job = await saleRepo.getAudioJobById({ db }, jobs_idno);
    if (!job || job.jobs_stat !== "queued") return;

    // sale_idno 없는 analyze job은 데이터 오류 — queued 방치 시 무한루프 발생하므로 failed 처리
    if (job.sale_idno == null) {
      await saleRepo.updateAudioJob({ db }, {
        jobs_idno,
        data: { jobs_stat: "failed", fail_mess: "잘못된 데이터: analyze job에 sale_idno가 없습니다.", fini_date: new Date() },
      });
      return;
    }

    const comp_idno = job.comp_idno;
    const sale_idno = job.sale_idno;

    // 잡 → running
    await saleRepo.updateAudioJob({ db }, { jobs_idno, data: { jobs_stat: "running" } });

    // sale 조회 (owne_idno 없이)
    const sale = await saleRepo.getSaleForWorker({ db }, { sale_idno, comp_idno });
    if (!sale) {
      await saleRepo.updateAudioJob({ db }, {
        jobs_idno,
        data: { jobs_stat: "failed", fail_mess: "영업일지를 찾을 수 없습니다.", fini_date: new Date() },
      });
      return;
    }

    const owne_idno = Number(sale.owne_idno);
    const workerCtx: ServiceCtx = { comp_idno, user_idno: owne_idno };

    // sale → processing
    await saleRepo.update({ db }, {
      comp_idno, owne_idno, sale_idno,
      data: { aiex_stat: "processing" as const },
    });

    const rawText = sale.edit_text?.trim() || sale.orig_memo;
    const text = cleanTranscript(rawText).slice(0, 4000);
    if (!text?.trim()) {
      await saleRepo.updateAudioJob({ db }, {
        jobs_idno, data: { jobs_stat: "failed", fail_mess: "분석할 텍스트가 없습니다.", fini_date: new Date() },
      });
      await saleRepo.update({ db }, { comp_idno, owne_idno, sale_idno, data: { aiex_stat: "failed" as const } });
      return;
    }

    // LLM 호출
    const kstInfo = getKSTDateInfo(sale.vist_date);
    const systemPrompt = buildAnalysisPrompt(kstInfo);

    const userContext = `
    Meeting transcript:
    ${text}

    Existing CRM context:
    client_name: ${sale.clie_name ?? "unknown"}
    contact_person: ${sale.cont_name ?? "unknown"}
    location: ${sale.sale_loca ?? "unknown"}
    `;

    let llmResult: Awaited<ReturnType<typeof invokeLLM>>;

    try {
      llmResult = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContext },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        top_p: 0.1,
      });
    } catch (err) {
      await aiService.refundQuota(comp_idno, 1500);
      await saleRepo.updateAudioJob({ db }, {
        jobs_idno,
        data: { jobs_stat: "failed", fail_mess: err instanceof Error ? err.message : "LLM 호출 실패", fini_date: new Date() },
      });
      await saleRepo.update({ db }, { comp_idno, owne_idno, sale_idno, data: { aiex_stat: "failed" as const } });
      return;
    }

    // LLM 응답 파싱
    const rawContent = llmResult.choices[0]?.message?.content;
    const contentStr = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent ?? {});

    type PricingEntry = {
      amount?: number | null; min?: number | null; max?: number | null;
      type?: "one_time" | "monthly" | "yearly"; vat?: "included" | "excluded" | "unknown";
      approximate?: boolean; inferred?: boolean; label?: string;
    };

    let parsed: {
      summary?: string;
      appointments?: Array<{
        title?: string; date?: string | null; date_adjusted?: boolean;
        adjust_reason?: string; desc?: string; action_owner?: "self" | "client" | "shared";
      }> | null;
      client_name?: string | null;
      contacts?: Array<{ name: string; role?: string | null; phone?: string | null; email?: string | null }> | null;
      pricing?: { primary?: PricingEntry | null; alternatives?: PricingEntry[]; final?: PricingEntry | null } | null;
      notes?: string;
    } = {};

    function safeJsonParse<T>(raw: string, fallback: T): T {
      try {
        return JSON.parse(raw);
      } catch { }

      const match = raw.match(/\{[\s\S]*\}/);

      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch { }
      }

      // JSON repair fallback
      try {
        const repaired = raw
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]")
          .replace(/\n/g, " ")
          .trim();

        return JSON.parse(repaired);
      } catch { }

      return fallback;
    }

    parsed = safeJsonParse<typeof parsed>(contentStr, {
      summary: contentStr,
    });

    const ai_confidence = computeAiConfidence(parsed, text);
    const normalizedAppointments = normalizeAiAppointments(parsed.appointments ?? []);

    parsed = {
      ...parsed,
      appointments: normalizedAppointments,
      confidence: ai_confidence,
    } as typeof parsed & { confidence: number };

    const summary = parsed.summary ?? "";
    const ai_client_name = parsed.client_name ?? null;
    let matched_client_idno: number | null = null;
    let matched_client_name: string | null = null;

    if (ai_client_name && !sale.clie_idno) {
      const matched = await clientService.findBestClientMatch(workerCtx, { name: ai_client_name });
      if (matched) {
        matched_client_idno = matched.clie_idno;
        matched_client_name = matched.clie_name;
      }
    }

    const pricingSource = parsed.pricing?.final ?? parsed.pricing?.primary ?? null;
    const rawAmount = pricingSource?.amount ?? pricingSource?.min ?? null;

    const sale_pric =
      typeof rawAmount === "number" && rawAmount > 0
        ? Math.round(rawAmount)
        : null;

    const ai_contacts = (parsed.contacts ?? [])
      .map((c) => ({
        cont_name: c.name?.trim() ?? "",
        cont_role: c.role?.trim() || null,
        cont_tele: c.phone?.trim() || null,
        cont_mail: c.email?.trim() || null,
      }))
      .filter((c) => c.cont_name.length > 0);

    const primaryContact = ai_contacts[0] ?? null;

    // sale 업데이트
    await saleRepo.update({ db }, {
      comp_idno, owne_idno, sale_idno,
      data: {
        aiex_done: true,
        aiex_summ: summary,
        aiex_text: parsed as Record<string, unknown>,
        aiex_stat: "completed" as const,
        ...(sale_pric !== null && !sale.sale_pric ? { sale_pric: String(sale_pric) } : {}),
        ...(primaryContact?.cont_name && !sale.cont_name ? { cont_name: primaryContact.cont_name } : {}),
        ...(primaryContact?.cont_role && !sale.cont_role ? { cont_role: primaryContact.cont_role } : {}),
        ...(primaryContact?.cont_tele && !sale.cont_tele ? { cont_tele: primaryContact.cont_tele } : {}),
        ...(primaryContact?.cont_mail && !sale.cont_mail ? { cont_mail: primaryContact.cont_mail } : {}),
      },
    });

    // 연결된 거래처 컨택 동기화
    if (sale.clie_idno && ai_contacts.length > 0) {
      await clientService.syncContacts(workerCtx, {
        clie_idno: Number(sale.clie_idno),
        contacts: ai_contacts,
      });
    }

    // 일정 자동 생성 (aiex_keys 중복 방지)
    let schedule_idno: number | null = null;
    for (const appt of normalizedAppointments) {
      if (!appt.date) continue;
      const apptDate = new Date(appt.date);
      if (Number.isNaN(apptDate.getTime())) continue;

      const actn_ownr = appt.action_owner ?? "self";
      const aiex_keys = makeAiApptKey({ title: appt.title ?? "", date: appt.date, action_owner: actn_ownr });

      const existsSchedule = await saleRepo.findScheduleByAiKey({ db }, { comp_idno, sale_idno, aiex_keys });
      if (existsSchedule) continue;

      const schedData = withCreateAudit(workerCtx, {
        comp_idno, owne_idno, sale_idno,
        clie_idno: sale.clie_idno ?? null,
        clie_name: (parsed.client_name ?? sale.clie_name) ?? null,
        sche_name: sanitizeAiTitle(appt.title ?? "AI 자동 일정"),
        sche_desc: appt.desc ?? null,
        sche_pric: sale_pric !== null ? String(sale_pric) : null,
        sche_date: apptDate,
        sche_stat: "scheduled" as const,
        actn_ownr,
        auto_gene: true,
        aiex_keys,
        enab_yesn: true,
      });
      const created = await saleRepo.createSchedule({ db }, schedData);
      if (schedule_idno === null) schedule_idno = created.sche_idno;
    }

    // 결과 payload → aiex_text에 저장 (analyzeResult 엔드포인트에서 조회)
    const resultPayload = {
      summary,
      confidence: ai_confidence,
      client_name: ai_client_name,
      matched_client_idno,
      matched_client_name,
      contacts: ai_contacts,
      appointments: normalizedAppointments,
      pricing: parsed.pricing ?? null,
      notes: parsed.notes ?? "",
      schedule_idno,
    };

    // 잡 → done
    await saleRepo.updateAudioJob({ db }, {
      jobs_idno,
      data: {
        jobs_stat: "done",
        aiex_summ: summary,
        aiex_text: resultPayload,
        llmd_name: llmResult.model,
        fini_date: new Date(),
      },
    });

    // 후처리: 실패해도 job은 이미 done — 별도 try-catch로 상태 보호
    try {
      const usage = llmResult.usage;
      await aiService.recordUsage(db, {
        comp_idno, user_idno: owne_idno, feat_code: "llm",
        mode_name: llmResult.model,
        tokn_inpt: usage?.prompt_tokens ?? 0,
        tokn_outs: usage?.completion_tokens ?? 0,
        meta_json: { sale_idno, jobs_idno },
      });
    } catch (err) {
      logger.error({ err, jobs_idno }, "[analyze] recordUsage 실패 (non-fatal, job은 done 유지)");
    }
  },

  // #endregion

  // #region getAnalyzeJobResult

  /**
   * AI 분석 결과 조회 — 워커 완료 후 클라이언트가 polling으로 호출
   */
  async getAnalyzeJobResult(ctx: ServiceCtx, sale_idno: number) {
    const db = getDb();

    // 사용자 접근 권한 확인
    const isAdminOrOwner = ctx.comp_role === "owner" || ctx.comp_role === "admin";
    const sale = await saleRepo.getById({ db }, {
      comp_idno: ctx.comp_idno,
      owne_idno: isAdminOrOwner ? undefined : ctx.user_idno,
      sale_idno,
    });
    if (!sale) throwAppError({ tRPCCode: "NOT_FOUND", appCode: "SALE_NOT_FOUND", message: "영업일지를 찾을 수 없습니다.", displayType: "toast" });

    const aiex_stat = (sale.aiex_stat ?? "pending") as "pending" | "processing" | "completed" | "failed";

    const job = await saleRepo.getLatestDoneAnalyzeJob({ db }, { sale_idno, comp_idno: ctx.comp_idno });

    type ExtPayload = {
      summary?: string | null;
      confidence?: number | null;
      schedule_idno?: number | null;
      ai_client_name?: string | null;
      matched_client_idno?: number | null;
      matched_client_name?: string | null;
      ai_contacts?: Array<{ cont_name: string; cont_role?: string | null; cont_tele?: string | null; cont_mail?: string | null }>;
      ai_contact_person?: string | null;
      ai_contact_phone?: string | null;
      ai_contact_email?: string | null;
    };

    const ext = job?.aiex_text as ExtPayload | null;

    return {
      aiex_stat,
      jobs_stat: job?.jobs_stat ?? null,
      summary: ext?.summary ?? null,
      confidence: ext?.confidence ?? null,
      schedule_idno: ext?.schedule_idno ?? null,
      ai_client_name: ext?.ai_client_name ?? null,
      matched_client_idno: ext?.matched_client_idno ?? null,
      matched_client_name: ext?.matched_client_name ?? null,
      ai_contacts: ext?.ai_contacts ?? [],
      ai_contact_person: ext?.ai_contact_person ?? null,
      ai_contact_phone: ext?.ai_contact_phone ?? null,
      ai_contact_email: ext?.ai_contact_email ?? null,

    };
  },

  // #endregion

  // #region patchScheduleClient
  async patchScheduleClient(
    ctx: ServiceCtx,
    sale_idno: number,
    clie_idno: number,
    clie_name?: string | null
  ) {
    const db = getDb();
    await saleRepo.patchSchedulesClientBySale({ db }, { comp_idno: ctx.comp_idno, sale_idno, clie_idno, clie_name });
    return { success: true as const };
  },
  // #endregion
} as const;

// #endregion

// #region Prompt Helpers

type KSTDateInfo = {
  dateStr: string;                  // YYYY-MM-DD (기준일)
  dayOfWeek: string;                // 월|화|수|목|금|토|일
  thisWeek: Record<string, string>; // 요일 → YYYY-MM-DD (이번 주 월~일)
  nextWeek: Record<string, string>; // 요일 → YYYY-MM-DD (다음 주 월~일)
};

function getKSTDateInfo(date: Date): KSTDateInfo {
  const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
  const WEEK_ORDER = ["월", "화", "수", "목", "금", "토", "일"] as const;

  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const dateStr = kst.toISOString().slice(0, 10);
  const dowIndex = kst.getUTCDay(); // 0=일, 1=월, …, 6=토
  const dayOfWeek = DAY_NAMES[dowIndex];

  // 이번 주 월요일 오프셋 (월 시작 기준)
  const mondayOffset = dowIndex === 0 ? -6 : 1 - dowIndex;
  const y = kst.getUTCFullYear();
  const mo = kst.getUTCMonth();
  const d = kst.getUTCDate();

  const thisWeek: Record<string, string> = {};
  const nextWeek: Record<string, string> = {};
  for (let i = 0; i < 7; i++) {
    const tw = new Date(Date.UTC(y, mo, d + mondayOffset + i));
    const nw = new Date(Date.UTC(y, mo, d + mondayOffset + 7 + i));
    thisWeek[WEEK_ORDER[i]] = tw.toISOString().slice(0, 10);
    nextWeek[WEEK_ORDER[i]] = nw.toISOString().slice(0, 10);
  }

  return { dateStr, dayOfWeek, thisWeek, nextWeek };
}

function buildAnalysisPrompt({ dateStr: baseDate, dayOfWeek: baseDayOfWeek, thisWeek, nextWeek }: KSTDateInfo): string {
  const DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
  const thisWeekCalendar = DAYS
    .map((d) => `  ${d}요일: ${thisWeek[d]}${d === baseDayOfWeek ? " ← 기준일(미팅)" : ""}`)
    .join("\n");
  const nextWeekCalendar = DAYS
    .map((d) => `  ${d}요일: ${nextWeek[d]}`)
    .join("\n");

  return `You are a deterministic information extraction system.

================================
NON-NEGOTIABLE RULES
================================

- Output ONLY valid JSON.
- Do NOT output markdown, explanations, or reasoning.
- Never hallucinate company names, contacts, dates, tasks, or prices.
- If information is uncertain, return JSON null.
- Never invent people or organizations.
- client_name must be null if a company name is not clearly stated.
- appointment.date must be either:
  - a valid ISO 8601 datetime string with +09:00
  - or JSON null
- Never output the string "null".

================================
INTERNAL REASONING (DO NOT OUTPUT)
================================

Before producing the JSON, internally perform:

1. Identify all companies mentioned.
2. Identify all people mentioned and their roles.
3. Identify all meetings, tasks, and follow-up actions.
4. Identify all price mentions and negotiation context.
5. Resolve all relative dates using the provided calendars.

Do NOT output this reasoning.

Return ONLY the final JSON object.

================================
REFERENCE DATE (KST)
================================

기준일(미팅일시): ${baseDate} (${baseDayOfWeek}요일)

▶ 이번 주 달력
${thisWeekCalendar}

▶ 다음 주 달력
${nextWeekCalendar}

================================
OUTPUT JSON SCHEMA
================================

{
  "summary": "...",
  "appointments": [],
  "client_name": null,
  "contacts": [],
  "pricing": {},
  "notes": ""
}

================================
SUMMARY RULES
================================

- Write summary in Korean, 3-5 sentences.
- Include:
  - 핵심 논의 내용
  - 거래처 요구사항
  - 협의 결과
  - 후속 조치
- Do not invent missing facts.

================================
APPOINTMENT EXTRACTION RULES
================================

Extract EVERY meeting, follow-up, task, or action item.

Include both:

Shared events
- 미팅
- 발표
- 데모
- 협의
- 계약

One-sided tasks
- 자료 발송
- 견적 전달
- 확인 후 회신
- 내부 확인
- 팔로업

appointments must be [] ONLY if absolutely no action exists.

If multiple materials are clearly requested together, merge into one appointment.

Example:
견적서 + 기능 소개 자료 → "자료 패키지 발송"

If tasks differ by purpose or timing, keep them separate.

================================
ACTION OWNER RULES
================================

self
- 우리가 수행해야 하는 작업
- 자료 발송
- 확인 후 회신
- 내부 확인
- 팔로업

client
- 거래처가 수행해야 하는 작업
- 내부 결재
- 내부 검토
- 자료 전달

shared
- 양측 공동 활동
- 미팅
- 데모
- 계약

================================
CONTACT EXTRACTION RULES
================================

Extract ALL distinct persons mentioned.

Each person = separate entry.

Different name OR different role → separate.

role values:

실무담당
의사결정자
null

Example:

정유진 대리 → 실무담당  
김태훈 팀장 → 의사결정자

contacts is [] if no person is mentioned.

Preserve phone/email only if explicitly stated.

================================
CLIENT NAME RULES
================================

Extract official company name.

Examples

삼성전자 구매팀 → 삼성전자  
네이버 클라우드 → 네이버

If only a person's name appears → null

Ignore generic references:

거래처  
사장님 회사

================================
PRICING RULES
================================

Never store a single number directly.

Always use structured pricing object.

KRW conversion:

1억 = 100000000  
1천만 = 10000000  
1백만 = 1000000

Examples

5천만원 → 50000000  
2억5천만원 → 250000000

type rules

monthly → 월 / 매월  
yearly → 연 / 연간  
one_time → 프로젝트 / 총액

amount vs range

Exact price → amount

Range / approximate

80~120만원  
약 500만원

→ use min/max and approximate true

VAT rules

부가세 별도 → excluded  
부가세 포함 → included  
언급 없음 → unknown

Pricing structure

primary  
alternatives  
final

If no pricing mentioned → pricing null

================================
DATE RESOLUTION RULES
================================

DATE PRIORITY ORDER

1. Explicit date number
2. Relative date resolved from provided calendars
3. Weekday text
4. Soft follow-up inferred date
5. If still uncertain → null

--------------------------------

Step 1 — 기준일

기준일: ${baseDate}

--------------------------------

Step 2 — 요일 해석

이번 주 화요일 → 이번 주 달력 사용  
다음 주 화요일 → 다음 주 달력 사용

요일만 언급된 경우

기준일 이후 요일 → 이번 주  
기준일 이전 요일 → 다음 주

--------------------------------

Step 3 — 날짜 숫자 우선 규칙

"3월 10일 화요일"

→ 날짜 숫자만 신뢰

요일 텍스트 무시

--------------------------------

Step 4 — 월/분기 표현

이번 달 말 → last day of month  
다음 달 15일 → next month 15

상반기 → 6월 30일  
하반기 → 12월 31일

--------------------------------

Step 5 — 시각 기본값

시간 언급 없음 → 09:00  
오전 → 09:00  
오후 → 14:00

--------------------------------

Step 6 — 주말 처리

Explicit weekend

토요일 / 일요일 언급 → 그대로 사용

Implicit weekend

"주말까지"

task  
→ 다음 월요일 09:00

event  
→ date null

--------------------------------

Step 7 — Soft follow-up rule

For implied follow-ups:

확인 후 연락  
검토 후 알려달라

You MAY assign:

baseDate +3 days 09:00

If timing unclear → null

================================
TITLE RULES
================================

Titles must be:

Action oriented  
Clear  
≤15 characters

GOOD

견적서 발송  
자료 패키지 발송  
제안 미팅

BAD

삼성과 관련된 다음 단계

Client tasks we track

내부 검토 결과 확인  
결재 완료 확인

Only natural Korean words.

================================
DESC RULES
================================

desc must preserve original meeting context.

Include:

who said what  
expectations

Example

우진테크 최 부장이 내부 검토 후 회신 예정

================================
DEDUP RULES
================================

Do NOT create duplicate appointments.

Merge when:

same purpose  
same recipient  
same timing

Example

견적서 발송  
기능 소개 자료 발송

→ 자료 패키지 발송

================================
NOTES
================================

Write additional observations or leave empty string.

================================
END
================================`;
}

// #endregion