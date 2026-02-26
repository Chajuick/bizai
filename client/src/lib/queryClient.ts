import { QueryClient } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { getLoginUrl } from "@/const";

export const queryClient = new QueryClient();

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