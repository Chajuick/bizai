import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function useCompanyMembersViewModel() {
  const utils = trpc.useUtils();

  const { data: members = [], isLoading: membersLoading } = trpc.company.getMembers.useQuery();
  const { data: invites = [], isLoading: invitesLoading } = trpc.company.listInvites.useQuery();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [latestToken, setLatestToken] = useState<string | null>(null);

  const createInvite = trpc.company.createInvite.useMutation();
  const cancelInvite = trpc.company.cancelInvite.useMutation();
  const resendInvite = trpc.company.resendInvite.useMutation();
  const removeMember = trpc.company.removeMember.useMutation();
  const updateMemberRole = trpc.company.updateMemberRole.useMutation();

  const invalidate = async () => {
    await Promise.all([
      utils.company.getMembers.invalidate(),
      utils.company.listInvites.invalidate(),
    ]);
  };

  const handleCreateInvite = async () => {
    try {
      const result = await createInvite.mutateAsync({ role: inviteRole });
      setLatestToken(result.token);
      setInviteRole("member");
      await invalidate();
      toast.success("초대장이 생성되었습니다.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "초대 생성에 실패했습니다.";
      toast.error(msg);
    }
  };

  const handleCancelInvite = async (invt_idno: number) => {
    try {
      await cancelInvite.mutateAsync({ invt_idno });
      await invalidate();
      toast.success("초대가 취소되었습니다.");
    } catch {
      toast.error("초대 취소에 실패했습니다.");
    }
  };

  const handleResendInvite = async (invt_idno: number) => {
    try {
      const result = await resendInvite.mutateAsync({ invt_idno });
      setLatestToken(result.token);
      await invalidate();
      toast.success("새 초대 링크가 생성되었습니다.");
    } catch {
      toast.error("초대 재전송에 실패했습니다.");
    }
  };

  const handleRemoveMember = async (user_idno: number) => {
    try {
      await removeMember.mutateAsync({ user_idno });
      await invalidate();
      toast.success("멤버가 제거되었습니다.");
    } catch {
      toast.error("멤버 제거에 실패했습니다.");
    }
  };

  const handleUpdateRole = async (user_idno: number, role: "admin" | "member") => {
    try {
      await updateMemberRole.mutateAsync({ user_idno, role });
      await invalidate();
      toast.success("권한이 변경되었습니다.");
    } catch {
      toast.error("권한 변경에 실패했습니다.");
    }
  };

  const getInviteLink = (token: string) =>
    `${window.location.origin}/invite/${token}`;

  const copyInviteLink = (token: string) => {
    navigator.clipboard.writeText(getInviteLink(token)).then(() => {
      toast.success("초대 링크가 복사되었습니다.");
    });
  };

  const isLoading = membersLoading || invitesLoading;

  return {
    members,
    invites,
    isLoading,

    showInviteDialog,
    setShowInviteDialog,

    inviteRole,
    setInviteRole,

    latestToken,
    setLatestToken,

    handleCreateInvite,
    handleCancelInvite,
    handleResendInvite,
    handleRemoveMember,
    handleUpdateRole,
    getInviteLink,
    copyInviteLink,

    isSending: createInvite.isPending,
  };
}
