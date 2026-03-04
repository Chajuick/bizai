// src/lib/confirm.ts

import type { ConfirmState, ConfirmTarget, ConfirmIntent } from "@/types";

export function buildConfirm(
  intent: ConfirmIntent,
  target: ConfirmTarget,
  description?: string
): ConfirmState {
  return {
    intent,
    target,
    description,
  };
}

export function buildDeleteConfirm(target: ConfirmTarget): ConfirmState {
  return {
    intent: "delete",
    target,
  };
}