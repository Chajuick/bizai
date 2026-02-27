// server/modules/crm/sale/sale.service.ts

import { TRPCError } from "@trpc/server";

import type { ServiceCtx } from "../../../core/serviceCtx";
import { getDb } from "../../../core/db";

import { withCreateAudit, withUpdateAudit } from "../shared/audit";
import { normalizePage } from "../shared/pagination";

import { saleRepo } from "./sale.repo";
import type { SaleCreatePayload, SaleUpdatePayload } from "./sale.dto";

import { CRM_SALE_AUDIO_JOB } from "../../../../drizzle/schema";
import { fileLinkService } from "../file/fileLink.service";

// Helpers
function parseDateOrThrow(iso: string, errMsg: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new TRPCError({ code: "BAD_REQUEST", message: errMsg });
  return d;
}
function toIso(v: unknown): string {
  const d = v instanceof Date ? v : new Date(v as any);
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

    return {
      sale: {
        sale_idno: Number(sale.sale_idno),
        clie_idno: sale.clie_idno == null ? null : Number(sale.clie_idno),
        clie_name: sale.clie_name ?? null,
        cont_name: sale.cont_name ?? null,
        sale_loca: sale.sale_loca ?? null,
        vist_date: toIso(sale.vist_date),
        orig_memo: String(sale.orig_memo),
        audi_addr: sale.audi_addr ?? null,
        sttx_text: sale.sttx_text ?? null,
        aiex_done: !!sale.aiex_done,
        aiex_summ: sale.aiex_summ ?? null,
      },
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
    const { sale_idno } = await saleRepo.create({ db }, data as any);

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

    // ✅ Insert 타입에 맞춰 Date로 변환
    const data: Record<string, any> = { ...patch };
    if (patch.vist_date != null) {
      if (patch.vist_date === "") data.vist_date = null; // 혹시 프론트가 "" 보낼 경우 방어
      else data.vist_date = parseDateOrThrow(patch.vist_date, "vist_date가 올바른 날짜 형식이 아닙니다.");
    }

    const audited = withUpdateAudit(ctx, data);
    await saleRepo.update({ db }, { comp_idno: ctx.comp_idno, owne_idno: ctx.user_idno, sale_idno, data: audited as any });

    return { success: true as const };
  },

  // ✅ soft delete
  async deleteSale(ctx: ServiceCtx, sale_idno: number) {
    const db = getDb();

    const patch = withUpdateAudit(ctx, { enab_yesn: false });
    await saleRepo.remove({ db }, { comp_idno: ctx.comp_idno, owne_idno: ctx.user_idno, sale_idno, data: patch as any });

    return { success: true as const };
  },

  async transcribe(ctx: ServiceCtx, input: { sale_idno: number; file_idno: number; language?: string }) {
    const db = getDb();

    const exists = await saleRepo.getAudioJobByRef(
      { db },
      { comp_idno: ctx.comp_idno, sale_idno: input.sale_idno, file_idno: input.file_idno }
    );
    if (exists) return { jobs_idno: Number(exists.jobs_idno), jobs_stat: exists.jobs_stat ?? "queued" };

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
    const { jobs_idno } = await saleRepo.createAudioJob({ db }, job);
    return { jobs_idno, jobs_stat: "queued" as const };
  },

  async analyzeSale(ctx: ServiceCtx, sale_idno: number, file_idno?: number) {
    const db = getDb();

    let targetFileId = file_idno;

    if (!targetFileId) {
      const atts = await saleRepo.listAttachments({ db }, { comp_idno: ctx.comp_idno, sale_idno });
      targetFileId = atts[0]?.file_idno;
    }

    if (!targetFileId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "분석할 파일이 없습니다. 먼저 음성 파일을 업로드/연결하세요.",
      });
    }

    const exists = await saleRepo.getAudioJobByRef(
      { db },
      { comp_idno: ctx.comp_idno, sale_idno, file_idno: targetFileId }
    );
    if (exists) return { jobs_idno: Number(exists.jobs_idno), jobs_stat: exists.jobs_stat ?? "queued" };

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
    const { jobs_idno } = await saleRepo.createAudioJob({ db }, job);
    return { jobs_idno, jobs_stat: "queued" as const };
  },
} as const;