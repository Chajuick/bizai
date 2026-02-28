// server/core/types/express.d.ts
// Express Request 타입 확장 — requestId 필드 추가

declare global {
  namespace Express {
    interface Request {
      /**
       * 요청 상관 ID (correlation ID)
       * - requestIdMiddleware에서 주입
       * - 모든 로그/에러에 포함시켜 트레이싱에 사용
       */
      __requestId: string;
    }
  }
}

export {};
