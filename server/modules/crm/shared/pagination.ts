// server/modules/crm/shared/pagination.ts

// #region Imports
import { z } from "zod";
// #endregion

// #region Types
export type Page = {
  limit: number;
  offset: number;
};
// #endregion

// #region Zod
/**
 * PaginationInput
 * - limit/offset 기반 (정석 1단계)
 * - 나중에 cursor 방식으로 전환해도 dto 레이어에서 흡수 가능
 */
export const PaginationInput = z
  .object({
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
  })
  .default({ limit: 20, offset: 0 });

export type PaginationInput = z.infer<typeof PaginationInput>;
// #endregion

// #region Helpers
export function normalizePage(input?: PaginationInput | null): Page {
  const limit = input?.limit ?? 20;
  const offset = input?.offset ?? 0;

  // 안전 가드
  const safeLimit = Math.max(1, Math.min(100, limit));
  const safeOffset = Math.max(0, offset);

  return { limit: safeLimit, offset: safeOffset };
}
// #endregion