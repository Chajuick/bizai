import { QueryClient } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { getLoginUrl } from "@/const";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,          // 30초 내 재요청 억제
      gcTime: 5 * 60_000,         // 5분간 캐시 유지
      refetchOnWindowFocus: false, // 탭 전환 시 자동 재요청 off
      retry: 1,                   // 실패 시 1회만 재시도
    },
  },
});

let redirecting = false;

function redirectToLoginIfUnauthorized(error: unknown) {
  if (redirecting) return;
  if (typeof window === "undefined") return;

  // 최소한의 안전판: message 기준(지금 너 로직 유지)
  if (error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG) {
    redirecting = true;
    window.location.href = getLoginUrl();
  }
}

queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
  }
});

queryClient.getMutationCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
  }
});