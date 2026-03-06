// server/core/trpc/appError.ts
//
// 서버가 클라이언트에 전달하는 구조화된 에러.
// throwAppError()를 사용하면 tRPC errorFormatter가 자동으로
// shape.data에 { appCode, displayType, retryable }을 포함시켜 내려준다.

import { TRPCError } from "@trpc/server";
import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/unstable-core-do-not-import";

// #region Types
export type DisplayType = "toast" | "inline" | "silent";

export type AppErrorParams = {
  /** tRPC HTTP 상태 매핑용 코드 */
  tRPCCode: TRPC_ERROR_CODE_KEY;
  /** 도메인 에러 코드 — 클라이언트가 코드별 분기가 필요할 때 사용 */
  appCode: string;
  /** 사용자에게 노출할 메시지 (서버가 결정) */
  message: string;
  /** 클라이언트가 어떻게 표시할지 */
  displayType?: DisplayType;
  /** 재시도 가능 여부 */
  retryable?: boolean;
};
// #endregion

// #region AppError
/**
 * AppError
 * - TRPCError의 cause로 주입된다.
 * - errorFormatter에서 instanceof 체크로 감지 후 shape.data에 포함.
 */
export class AppError extends Error {
  readonly appCode: string;
  readonly displayType: DisplayType;
  readonly retryable: boolean;

  constructor(params: Omit<AppErrorParams, "tRPCCode">) {
    super(params.message);
    this.name = "AppError";
    this.appCode = params.appCode;
    this.displayType = params.displayType ?? "toast";
    this.retryable = params.retryable ?? false;
  }
}
// #endregion

// #region throwAppError
/**
 * throwAppError
 * - 서비스 레이어에서 사용하는 유일한 에러 던지기 헬퍼.
 * - TRPCError를 throw하면서 cause에 AppError를 담는다.
 */
export function throwAppError(params: AppErrorParams): never {
  throw new TRPCError({
    code: params.tRPCCode,
    message: params.message,
    cause: new AppError({
      appCode: params.appCode,
      message: params.message,
      displayType: params.displayType,
      retryable: params.retryable,
    }),
  });
}
// #endregion
