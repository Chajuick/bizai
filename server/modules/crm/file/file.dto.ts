// server/modules/crm/file/file.dto.ts

// #region Imports
import { z } from "zod";
import { FILE_REF_TYPES, FILE_PURP_TYPES } from "../../../../drizzle/schema";
import { PaginationInput } from "../shared/pagination";
import { makeSortInput } from "../shared/sort";
// #endregion

// #region Enums
export const FileRefTypeZ = z.enum(FILE_REF_TYPES);
export const FilePurpTypeZ = z.enum(FILE_PURP_TYPES);

export type FileRefType = (typeof FILE_REF_TYPES)[number];
export type FilePurpType = (typeof FILE_PURP_TYPES)[number];
// #endregion

// #region Sort
const FileSortInput = makeSortInput(["sort_orde", "file_idno", "crea_date"] as const);
// #endregion

// #region Inputs
export const PrepareUploadInput = z.object({
  file_name: z.string().min(1),
  mime_type: z.string().optional(), // presigned PUT URL의 ContentType 지정 시 사용
});

export const ConfirmUploadInput = z.object({
  file_path: z.string().min(1),

  file_name: z.string().min(1),
  mime_type: z.string().optional(),
  file_size: z.number().int().nonnegative().optional(),
  file_hash: z.string().optional(),

  stor_drve: z.string().optional(),
  file_addr: z.string().optional(),
  dura_secs: z.number().int().nonnegative().optional(),

  /**
   * optional ref link at confirm time
   * - if the caller already has refe_idno
   */
  ref: z
    .object({
      ref_type: FileRefTypeZ,
      refe_idno: z.number().int().positive(),
      purp_type: FilePurpTypeZ.optional(),
      sort_orde: z.number().int().optional(),
    })
    .optional(),
});

export const ListByRefInput = z.object({
  ref_type: FileRefTypeZ,
  refe_idno: z.number().int().positive(),

  page: PaginationInput.optional(),
  sort: FileSortInput.optional(),
});
// #endregion

// #region Outputs
export const PrepareUploadOutput = z.object({
  file_path: z.string(),
  upload_url: z.string(), // 클라이언트가 R2에 직접 PUT 업로드하는 presigned URL (15분 유효)
});

export const ConfirmUploadOutput = z.object({
  file_idno: z.number().int().positive(),
});

export const FileItemOutput = z.object({
  // file
  file_idno: z.number().int().positive(),
  file_name: z.string(),
  file_extn: z.string().nullable(),
  mime_type: z.string().nullable(),
  file_size: z.number().int().nullable(),
  file_hash: z.string().nullable(),

  stor_drve: z.string().nullable(),
  file_path: z.string(),
  file_addr: z.string().nullable(),
  dura_secs: z.number().int().nullable(),

  // link (when listing by ref)
  purp_type: FilePurpTypeZ.nullable(),
  sort_orde: z.number().int(),
});

export const ListByRefOutput = z.object({
  items: z.array(FileItemOutput),
  page: z.object({
    limit: z.number().int(),
    offset: z.number().int(),
    hasMore: z.boolean(),
  }),
});
// #endregion

// #region Types
export type PrepareUploadInput = z.infer<typeof PrepareUploadInput>;
export type ConfirmUploadInput = z.infer<typeof ConfirmUploadInput>;
export type ListByRefInput = z.infer<typeof ListByRefInput>;

export type PrepareUploadOutput = z.infer<typeof PrepareUploadOutput>;
export type ConfirmUploadOutput = z.infer<typeof ConfirmUploadOutput>;
export type ListByRefOutput = z.infer<typeof ListByRefOutput>;
// #endregion