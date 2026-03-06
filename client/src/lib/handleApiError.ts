// client/src/lib/handleApiError.ts
//
// 서버 tRPC errorFormatter가 내려주는 구조화된 에러 메타를 읽어
// toast / inline / silent 여부를 결정한다.
//
// 브라우저 전용 에러(마이크 권한, MediaRecorder, 파일 선택 취소 등)는
// 이 함수를 거치지 않고 호출부에서 직접 toast.error()로 처리한다.

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
  /** 서버가 내려준 도메인 에러 코드. null이면 일반 에러. */
  appCode: string | null;
  /** 클라이언트가 어떻게 표시할지 */
  displayType: "toast" | "inline" | "silent";
  /** 재시도 가능 여부 */
  retryable: boolean;
  /** 사용자에게 보여줄 메시지 */
  message: string;
};
// #endregion

// #region parseApiError
/**
 * parseApiError
 * - tRPC 에러면 shape.data에서 메타 추출
 * - AbortError면 displayType: "silent" 반환 (취소는 별도 처리)
 * - 그 외 알 수 없는 에러는 toast + 기본 메시지
 */
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
    return {
      appCode: data?.appCode ?? null,
      displayType: data?.displayType ?? "toast",
      retryable: data?.retryable ?? false,
      message: e.message,
    };
  }

  return {
    appCode: null,
    displayType: "toast",
    retryable: false,
    message: "처리 중 오류가 발생했습니다.",
  };
}
// #endregion

// #region handleApiError
/**
 * handleApiError
 * - displayType === "toast" → toast.error(message)
 * - displayType === "silent" → 아무것도 하지 않음 (호출부에서 추가 처리 가능)
 * - displayType === "inline" → toast 없음, 호출부에서 parseApiError()로 직접 렌더링
 *
 * @returns ApiErrorMeta — 호출부가 추가 처리(inline 렌더 등)에 쓸 수 있도록 반환
 */
export function handleApiError(e: unknown): ApiErrorMeta {
  const meta = parseApiError(e);

  if (meta.displayType === "toast") {
    toast.error(meta.message);
  }

  return meta;
}
// #endregion

// TRPCClientError 타입 가드 (AppRouter 기반, 필요한 곳에서 import)
export type AppTRPCError = TRPCClientError<AppRouter>;
