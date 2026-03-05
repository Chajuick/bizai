// server/modules/crm/file/file.service.ts

// #region Imports
import { TRPCError } from "@trpc/server";

import type { ServiceCtx } from "../../../core/serviceCtx";
import { getDb } from "../../../core/db";

import type {
  ConfirmUploadInput,
  PrepareUploadInput,
  ListByRefInput,
  PrepareUploadOutput,
  ConfirmUploadOutput,
  ListByRefOutput,
  TranscribeFileInput,
  TranscribeFileOutput,
} from "./file.dto";

import { fileRepo } from "./file.repo";
import { fileLinkService } from "./fileLink.service";

import { buildFilePath, getExt } from "../shared/fileKey";
import { normalizePage } from "../shared/pagination";
import { storageGetBuffer, storageGetPutUrl, storageDelete } from "../../../storage";
import { transcribeBuffer } from "../../../core/ai/voiceTranscription";
// #endregion

// #region Service
export const fileService = {
  // #region prepareUpload
  async prepareUpload(ctx: ServiceCtx, input: PrepareUploadInput): Promise<PrepareUploadOutput> {
    const file_path = buildFilePath({
      comp_idno: ctx.comp_idno,
      user_idno: ctx.user_idno,
      file_name: input.file_name,
    });

    const { upload_url } = await storageGetPutUrl(file_path, input.mime_type);

    return { file_path, upload_url };
  },
  // #endregion

  // #region confirmUpload
  async confirmUpload(ctx: ServiceCtx, input: ConfirmUploadInput): Promise<ConfirmUploadOutput> {
    const db = getDb();

    const { file_idno } = await fileRepo.insertCoreFile(
      { db },
      {
        comp_idno: ctx.comp_idno,
        upld_idno: ctx.user_idno,

        file_name: input.file_name,
        file_extn: getExt(input.file_name),
        mime_type: input.mime_type ?? null,
        file_size: input.file_size ?? null,
        file_hash: input.file_hash ?? null,

        stor_drve: input.stor_drve ?? null,
        file_path: input.file_path,
        file_addr: input.file_addr ?? null,

        dura_secs: input.dura_secs ?? null,

        // soft delete flags (schema default가 있어도 명시 OK)
        dele_yesn: 0,
        dele_date: null,
        drop_date: null,

        // audit
        crea_idno: ctx.user_idno,
        // crea_date는 DB defaultNow()
      }
    );

    // confirm 시점에 ref가 있으면 즉시 링크까지
    if (input.ref) {
      await fileLinkService.linkFilesToRef(ctx, {
        ref_type: input.ref.ref_type,
        refe_idno: input.ref.refe_idno,
        attachments: [
          {
            file_idno,
            purp_type: input.ref.purp_type ?? null,
            sort_orde: input.ref.sort_orde ?? 0,
          },
        ],
      });
    }

    return { file_idno };
  },
  // #endregion

  // #region listByRef
  async listByRef(ctx: ServiceCtx, input: ListByRefInput): Promise<ListByRefOutput> {
    const db = getDb();

    const page = normalizePage(input.page);

    const sort_field =
      input.sort?.field === "crea_date" || input.sort?.field === "file_idno" || input.sort?.field === "sort_orde"
        ? input.sort.field
        : "sort_orde";

    const sort_dir = input.sort?.dir === "asc" || input.sort?.dir === "desc" ? input.sort.dir : "desc";

    const rows = await fileRepo.listByRef(
      { db },
      {
        comp_idno: ctx.comp_idno,
        refe_type: input.ref_type,
        refe_idno: input.refe_idno,
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
        file_idno: r.file_idno,
        file_name: r.file_name,
        file_extn: r.file_extn,
        mime_type: r.mime_type,
        file_size: r.file_size,
        file_hash: r.file_hash,

        stor_drve: r.stor_drve,
        file_path: r.file_path,
        file_addr: r.file_addr,
        dura_secs: r.dura_secs,

        purp_type: r.purp_type ?? null,
        sort_orde: r.sort_orde,
      })),
      page: {
        limit: page.limit,
        offset: page.offset,
        hasMore,
      },
    };
  },
  // #endregion
  // #region transcribeFile
  async transcribeFile(ctx: ServiceCtx, input: TranscribeFileInput): Promise<TranscribeFileOutput> {
    const db = getDb();

    const file = await fileRepo.findById({ db }, { file_idno: input.file_idno, comp_idno: ctx.comp_idno });
    if (!file) throw new TRPCError({ code: "NOT_FOUND", message: "파일을 찾을 수 없습니다." });

    const { buffer, contentType } = await storageGetBuffer(file.file_path);

    const result = await transcribeBuffer(buffer, file.mime_type ?? contentType, {
      language: input.language ?? "ko",
    });

    if ("error" in result) {
      const code =
        result.code === "FILE_TOO_LARGE" || result.code === "INVALID_FORMAT"
          ? "BAD_REQUEST"
          : "INTERNAL_SERVER_ERROR";
      throw new TRPCError({ code, message: result.details ?? result.error });
    }

    const text = result.text.trim();
    if ((result.duration ?? 0) < 2 || text.length < 2) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "음성이 너무 짧거나 인식할 수 없습니다. 2초 이상 다시 녹음해 주세요.",
      });
    }

    // ✅ 여기서부터 “즉시 삭제” (STT 성공했을 때만)
    // 1) R2 삭제
    try {
      await storageDelete(file.file_path);
    } catch (e) {
      // 삭제 실패는 텍스트 결과 자체를 실패로 만들 필요는 없음(정책 선택)
      console.error("[transcribeFile] storageDelete failed:", e);
    }

    return { text };
  },
  // #endregion
} as const;
// #endregion