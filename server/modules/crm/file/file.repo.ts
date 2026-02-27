// server/modules/crm/file/file.repo.ts

// #region Imports
import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { CORE_FILE, CORE_FILE_LINK, FILE_REF_TYPES } from "../../../../drizzle/schema";
import type { DbClient } from "../../../core/db";
import { getInsertId } from "../../../core/db";
// #endregion

// #region Types
export type FileRepoDeps = { db: DbClient };

export type InsertCoreFile = typeof CORE_FILE.$inferInsert;
export type InsertCoreFileLink = typeof CORE_FILE_LINK.$inferInsert;

export type FileRefType = (typeof FILE_REF_TYPES)[number];

export type ListByRefArgs = {
  comp_idno: number;
  refe_type: FileRefType;
  refe_idno: number;

  limit: number;
  offset: number;

  sort_field: "sort_orde" | "file_idno" | "crea_date";
  sort_dir: "asc" | "desc";
};

export type ListByRefRow = {
  // file
  file_idno: number;
  file_name: string;
  file_extn: string | null;
  mime_type: string | null;
  file_size: number | null;
  file_hash: string | null;

  stor_drve: string | null;
  file_path: string;
  file_addr: string | null;
  dura_secs: number | null;

  // link
  purp_type: InsertCoreFileLink["purp_type"];
  sort_orde: number;
};
// #endregion

// #region Repo
export const fileRepo = {
  // #region insertCoreFile
  async insertCoreFile(deps: FileRepoDeps, data: InsertCoreFile): Promise<{ file_idno: number }> {
    const res = await deps.db.insert(CORE_FILE).values(data);
    return { file_idno: getInsertId(res) };
  },
  // #endregion

  // #region insertCoreFileLink
  async insertCoreFileLink(deps: FileRepoDeps, data: InsertCoreFileLink): Promise<void> {
    await deps.db.insert(CORE_FILE_LINK).values(data);
  },
  // #endregion

  // #region assertFilesOwnedByCompany
  /**
   * assertFilesOwnedByCompany
   * - “해당 회사(comp_idno)가 접근 가능한 파일”인지 검증
   * - repo는 DB만 담당: 여기서는 Error를 throw하고,
   *   서비스가 이를 TRPCError로 변환하는 것이 정석.
   */
  async assertFilesOwnedByCompany(
    deps: FileRepoDeps,
    args: { comp_idno: number; file_idnos: number[] }
  ): Promise<void> {
    if (!args.file_idnos.length) return;

    const rows = await deps.db
      .select({ file_idno: CORE_FILE.file_idno })
      .from(CORE_FILE)
      .where(
        and(
          eq(CORE_FILE.comp_idno, args.comp_idno),
          eq(CORE_FILE.dele_yesn, 0),
          inArray(CORE_FILE.file_idno, args.file_idnos)
        )
      );

    const ok = new Set(rows.map((r) => Number(r.file_idno)));
    const missing = args.file_idnos.filter((id) => !ok.has(id));

    if (missing.length) {
      throw new Error(`FILE_NOT_OWNED:${missing.join(",")}`);
    }
  },
  // #endregion

  // #region listByRef
  async listByRef(deps: FileRepoDeps, args: ListByRefArgs): Promise<ListByRefRow[]> {
    const dirFn = args.sort_dir === "asc" ? asc : desc;

    const sortExpr =
      args.sort_field === "crea_date"
        ? dirFn(CORE_FILE.crea_date)
        : args.sort_field === "file_idno"
          ? dirFn(CORE_FILE.file_idno)
          : dirFn(CORE_FILE_LINK.sort_orde);

    const rows = await deps.db
      .select({
        file_idno: CORE_FILE.file_idno,
        file_name: CORE_FILE.file_name,
        file_extn: CORE_FILE.file_extn,
        mime_type: CORE_FILE.mime_type,
        file_size: CORE_FILE.file_size,
        file_hash: CORE_FILE.file_hash,

        stor_drve: CORE_FILE.stor_drve,
        file_path: CORE_FILE.file_path,
        file_addr: CORE_FILE.file_addr,
        dura_secs: CORE_FILE.dura_secs,

        purp_type: CORE_FILE_LINK.purp_type,
        sort_orde: CORE_FILE_LINK.sort_orde,
      })
      .from(CORE_FILE_LINK)
      .innerJoin(
        CORE_FILE,
        and(eq(CORE_FILE.comp_idno, CORE_FILE_LINK.comp_idno), eq(CORE_FILE.file_idno, CORE_FILE_LINK.file_idno))
      )
      .where(
        and(
          eq(CORE_FILE_LINK.comp_idno, args.comp_idno),
          eq(CORE_FILE_LINK.refe_type, args.refe_type),
          eq(CORE_FILE_LINK.refe_idno, args.refe_idno),
          eq(CORE_FILE_LINK.dele_yesn, 0),
          eq(CORE_FILE.dele_yesn, 0)
        )
      )
      .orderBy(sortExpr, asc(CORE_FILE.file_idno))
      .limit(args.limit + 1)
      .offset(args.offset);

    return rows.map((r) => ({
      file_idno: Number(r.file_idno),
      file_name: String(r.file_name),
      file_extn: r.file_extn ?? null,
      mime_type: r.mime_type ?? null,
      file_size: r.file_size == null ? null : Number(r.file_size),
      file_hash: r.file_hash ?? null,

      stor_drve: r.stor_drve ?? null,
      file_path: String(r.file_path),
      file_addr: r.file_addr ?? null,
      dura_secs: r.dura_secs == null ? null : Number(r.dura_secs),

      purp_type: r.purp_type ?? null,
      sort_orde: Number(r.sort_orde ?? 0),
    }));
  },
  // #endregion
} as const;
// #endregion