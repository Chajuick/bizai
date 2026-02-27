// server/modules/crm/shared/sort.ts

// #region Imports
import { z } from "zod";
// #endregion

// #region Types
export type SortDir = "asc" | "desc";

export type SortInput<TField extends string> = {
  field: TField;
  dir: SortDir;
};
// #endregion

// #region Zod Builders
/**
 * makeSortInput
 * - 도메인별 sort field를 강제하기 위한 빌더
 */
export function makeSortInput<const T extends readonly [string, ...string[]]>(fields: T) {
  return z
    .object({
      field: z.enum(fields),
      dir: z.enum(["asc", "desc"]).default("desc"),
    })
    .default({ field: fields[0], dir: "desc" as const });
}
// #endregion