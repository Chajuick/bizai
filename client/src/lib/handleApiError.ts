// client/src/lib/handleApiError.ts

import { toast } from "sonner";
import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "../../../server/core/trpc/appRouters";

// #region Types
type TRPCData = {
  appCode: string | null;
  displayType: "toast" | "inline" | "silent";
  retryable: boolean;
  requestId?: string | null;
};

export type ApiErrorMeta = {
  appCode: string | null;
  displayType: "toast" | "inline" | "silent";
  retryable: boolean;
  message: string;
};
// #endregion

// #region Helpers
const DEFAULT_ERROR_MESSAGE = "처리 중 오류가 발생했습니다.";

function isUnsafeRawMessage(message: string): boolean {
  const m = message.toLowerCase();

  return (
    m.includes("failed query:") ||
    m.includes("insert into") ||
    m.includes("update ") ||
    m.includes("delete from") ||
    m.includes("select ") ||
    m.includes("sql") ||
    m.includes("mysql") ||
    m.includes("drizzle") ||
    m.includes("no procedure found on path") ||
    m.includes("trpc") ||
    m.includes("stack") ||
    m.includes("internal_server_error")
  );
}

function toSafeClientMessage(params: {
  appCode: string | null;
  rawMessage?: string;
}): string {
  const { appCode, rawMessage } = params;

  if (!rawMessage?.trim()) return DEFAULT_ERROR_MESSAGE;

  // 서버가 throwAppError로 명시적으로 만든 앱 에러만 메시지 신뢰
  if (appCode) {
    return isUnsafeRawMessage(rawMessage) ? DEFAULT_ERROR_MESSAGE : rawMessage;
  }

  // 앱 에러가 아니면 내부 에러일 가능성이 높으니 raw message 노출 금지
  return DEFAULT_ERROR_MESSAGE;
}
// #endregion

// #region parseApiError
export function parseApiError(e: unknown): ApiErrorMeta {
  if ((e as { name?: string })?.name === "AbortError") {
    return {
      appCode: "ABORTED",
      displayType: "silent",
      retryable: false,
      message: "작업을 취소했습니다.",
    };
  }

  if (e instanceof TRPCClientError) {
    const data = e.data as TRPCData | undefined;
    const appCode = data?.appCode ?? null;

    return {
      appCode,
      displayType: data?.displayType ?? "toast",
      retryable: data?.retryable ?? false,
      message: toSafeClientMessage({
        appCode,
        rawMessage: e.message,
      }),
    };
  }

  return {
    appCode: null,
    displayType: "toast",
    retryable: false,
    message: DEFAULT_ERROR_MESSAGE,
  };
}
// #endregion

// #region handleApiError
export function handleApiError(e: unknown): ApiErrorMeta {
  const meta = parseApiError(e);

  if (meta.displayType === "toast") {
    toast.error(meta.message);
  }

  return meta;
}
// #endregion

export type AppTRPCError = TRPCClientError<AppRouter>;