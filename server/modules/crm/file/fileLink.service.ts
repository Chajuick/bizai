// server/modules/crm/file/fileLink.service.ts

// #region Imports
import { TRPCError } from "@trpc/server";

import type { ServiceCtx } from "../../../core/serviceCtx";
import { getDb } from "../../../core/db";

import type { FileRefType, FilePurpType } from "./file.dto";
import { fileRepo } from "./file.repo";
// #endregion

// #region Types
export type LinkFilesToRefInput = {
  ref_type: FileRefType;
  refe_idno: number;

  attachments: Array<{
    file_idno: number;
    purp_type?: FilePurpType | null;
    sort_orde?: number;
  }>;
};
// #endregion

// #region Service
export const fileLinkService = {
  async linkFilesToRef(ctx: ServiceCtx, input: LinkFilesToRefInput): Promise<void> {
    if (!input.attachments.length) return;

    const db = getDb();

    // 1) Cross-tenant linking 방지
    const file_idnos = input.attachments.map((a) => a.file_idno);

    try {
      await fileRepo.assertFilesOwnedByCompany({ db }, { comp_idno: ctx.comp_idno, file_idnos });
    } catch {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Some files are not accessible in this company.",
      });
    }

    // 2) Insert links
    // PK(comp_idno, refe_type, refe_idno, file_idno)가 중복을 차단
    for (const a of input.attachments) {
      try {
        await fileRepo.insertCoreFileLink(
          { db },
          {
            comp_idno: ctx.comp_idno,
            file_idno: a.file_idno,

            refe_type: input.ref_type,
            refe_idno: input.refe_idno,

            purp_type: a.purp_type ?? null,
            sort_orde: a.sort_orde ?? 0,

            dele_yesn: 0,
            dele_date: null,

            crea_idno: ctx.user_idno,
            // crea_date는 DB defaultNow()
          }
        );
      } catch (e: any) {
        // 중복링크는 “이미 연결됨”으로 보고 무시할 수도 있음.
        // 지금은 안전하게 그대로 throw (원하면 DUPLICATE KEY는 무시로 바꿔줄게)
        throw e;
      }
    }
  },
} as const;
// #endregion