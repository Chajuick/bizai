import { QueryClient } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { getLoginUrl } from "@/const";
import { preserveAuthRedirect } from "@/router/redirect";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

let redirecting = false;

function getFullPath() {
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
}

function redirectToLoginIfUnauthorized(error: unknown) {
  if (redirecting) return;
  if (typeof window === "undefined") return;

  // 로그인 페이지에서 또 튀는 것 방지
  if (window.location.pathname.startsWith("/auth/")) return;

  if (error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG) {
    redirecting = true;

    // 핵심: 현재 페이지 저장
    preserveAuthRedirect(getFullPath());

    // 로그인으로 이동
    window.location.href = getLoginUrl();
  }
}

/**
 * 전역 Query 에러 감지
 */
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
  }
});

/**
 * 전역 Mutation 에러 감지
 */
queryClient.getMutationCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
  }
});