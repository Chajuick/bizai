// server/modules/crm/sale/sale.service.ts

// #region Imports

import type { ServiceCtx } from "../../../core/serviceCtx";
import { throwAppError } from "../../../core/trpc/appError";
import { getDb } from "../../../core/db";

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

    const isAdminOrOwner = ctx.company_role === "owner" || ctx.company_role === "admin";

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
        ai_status: (r.ai_status ?? "pending") as "pending" | "processing" | "completed" | "failed",
      })),
      page: { limit: page.limit, offset: page.offset, hasMore },
    };
  },

  // #endregion

  // #region getSale

  async getSale(ctx: ServiceCtx, sale_idno: number) {
    const db = getDb();

    const isAdminOrOwner = ctx.company_role === "owner" || ctx.company_role === "admin";
    const sale = await saleRepo.getById({ db }, {
      comp_idno: ctx.comp_idno,
      owne_idno: isAdminOrOwner ? undefined : ctx.user_idno,
      sale_idno,
    });
    if (!sale) return null;

    const attachments = await saleRepo.listAttachments({ db }, { comp_idno: ctx.comp_idno, sale_idno });

    // 연결된 고객사의 공식 연락처 조회
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
        ai_status: (sale.ai_status ?? "pending") as "pending" | "processing" | "completed" | "failed",
        aiex_core,
      },
      client_contact,
      attachments,
      schedules: schedules.map((s) => ({
        sche_idno: Number(s.sche_idno),
        sche_name: s.sche_name,
        sche_date: toIso(s.sche_date),
        sche_desc: s.sche_desc ?? null,
        stat_code: s.stat_code,
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
      ai_status: "pending" as const,

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
      aiex_sum: null,
      aiex_ext: null,
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
    if (job.sale_idno == null) return; // file-only job은 processQueuedFileTranscribeJob이 처리

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

    await aiService.recordUsage(db, {
      comp_idno,
      user_idno: Number(job.crea_idno),
      feat_code: "stt",
      mode_name: "whisper",
      tokn_inpt: 0,
      tokn_outs: estimate,
      meta_json: { file_idno, dura_secs: fileRow.dura_secs },
    });
  },

  // #endregion

  // #region getTranscribeJobResult

  async getTranscribeJobResult(ctx: ServiceCtx, sale_idno: number) {
    const db = getDb();

    const isAdminOrOwner = ctx.company_role === "owner" || ctx.company_role === "admin";
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

  // #region queueAnalyze

  /**
   * AI 분석 큐 등록 (HTTP 즉시 응답)
   * - 잡 생성 + 토큰 선차감 + ai_status = "pending" 설정 후 즉시 반환
   * - 실제 LLM 처리는 background worker(processQueuedAnalyzeJob)가 수행
   */
  async queueAnalyze(ctx: ServiceCtx, sale_idno: number, file_idno?: number) {
    const db = getDb();

    const isAdminOrOwner = ctx.company_role === "owner" || ctx.company_role === "admin";
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

    // 잡 생성/재사용 — 기존 잡이 있으면 queued 상태로 리셋
    let jobs_idno: number;
    if (targetFileId) {
      const exists = await saleRepo.getAudioJobByRef({ db }, { comp_idno: ctx.comp_idno, sale_idno, file_idno: targetFileId, jobs_type: "analyze" });
      if (exists) {
        jobs_idno = Number(exists.jobs_idno);
        await saleRepo.updateAudioJob({ db }, {
          jobs_idno,
          data: { jobs_stat: "queued", fail_mess: null, aiex_sum: null, aiex_ext: null, reqe_date: new Date(), fini_date: null },
        });
      } else {
        const jobBase: AudioJobBase = {
          comp_idno: ctx.comp_idno, sale_idno, file_idno: targetFileId,
          jobs_stat: "queued", fail_mess: null, sttx_text: null,
          aiex_sum: null, aiex_ext: null, sttx_name: null, llmd_name: null,
          meta_json: { task: "analyze" }, reqe_date: new Date(), fini_date: null,
        };
        const job = withCreateAudit(ctx, jobBase) as InsertSaleAudioJob;
        const created = await saleRepo.createAudioJob({ db }, job);
        jobs_idno = created.jobs_idno;
      }
    } else {
      // file 없는 분석 — 기존 job 재사용 (중복 토큰 차감 방지)
      const existingNoFile = await saleRepo.getLatestAnalyzeNoFileJob({ db }, { comp_idno: ctx.comp_idno, sale_idno });
      if (existingNoFile) {
        jobs_idno = Number(existingNoFile.jobs_idno);
        await saleRepo.updateAudioJob({ db }, {
          jobs_idno,
          data: { jobs_stat: "queued", fail_mess: null, aiex_sum: null, aiex_ext: null, reqe_date: new Date(), fini_date: null },
        });
      } else {
        const jobBase: AudioJobBase = {
          comp_idno: ctx.comp_idno, sale_idno, file_idno: null,
          jobs_stat: "queued", fail_mess: null, sttx_text: null,
          aiex_sum: null, aiex_ext: null, sttx_name: null, llmd_name: null,
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
      data: { ai_status: "pending" as const },
    });

    return { jobs_idno, jobs_stat: "queued" as const };
  },

  // #endregion

  // #region processQueuedAnalyzeJob

  /**
   * Worker: 큐에서 잡 하나를 꺼내 LLM 분석 실행
   * - billing.jobs.ts의 runAiJobWorker가 5초마다 호출
   * - 결과는 CRM_SALE_AUDIO_JOB.aiex_ext에 저장 (analyzeResult 엔드포인트로 조회)
   */
  async processQueuedAnalyzeJob(jobs_idno: number): Promise<void> {
    const db = getDb();

    const job = await saleRepo.getAudioJobById({ db }, jobs_idno);
    if (!job || job.jobs_stat !== "queued") return;
    if (job.sale_idno == null) return; // file-only job은 처리 대상 아님

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
      data: { ai_status: "processing" as const },
    });

    const text = sale.edit_text?.trim() || sale.orig_memo;
    if (!text?.trim()) {
      await saleRepo.updateAudioJob({ db }, {
        jobs_idno, data: { jobs_stat: "failed", fail_mess: "분석할 텍스트가 없습니다.", fini_date: new Date() },
      });
      await saleRepo.update({ db }, { comp_idno, owne_idno, sale_idno, data: { ai_status: "failed" as const } });
      return;
    }

    // LLM 호출
    const kstInfo = getKSTDateInfo(sale.vist_date);
    const systemPrompt = buildAnalysisPrompt(kstInfo);

    let llmResult: Awaited<ReturnType<typeof invokeLLM>>;
    try {
      llmResult = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });
    } catch (err) {
      await aiService.refundQuota(comp_idno, 1500);
      await saleRepo.updateAudioJob({ db }, {
        jobs_idno,
        data: { jobs_stat: "failed", fail_mess: err instanceof Error ? err.message : "LLM 호출 실패", fini_date: new Date() },
      });
      await saleRepo.update({ db }, { comp_idno, owne_idno, sale_idno, data: { ai_status: "failed" as const } });
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

    try {
      parsed = JSON.parse(contentStr) as typeof parsed;
    } catch {
      parsed = { summary: contentStr };
    }

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
    const sale_pric = typeof rawAmount === "number" && rawAmount > 0 ? rawAmount : null;

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
        ai_status: "completed" as const,
        ...(sale_pric !== null && !sale.sale_pric ? { sale_pric: String(sale_pric) } : {}),
        ...(primaryContact?.cont_name && !sale.cont_name ? { cont_name: primaryContact.cont_name } : {}),
        ...(primaryContact?.cont_role && !sale.cont_role ? { cont_role: primaryContact.cont_role } : {}),
        ...(primaryContact?.cont_tele && !sale.cont_tele ? { cont_tele: primaryContact.cont_tele } : {}),
        ...(primaryContact?.cont_mail && !sale.cont_mail ? { cont_mail: primaryContact.cont_mail } : {}),
      },
    });

    // 연결된 고객사 컨택 동기화
    if (sale.clie_idno && ai_contacts.length > 0) {
      await clientService.syncContacts(workerCtx, {
        clie_idno: Number(sale.clie_idno),
        contacts: ai_contacts,
      });
    }

    // 일정 자동 생성 (aiex_keys 중복 방지)
    let schedule_idno: number | null = null;
    for (const appt of (parsed.appointments ?? [])) {
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
        sche_name: appt.title ?? "AI 자동 일정",
        sche_desc: appt.desc ?? null,
        sche_pric: sale_pric !== null ? String(sale_pric) : null,
        sche_date: apptDate,
        stat_code: "scheduled" as const,
        actn_ownr,
        auto_gene: true,
        aiex_keys,
        enab_yesn: true,
      });
      const created = await saleRepo.createSchedule({ db }, schedData);
      if (schedule_idno === null) schedule_idno = created.sche_idno;
    }

    // 결과 payload → aiex_ext에 저장 (analyzeResult 엔드포인트에서 조회)
    const resultPayload = {
      summary,
      schedule_idno,
      ai_client_name,
      matched_client_idno,
      matched_client_name,
      ai_contacts,
      ai_contact_person: primaryContact?.cont_name ?? null,
      ai_contact_phone: primaryContact?.cont_tele ?? null,
      ai_contact_email: primaryContact?.cont_mail ?? null,
    };

    // 잡 → done
    await saleRepo.updateAudioJob({ db }, {
      jobs_idno,
      data: {
        jobs_stat: "done",
        aiex_sum: summary,
        aiex_ext: resultPayload,
        llmd_name: llmResult.model,
        fini_date: new Date(),
      },
    });

    // 사용량 기록
    const usage = llmResult.usage;
    await aiService.recordUsage(db, {
      comp_idno, user_idno: owne_idno, feat_code: "llm",
      mode_name: llmResult.model,
      tokn_inpt: usage?.prompt_tokens ?? 0,
      tokn_outs: usage?.completion_tokens ?? 0,
      meta_json: { sale_idno, jobs_idno },
    });
  },

  // #endregion

  // #region getAnalyzeJobResult

  /**
   * AI 분석 결과 조회 — 워커 완료 후 클라이언트가 polling으로 호출
   */
  async getAnalyzeJobResult(ctx: ServiceCtx, sale_idno: number) {
    const db = getDb();

    // 사용자 접근 권한 확인
    const isAdminOrOwner = ctx.company_role === "owner" || ctx.company_role === "admin";
    const sale = await saleRepo.getById({ db }, {
      comp_idno: ctx.comp_idno,
      owne_idno: isAdminOrOwner ? undefined : ctx.user_idno,
      sale_idno,
    });
    if (!sale) throwAppError({ tRPCCode: "NOT_FOUND", appCode: "SALE_NOT_FOUND", message: "영업일지를 찾을 수 없습니다.", displayType: "toast" });

    const ai_status = (sale.ai_status ?? "pending") as "pending" | "processing" | "completed" | "failed";

    const job = await saleRepo.getLatestDoneAnalyzeJob({ db }, { sale_idno, comp_idno: ctx.comp_idno });

    type ExtPayload = {
      summary?: string | null;
      schedule_idno?: number | null;
      ai_client_name?: string | null;
      matched_client_idno?: number | null;
      matched_client_name?: string | null;
      ai_contacts?: Array<{ cont_name: string; cont_role?: string | null; cont_tele?: string | null; cont_mail?: string | null }>;
      ai_contact_person?: string | null;
      ai_contact_phone?: string | null;
      ai_contact_email?: string | null;
    };

    const ext = job?.aiex_ext as ExtPayload | null;

    return {
      ai_status,
      jobs_stat: job?.jobs_stat ?? null,
      summary: ext?.summary ?? null,
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

  return `You are a CRM assistant for Korean B2B sales teams.
기준일(미팅일시, KST): ${baseDate} (${baseDayOfWeek}요일)

▶ 이번 주 달력 (요일→날짜 변환 시 반드시 이 표에서 직접 읽을 것 — 직접 계산 금지):
${thisWeekCalendar}

▶ 다음 주 달력 (직접 계산 금지):
${nextWeekCalendar}

Analyze the sales meeting note or voice transcript below, then return ONLY valid JSON (no markdown, no explanation).

## Output JSON schema
{
  "summary": "한 문단 요약 (Korean, 3-5 sentences). 핵심 논의 내용, 고객 요구사항, 협의 결과, 그리고 모든 후속 조치 항목(발송 요청, 확인 요청, 자료 준비 등)을 빠짐없이 포함하세요.",
  "appointments": [
    {
      "title": "행동 중심 제목 (Korean, 15자 이내)",
      "date": "ISO 8601 with +09:00 or null",
      "date_adjusted": false,
      "adjust_reason": "",
      "desc": "원문 맥락이 담긴 세부 내용 (Korean)",
      "action_owner": "self | client | shared"
    }
  ],
  "client_name": "고객사 공식 명칭 (법인명 또는 브랜드명). 개인명만 있고 회사명이 없으면 null.",
  "contacts": [
    {
      "name": "담당자 이름 (직책 포함 가능, e.g. '홍길동 부장')",
      "role": "실무담당 | 의사결정자 | 기타 (언급 없으면 null)",
      "phone": "전화번호 (e.g. '010-1234-5678') or null",
      "email": "이메일 주소 or null"
    }
  ],
  "pricing": {
    "primary": {
      "amount": null,
      "min": null,
      "max": null,
      "type": "one_time | monthly | yearly",
      "vat": "included | excluded | unknown",
      "approximate": false,
      "inferred": false
    },
    "alternatives": [],
    "final": null
  },
  "notes": "기타 특이사항 or empty string"
}

## Rules

### appointments rules
- Extract EVERY scheduled meeting, action item, task, and follow-up — not just the main appointment.
  - Meetings with specific date/time (e.g. "다음 주 화요일 10시 발표")
  - Tasks that must be done before a meeting (e.g. "발표 전에 견적서 미리 보내달라" → date = day before the meeting)
  - Open-ended tasks with no specific date (e.g. "확인 후 메일로 알려달라" → date = 기준일 +3일)
- appointments is [] (empty array) only if absolutely no action items exist.
- Each appointment.date MUST be a valid ISO 8601 string with +09:00, or null.
- Never return "null" as a string value for date — use JSON null.

### action_owner rules (REQUIRED for every appointment)
Determine who is responsible for performing the action:

- "self" — 우리(영업사원/우리 회사)가 수행해야 하는 작업
  - 자료 발송, 견적서 전달, 이메일/문자 회신, 확인 후 연락
  - 고객이 요청한 작업 중 우리가 이행해야 하는 것
  - 고객의 회신/결과를 기다리다가 추적해야 하는 팔로업
  - Examples: "견적서 발송", "데이터 이전 확인 메일", "고객 회신 확인", "내부 검토 결과 확인"

- "client" — 고객이 수행해야 하는 작업 (우리는 결과를 기다리는 입장)
  - 고객의 내부 결재, 내부 검토, 고객이 자료/연락을 보내주기로 한 것
  - Examples: "내부 결재 진행", "샘플 파일 전달", "고객 내부 검토"

- "shared" — 양측이 함께 참여하는 공동 활동
  - 미팅, 발표, 데모, 협의, 계약 체결
  - Examples: "기술 제안 미팅", "계약서 서명", "제품 데모"

### Title rules (CRITICAL)
- Titles MUST be action-oriented and clear. 15 characters or fewer.
- BAD: "우진테크와의 후속 회신", "삼성과 관련된 다음 단계"
- GOOD: "견적서 발송", "고객 회신 확인", "내부 검토 결과 확인", "제안 미팅"
- For client-owned tasks that we need to track: use "확인" or "대기" suffix
  - "내부 검토 후 연락 주겠다" → title: "내부 검토 결과 확인" (action_owner: "self")
  - "결재 후 진행하겠다" → title: "결재 완료 확인" (action_owner: "self")
- For our own tasks: use direct action verbs
  - "자료 보내드리겠습니다" → title: "기능 소개 자료 발송" (action_owner: "self")

### desc rules
- desc must preserve the original context and nuance from the meeting note.
- Include who said what, and what the specific expectation is.
- Example: "우진테크 최 부장이 내부 검토 후 이번 달 말까지 회신 예정"

### Date rules (CRITICAL — follow every step in order)

**Step 1 — 기준일 확인**
기준일(미팅일시): ${baseDate} (${baseDayOfWeek}요일)
모든 상대적 날짜 표현은 이 기준일로부터 계산합니다.

- "이번 주"는 기준일이 속한 주(월요일~일요일)를 의미한다.
- 기준일이 일요일(주의 마지막 날)이더라도 "이번 주"는 그 주의 월~일이며, 절대 다음 주로 이동하지 않는다.
- ▶ 이번 주 달력이 서버에서 이미 정확하게 계산되어 있다. "이번 주 {요일}"은 반드시 그 표의 날짜를 그대로 사용한다.

**Step 2 — 요일 → 날짜 변환 (반드시 위 ▶ 달력 표에서 직접 읽을 것 — 직접 계산 절대 금지)**
- "이번 주 {요일}" → ▶ 이번 주 달력 표의 날짜를 그대로 사용. 기준일이 일요일이어도 동일하게 적용한다.
- "다음 주 {요일}" → ▶ 다음 주 달력 표의 날짜를 그대로 사용.
- 요일만 언급("금요일까지", "이번 주"/"다음 주" 없이):
  - 기준일 이후 요일이면 → 이번 주 달력 표 사용
  - 기준일 이전 요일이면 → 다음 주 달력 표 사용
  - 기준일이 일요일인 경우, 월~토 전부가 기준일 이전이므로 모두 다음 주로 해석

**Step 2-B — 날짜 숫자 vs 요일 텍스트 충돌 (ABSOLUTE RULE)**
- "3월 10일 화요일"처럼 날짜 숫자와 요일 텍스트가 동시에 있으면 날짜 숫자(3월 10일)만 신뢰한다.
- 요일 텍스트("화요일")가 실제 요일과 다르더라도 무시하고 날짜 숫자를 사용한다.
- 이 규칙은 어떤 경우에도 예외 없이 적용된다.

**Step 3 — 주/월 단위 표현**
- "다음 주 월요일" → ${nextWeek["월"]}
- "다음 주 화요일" → ${nextWeek["화"]}
- "다음 주 수요일" → ${nextWeek["수"]}
- "다음 주 목요일" → ${nextWeek["목"]}
- "다음 주 금요일" → ${nextWeek["금"]}
- "다음 주 토요일" → ${nextWeek["토"]}
- "다음 주 일요일" → ${nextWeek["일"]}
- "이번 달 말" → last day of ${baseDate.slice(0, 7)}
- "다음 달 15일" → 15th of next month
- "상반기" → ${baseDate.slice(0, 4)}-06-30
- "하반기" → ${baseDate.slice(0, 4)}-12-31
- "오늘", "금일" → ${baseDate}
- "내일" → 기준일 +1일

**Step 4 — 주말 처리 (하이브리드, MANDATORY)**

[A] 사용자가 "토요일" 또는 "일요일"을 명시한 경우 → 보정 금지, 그대로 사용
  - 예: "이번 주 토요일 오전 미팅" → ${thisWeek["토"]}T09:00:00+09:00
  - date_adjusted: false, adjust_reason: ""

[B] "주말까지", "이번 주말까지", "주말에" 같은 암묵적 표현인 경우:
  - task (마감/발송/제출/응답/전달):
    → date: ${nextWeek["월"]}T09:00:00+09:00 (다음 영업일 월요일 09:00)
    → date_adjusted: true
    → adjust_reason: "'주말까지' 암묵적 표현 — task이므로 다음 영업일(월)로 이동"
  - event (미팅/방문/데모/발표/회의):
    → date: null
    → date_adjusted: true
    → adjust_reason: "'주말까지' 암묵적 표현 — event 날짜 불명확, 확인 필요"

[C] 보정이 발생한 경우 반드시 date_adjusted: true, adjust_reason에 이유를 기재한다.
    보정이 없으면 date_adjusted: false, adjust_reason: "" 로 설정한다.

**Step 5 — 시각 기본값 (예외 없음)**
- 시각이 명시되지 않은 경우 → 09:00+09:00
- "오전", "오전까지", "오전 중" → 09:00+09:00
- "오후", "오후에" → 14:00+09:00
- 구체적 시각("10시", "오전 10시") → 해당 시각 그대로 사용
- "발표 전에 보내달라" → 해당 발표일 전날 09:00+09:00

**Step 6 — 열린 요청 & 날짜 불확실**
- "확인 후 알려달라", "검토 후 연락" → 기준일(${baseDate}) +3일 09:00+09:00
- 날짜를 특정할 수 없으면 date: null (문자열 "null" 금지, JSON null 사용)

### Pricing rules (CRITICAL — 단일 숫자 저장 금지)

금액은 반드시 pricing 객체로 구조화한다. 단일 숫자 저장은 절대 금지한다.

#### KRW 단위 변환 (정수, 소수점 없음)
- 1억 = 100,000,000 / 1천만 = 10,000,000 / 1백만 = 1,000,000
- "5천만원" → 50000000 / "2억5천만원" → 250000000 / "500만원" → 5000000

#### type 결정 규칙
- "월", "월간", "/월", "개월당", "매월" → "monthly"
- "연", "연간", "/년", "연도별", "매년" → "yearly"
- "건당", "회당", "총액", "프로젝트" 또는 단위 없음 → "one_time"

#### amount vs min/max
- 정확한 금액 → amount에 정수, min/max: null, approximate: false
- "80~120만원", "1천만 전후", "약 5백만원" 같은 범위/근사값 → amount: null, min/max 분리, approximate: true

#### vat 결정 규칙
- "VAT 별도", "부가세 별도", "세금 별도" → "excluded"
- "VAT 포함", "부가세 포함", "세금 포함" → "included"
- 언급 없음 → "unknown"

#### 여러 금액 구분
- 처음 제안된 금액 → primary
- 협상 과정의 대안가 → alternatives 배열에 추가, label에 맥락 기재 (예: "2차 제안가", "할인 제안")
- 최종 합의된 금액 → final (합의 없으면 null)
- alternatives가 없으면 빈 배열 []

#### 단위 추론 (inferred)
- "1,000만원을 제안했고 협상하면 650까지 가능" → 650은 650만원으로 추론
- 추론한 경우 inferred: true, 명시된 경우 inferred: false

#### 금액 언급 없음
- pricing: null

### contacts rules (CRITICAL — replaces old contact_person/phone/email)
- Extract ALL distinct persons mentioned in the meeting. Each person = one entry.
- Different name OR different role = different person. Do NOT merge.
- role values: "실무담당" (day-to-day contact), "의사결정자" (approver/decision maker), or null if unclear.
- Examples:
  - "정유진 대리 (실무 담당)" → { name: "정유진 대리", role: "실무담당" }
  - "김태훈 팀장 (결재권자)" → { name: "김태훈 팀장", role: "의사결정자" }
- contacts is [] if no person is mentioned.
- Preserve phone/email only if explicitly stated.

### Appointment deduplication rules (CRITICAL)
- DO NOT create multiple appointments for the same underlying action.
- Before adding an appointment, check if a similar one already exists in the list.
- "Similar" means: same type of action (e.g., sending documents) targeting the same recipient.
  - BAD: ["견적서 발송", "기능 소개 자료 발송"] when it's clearly one combined delivery task
  - GOOD: ["자료 패키지 발송"] with desc listing all items (견적서 + 기능 소개 자료)
- If truly different actions (different date, different purpose), keep them separate.
- When in doubt, merge into ONE with a broader title.

### Client name rules
- Extract the official company name (공식 법인명 또는 브랜드명).
- If both brand and legal entity are mentioned (e.g. "삼성전자 구매팀"), use the company name: "삼성전자".
- If only a person's name is mentioned without a company, return null.
- Exclude generic terms like "사장님 회사", "거래처".

## Example
Input:
"""
삼성전자 구매팀 방문.
실무 담당 정유진 대리, 결재권자 김태훈 팀장과 클라우드 인프라 구축 프로젝트 논의.
약 5천만원 규모. 다음 주 화요일 오전 10시 기술 제안서 발표 예정.
발표 전에 견적서와 사양서 미리 보내달라고 하셨음. 기능 소개 자료도 함께.
기존 장비 데이터 이전 가능한지 확인해서 메일로 알려달라고 하심.
내부 검토 후 이번 주 금요일까지 회신 주겠다고 하셨음.
"""

Output:
{
  "summary": "삼성전자 구매팀 정유진 대리·김태훈 팀장과 클라우드 인프라 구축 프로젝트(약 5천만원 규모)를 논의하였습니다. 다음 주 화요일 오전 10시 기술 제안서 발표가 예정되어 있으며, 발표 전까지 견적서·사양서·기능 소개 자료를 발송해야 합니다. 기존 장비 데이터 이전 가능 여부를 확인하여 메일로 회신하기로 하였습니다. 삼성전자 측은 내부 검토 후 이번 주 금요일까지 회신 예정입니다.",
  "appointments": [
    {
      "title": "기술 제안 발표",
      "date": "2026-03-10T10:00:00+09:00",
      "date_adjusted": false,
      "adjust_reason": "",
      "desc": "삼성전자 구매팀 대상 클라우드 인프라 구축 기술 제안서 발표",
      "action_owner": "shared"
    },
    {
      "title": "자료 패키지 발송",
      "date": "2026-03-09T09:00:00+09:00",
      "date_adjusted": false,
      "adjust_reason": "",
      "desc": "발표(3월 10일) 전 견적서·사양서·기능 소개 자료 일괄 발송 — 정유진 대리 요청",
      "action_owner": "self"
    },
    {
      "title": "데이터 이전 확인 메일",
      "date": "2026-03-06T09:00:00+09:00",
      "date_adjusted": false,
      "adjust_reason": "",
      "desc": "기존 장비 데이터 이전 가능 여부 내부 확인 후 메일 회신",
      "action_owner": "self"
    },
    {
      "title": "고객 회신 확인",
      "date": "2026-03-06T09:00:00+09:00",
      "date_adjusted": false,
      "adjust_reason": "",
      "desc": "삼성전자가 이번 주 금요일(3/6)까지 내부 검토 결과 회신 예정 — 미수신 시 팔로업",
      "action_owner": "self"
    }
  ],
  "client_name": "삼성전자",
  "contacts": [
    { "name": "정유진 대리", "role": "실무담당", "phone": null, "email": null },
    { "name": "김태훈 팀장", "role": "의사결정자", "phone": null, "email": null }
  ],
  "pricing": {
    "primary": {
      "amount": 50000000,
      "min": null,
      "max": null,
      "type": "one_time",
      "vat": "unknown",
      "approximate": true,
      "inferred": false
    },
    "alternatives": [],
    "final": null
  },
  "notes": ""
}`;
}

// #endregion