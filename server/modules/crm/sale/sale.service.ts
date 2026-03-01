// server/modules/crm/sale/sale.service.ts

import { TRPCError } from "@trpc/server";

import type { ServiceCtx } from "../../../core/serviceCtx";
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

// Helpers
function parseDateOrThrow(v: string | number, errMsg: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new TRPCError({ code: "BAD_REQUEST", message: errMsg });
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

export const saleService = {
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

    const rows = await saleRepo.list(
      { db },
      {
        comp_idno: ctx.comp_idno,
        owne_idno: ctx.user_idno,
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
        sale_loca: r.sale_loca ?? null,
        vist_date: toIso(r.vist_date),
        orig_memo: String(r.orig_memo),
        aiex_done: !!r.aiex_done,
        aiex_summ: r.aiex_summ ?? null,
      })),
      page: { limit: page.limit, offset: page.offset, hasMore },
    };
  },

  async getSale(ctx: ServiceCtx, sale_idno: number) {
    const db = getDb();

    const sale = await saleRepo.getById({ db }, { comp_idno: ctx.comp_idno, owne_idno: ctx.user_idno, sale_idno });
    if (!sale) return null;

    const attachments = await saleRepo.listAttachments({ db }, { comp_idno: ctx.comp_idno, sale_idno });

    // 연결된 고객사의 공식 연락처 조회
    // 우선: CRM_CLIENT_CONT main_yesn=true 담당자 / fallback: CRM_CLIENT.cont_* 캐시
    let client_contact: { cont_name: string | null; cont_tele: string | null; cont_mail: string | null; clie_addr: string | null } | null = null;
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

    return {
      sale: {
        sale_idno: Number(sale.sale_idno),
        clie_idno: sale.clie_idno == null ? null : Number(sale.clie_idno),
        clie_name: sale.clie_name ?? null,
        cont_name: sale.cont_name ?? null,
        sale_loca: sale.sale_loca ?? null,
        vist_date: toIso(sale.vist_date),
        sale_pric: sale.sale_pric ?? null,
        orig_memo: String(sale.orig_memo),
        audi_addr: sale.audi_addr ?? null,
        sttx_text: sale.sttx_text ?? null,
        aiex_done: !!sale.aiex_done,
        aiex_summ: sale.aiex_summ ?? null,
      },
      client_contact,
      attachments,
    };
  },

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

      audi_addr: input.audi_addr ?? null,
      sttx_text: input.sttx_text ?? null,

      aiex_done: false,
      aiex_summ: null,
      aiex_text: null,

      enab_yesn: true,
    };

    const data = withCreateAudit(ctx, base);
    const { sale_idno } = await saleRepo.create({ db }, data as InsertSale);

    // ✅ attachments 연결
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

  async updateSale(ctx: ServiceCtx, sale_idno: number, patch: SaleUpdatePayload) {
    const db = getDb();

    const { vist_date: rawDate, ...restPatch } = patch;
    const data: Partial<InsertSale> = restPatch as Partial<InsertSale>;
    if (rawDate !== undefined) {
      // null이면 컬럼 미변경(undefined), 유효한 날짜(이미 Zod 검증 통과)면 Date로 변환
      data.vist_date = rawDate === null
        ? undefined
        : parseDateOrThrow(rawDate, "vist_date가 올바른 날짜 형식이 아닙니다.");
    }

    const audited = withUpdateAudit(ctx, data);
    await saleRepo.update({ db }, { comp_idno: ctx.comp_idno, owne_idno: ctx.user_idno, sale_idno, data: audited });

    return { success: true as const };
  },

  // ✅ soft delete
  async deleteSale(ctx: ServiceCtx, sale_idno: number) {
    const db = getDb();

    const patch = withUpdateAudit(ctx, { enab_yesn: false });
    await saleRepo.remove({ db }, { comp_idno: ctx.comp_idno, owne_idno: ctx.user_idno, sale_idno, data: patch });

    return { success: true as const };
  },

  async transcribe(ctx: ServiceCtx, input: { sale_idno: number; file_idno: number; language?: string }) {
    const db = getDb();

    // 기존 job 있으면 재실행하지 않고 재사용 (running/done 상태면 return)
    const exists = await saleRepo.getAudioJobByRef(
      { db },
      { comp_idno: ctx.comp_idno, sale_idno: input.sale_idno, file_idno: input.file_idno }
    );

    let jobs_idno: number;
    if (exists) {
      jobs_idno = Number(exists.jobs_idno);
      // 이미 완료된 경우
      if (exists.jobs_stat === "done") {
        return { jobs_idno, jobs_stat: "done" as const, sttx_text: exists.sttx_text ?? null };
      }
    } else {
      const jobBase: AudioJobBase = {
        comp_idno: ctx.comp_idno,
        sale_idno: input.sale_idno,
        file_idno: input.file_idno,
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
      jobs_idno = created.jobs_idno;
    }

    // running 상태로 전환
    await saleRepo.updateAudioJob({ db }, { jobs_idno, data: { jobs_stat: "running" } });

    // 파일 메타 조회
    const fileRow = await aiRepo.findFileById({ db }, input.file_idno);
    if (!fileRow) {
      await saleRepo.updateAudioJob({ db }, {
        jobs_idno,
        data: { jobs_stat: "failed", fail_mess: "파일을 찾을 수 없습니다.", fini_date: new Date() },
      });
      throw new TRPCError({ code: "NOT_FOUND", message: "파일을 찾을 수 없습니다." });
    }

    // 쿼터 확인 (dura_secs * 10, 없으면 1000 flat)
    const estimate = (fileRow.dura_secs ?? 100) * 10;
    await aiService.checkQuota(ctx.comp_idno, estimate);

    // R2에서 Buffer 다운로드
    let buffer: Buffer;
    let contentType: string;
    try {
      const result = await storageGetBuffer(fileRow.file_path);
      buffer = result.buffer;
      contentType = fileRow.mime_type ?? result.contentType;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "스토리지 다운로드 실패";
      await saleRepo.updateAudioJob({ db }, {
        jobs_idno,
        data: { jobs_stat: "failed", fail_mess: msg, fini_date: new Date() },
      });
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `오디오 파일 다운로드 실패: ${msg}` });
    }

    // STT 호출
    const sttResult = await transcribeBuffer(buffer, contentType, { language: input.language });

    if ("error" in sttResult) {
      await saleRepo.updateAudioJob({ db }, {
        jobs_idno,
        data: { jobs_stat: "failed", fail_mess: sttResult.error, fini_date: new Date() },
      });
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `음성 전사 실패: ${sttResult.error}` });
    }

    const sttx_text = sttResult.text;

    // CRM_SALE sttx_text 갱신
    await saleRepo.update({ db }, {
      comp_idno: ctx.comp_idno,
      owne_idno: ctx.user_idno,
      sale_idno: input.sale_idno,
      data: { sttx_text },
    });

    // job done
    await saleRepo.updateAudioJob({ db }, {
      jobs_idno,
      data: {
        jobs_stat: "done",
        sttx_text,
        sttx_name: "whisper",
        fini_date: new Date(),
      },
    });

    // 사용량 기록
    const actualTokens = estimate;
    await aiService.recordUsage(db, {
      comp_idno: ctx.comp_idno,
      user_idno: ctx.user_idno,
      feat_code: "stt",
      mode_name: "whisper",
      tokn_inpt: 0,
      tokn_outs: actualTokens,
      meta_json: { file_idno: input.file_idno, dura_secs: fileRow.dura_secs },
    });

    return { jobs_idno, jobs_stat: "done" as const, sttx_text };
  },

  async analyzeSale(ctx: ServiceCtx, sale_idno: number, file_idno?: number) {
    const db = getDb();

    const sale = await saleRepo.getById({ db }, {
      comp_idno: ctx.comp_idno,
      owne_idno: ctx.user_idno,
      sale_idno,
    });
    if (!sale) {
      throw new TRPCError({ code: "NOT_FOUND", message: "영업일지를 찾을 수 없습니다." });
    }

    const text = sale.sttx_text ?? sale.orig_memo;
    if (!text?.trim()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "분석할 텍스트가 없습니다. 먼저 음성을 전사해주세요.",
      });
    }

    // 파일 ID 결정
    let targetFileId = file_idno;
    if (!targetFileId) {
      const atts = await saleRepo.listAttachments({ db }, { comp_idno: ctx.comp_idno, sale_idno });
      targetFileId = atts[0]?.file_idno;
    }

    // job 생성 또는 재사용
    let jobs_idno: number;
    if (targetFileId) {
      const exists = await saleRepo.getAudioJobByRef(
        { db },
        { comp_idno: ctx.comp_idno, sale_idno, file_idno: targetFileId }
      );
      if (exists) {
        jobs_idno = Number(exists.jobs_idno);
      } else {
        const jobBase: AudioJobBase = {
          comp_idno: ctx.comp_idno,
          sale_idno,
          file_idno: targetFileId,
          jobs_stat: "queued",
          fail_mess: null,
          sttx_text: null,
          aiex_sum: null,
          aiex_ext: null,
          sttx_name: null,
          llmd_name: null,
          meta_json: { task: "analyze" },
          reqe_date: new Date(),
          fini_date: null,
        };
        const job = withCreateAudit(ctx, jobBase) as InsertSaleAudioJob;
        const created = await saleRepo.createAudioJob({ db }, job);
        jobs_idno = created.jobs_idno;
      }
    } else {
      // 파일 없이 텍스트만으로 분석 — file_idno는 null로 설정
      const jobBase: AudioJobBase = {
        comp_idno: ctx.comp_idno,
        sale_idno,
        file_idno: null,
        jobs_stat: "queued",
        fail_mess: null,
        sttx_text: null,
        aiex_sum: null,
        aiex_ext: null,
        sttx_name: null,
        llmd_name: null,
        meta_json: { task: "analyze_text" },
        reqe_date: new Date(),
        fini_date: null,
      };
      const job = withCreateAudit(ctx, jobBase) as InsertSaleAudioJob;
      const created = await saleRepo.createAudioJob({ db }, job);
      jobs_idno = created.jobs_idno;
    }

    await saleRepo.updateAudioJob({ db }, { jobs_idno, data: { jobs_stat: "running" } });

    // 쿼터 확인 (LLM 예상 1500 토큰)
    await aiService.checkQuota(ctx.comp_idno, 1500);

    // LLM 호출 (temperature=0.1: 구조화 추출에 낮은 온도 → 일관성 향상)
    const systemPrompt = buildAnalysisPrompt(getTodayKST());
    const llmResult = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const rawContent = llmResult.choices[0]?.message?.content;
    const contentStr = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent ?? {});

    let parsed: {
      summary?: string;
      appointments?: Array<{
        title?: string;
        date?: string | null;
        desc?: string;
        action_owner?: "self" | "client" | "shared";
      }> | null;
      client_name?: string | null;
      contacts?: Array<{
        name: string;
        role?: string | null;
        phone?: string | null;
        email?: string | null;
      }> | null;
      amount?: number | null;
      notes?: string;
    } = {};
    try {
      parsed = JSON.parse(contentStr) as typeof parsed;
    } catch {
      // JSON 파싱 실패 시 summary만 그대로
      parsed = { summary: contentStr };
    }

    const summary = parsed.summary ?? "";

    // AI 추출 고객사명 (클라이언트가 사용자 확인 후 처리 — 서버에서 자동 연결하지 않음)
    const ai_client_name = parsed.client_name ?? null;
    let matched_client_idno: number | null = null;
    let matched_client_name: string | null = null;

    if (ai_client_name && !sale.clie_idno) {
      // DB 퍼지 매칭 결과만 반환 — 사용자 확인 없이 자동으로 sale.clie_idno 업데이트하지 않음
      const matched = await clientService.findBestClientMatch(ctx, { name: ai_client_name });
      if (matched) {
        matched_client_idno = matched.clie_idno;
        matched_client_name = matched.clie_name;
      }
    }

    // AI 추출 금액
    const sale_pric = typeof parsed.amount === "number" && parsed.amount > 0 ? parsed.amount : null;

    // AI 추출 담당자 목록 정규화
    const ai_contacts = (parsed.contacts ?? [])
      .map((c) => ({
        cont_name: c.name?.trim() ?? "",
        cont_role: c.role?.trim() || null,
        cont_tele: c.phone?.trim() || null,
        cont_mail: c.email?.trim() || null,
      }))
      .filter((c) => c.cont_name.length > 0);

    // 대표 담당자 (첫 번째 또는 실무담당): CRM_SALE.cont_name에 반영
    const primaryContact = ai_contacts[0] ?? null;
    const contact_person = primaryContact?.cont_name ?? null;

    // CRM_SALE 갱신 (AI 분석 결과 + 금액 + 대표 담당자 — 고객사 연결은 클라이언트에서 사용자 확인 후 처리)
    await saleRepo.update({ db }, {
      comp_idno: ctx.comp_idno,
      owne_idno: ctx.user_idno,
      sale_idno,
      data: {
        aiex_done: true,
        aiex_summ: summary,
        aiex_text: parsed as Record<string, unknown>,
        // 기존 금액이 없을 때만 AI 추출 금액 반영 (사용자 수동 입력 우선)
        ...(sale_pric !== null && !sale.sale_pric ? { sale_pric: String(sale_pric) } : {}),
        // 기존 담당자명이 없을 때만 AI 추출 대표 담당자명 반영
        ...(contact_person && !sale.cont_name ? { cont_name: contact_person } : {}),
      },
    });

    // 연결된 고객사가 있으면 전체 담당자 목록 동기화 (CRM_CLIENT_CONT upsert)
    if (sale.clie_idno && ai_contacts.length > 0) {
      await clientService.syncContacts(ctx, {
        clie_idno: Number(sale.clie_idno),
        contacts: ai_contacts,
      });
    }

    // 일정 자동 생성 (appointments 배열 → 각각 CRM_SCHEDULE 행 생성)
    let schedule_idno: number | null = null;
    const appointments = parsed.appointments ?? [];
    for (const appt of appointments) {
      if (!appt.date) continue; // 날짜 없는 항목은 건너뜀
      const apptDate = new Date(appt.date);
      if (Number.isNaN(apptDate.getTime())) continue;
      const actn_ownr = appt.action_owner ?? "self";
      const schedData = withCreateAudit(ctx, {
        comp_idno: ctx.comp_idno,
        owne_idno: ctx.user_idno,
        sale_idno,
        clie_idno: sale.clie_idno ?? null,
        clie_name: (parsed.client_name ?? sale.clie_name) ?? null,
        sche_name: appt.title ?? "AI 자동 일정",
        sche_desc: appt.desc ?? null,
        sche_pric: sale_pric !== null ? String(sale_pric) : null,
        sche_date: apptDate,
        stat_code: "scheduled" as const,
        actn_ownr,
        auto_gene: true,
        enab_yesn: true,
      });
      const created = await saleRepo.createSchedule({ db }, schedData);
      // 첫 번째 일정 ID를 반환 (클라이언트 토스트용)
      if (schedule_idno === null) schedule_idno = created.sche_idno;
    }

    // 사용량 기록
    const usage = llmResult.usage;
    const tokn_inpt = usage?.prompt_tokens ?? 0;
    const tokn_outs = usage?.completion_tokens ?? 0;
    await aiService.recordUsage(db, {
      comp_idno: ctx.comp_idno,
      user_idno: ctx.user_idno,
      feat_code: "llm",
      mode_name: llmResult.model,
      tokn_inpt,
      tokn_outs,
      meta_json: { sale_idno },
    });

    // job done
    await saleRepo.updateAudioJob({ db }, {
      jobs_idno,
      data: {
        jobs_stat: "done",
        aiex_sum: summary,
        llmd_name: llmResult.model,
        fini_date: new Date(),
      },
    });

    return {
      jobs_idno,
      jobs_stat: "done" as const,
      summary,
      schedule_idno,
      ai_client_name,
      matched_client_idno,
      matched_client_name,
      ai_contacts,
      // 하위 호환 단일 필드 (첫 번째 담당자)
      ai_contact_person: primaryContact?.cont_name ?? null,
      ai_contact_phone: primaryContact?.cont_tele ?? null,
      ai_contact_email: primaryContact?.cont_mail ?? null,
    };
  },
} as const;

// ─── LLM 분석 프롬프트 ───────────────────────────────────────────────────────

function getTodayKST(): string {
  // KST = UTC+9
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10); // YYYY-MM-DD
}

function buildAnalysisPrompt(today: string): string {
  return `You are a CRM assistant for Korean B2B sales teams.
Today (KST): ${today}

Analyze the sales meeting note or voice transcript below, then return ONLY valid JSON (no markdown, no explanation).

## Output JSON schema
{
  "summary": "한 문단 요약 (Korean, 3-5 sentences). 핵심 논의 내용, 고객 요구사항, 협의 결과, 그리고 모든 후속 조치 항목(발송 요청, 확인 요청, 자료 준비 등)을 빠짐없이 포함하세요.",
  "appointments": [
    {
      "title": "행동 중심 제목 (Korean, 15자 이내)",
      "date": "ISO 8601 with +09:00 (날짜를 추론할 수 없으면 null)",
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
  "amount": integer in KRW or null,
  "notes": "기타 특이사항 or empty string"
}

## Rules

### appointments rules
- Extract EVERY scheduled meeting, action item, task, and follow-up — not just the main appointment.
  - Meetings with specific date/time (e.g. "다음 주 화요일 10시 발표")
  - Tasks that must be done before a meeting (e.g. "발표 전에 견적서 미리 보내달라" → date = day before the meeting)
  - Open-ended tasks with no specific date (e.g. "확인 후 메일로 알려달라" → date = 3 days from today)
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

### Date rules
- Convert relative dates to absolute ISO 8601 with +09:00 timezone using today's date (${today}).
- "다음 주 화요일" → calculate next Tuesday from ${today}.
- "이번 달 말" → last day of the current month.
- "다음 달 15일" → 15th of next month.
- "상반기" → June 30 of the current year.
- "하반기" → December 31 of the current year.
- If no specific time is mentioned, use 09:00:00+09:00 as default time.
- "발표 전에 보내달라" → date = day before the referenced appointment at 09:00+09:00.
- "확인 후 알려달라", "검토 후 연락" (open-ended) → date = ${today} + 3 days at 09:00+09:00.

### Amount rules (KRW integer only)
- "5천만원" or "5,000만원" → 50000000
- "2억5천만원" → 250000000
- "1억" → 100000000
- "3억" → 300000000
- "1천만원" or "1,000만원" → 10000000
- "500만원" or "5백만원" → 5000000
- 단위 변환: 1억 = 100,000,000 / 1천만 = 10,000,000 / 1백만 = 1,000,000
- amount is null if no monetary value is mentioned.

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
      "desc": "삼성전자 구매팀 대상 클라우드 인프라 구축 기술 제안서 발표",
      "action_owner": "shared"
    },
    {
      "title": "자료 패키지 발송",
      "date": "2026-03-09T09:00:00+09:00",
      "desc": "발표(3월 10일) 전 견적서·사양서·기능 소개 자료 일괄 발송 — 정유진 대리 요청",
      "action_owner": "self"
    },
    {
      "title": "데이터 이전 확인 메일",
      "date": "2026-03-06T09:00:00+09:00",
      "desc": "기존 장비 데이터 이전 가능 여부 내부 확인 후 메일 회신",
      "action_owner": "self"
    },
    {
      "title": "고객 회신 확인",
      "date": "2026-03-07T09:00:00+09:00",
      "desc": "삼성전자 내부 검토 결과 금요일까지 회신 예정 — 미수신 시 팔로업",
      "action_owner": "self"
    }
  ],
  "client_name": "삼성전자",
  "contacts": [
    { "name": "정유진 대리", "role": "실무담당", "phone": null, "email": null },
    { "name": "김태훈 팀장", "role": "의사결정자", "phone": null, "email": null }
  ],
  "amount": 50000000,
  "notes": ""
}`;
}