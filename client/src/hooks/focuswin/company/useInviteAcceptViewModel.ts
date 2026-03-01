import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export function useInviteAcceptViewModel(token: string) {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const {
    data: info,
    isLoading: infoLoading,
    error: infoError,
  } = trpc.company.getInviteInfo.useQuery(
    { token },
    { enabled: !!token, retry: false },
  );

  const utils = trpc.useUtils();
  const accept = trpc.company.acceptInvite.useMutation();

  const handleAccept = async () => {
    if (!isAuthenticated) {
      // 로그인 후 돌아올 수 있도록 현재 경로 저장
      navigate(`/auth/login?redirect=/invite/${token}`);
      return;
    }
    try {
      const result = await accept.mutateAsync({ token });
      // 새로 합류한 회사로 워크스페이스 전환
      localStorage.setItem("active_comp_id", String(result.comp_idno));
      await utils.invalidate();
      toast.success("회사에 합류했습니다!");
      navigate("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "초대 수락에 실패했습니다.";
      toast.error(msg);
    }
  };

  return {
    info,
    infoLoading,
    infoError,
    isAuthenticated,
    isAccepting: accept.isPending,
    handleAccept,
  };
}
