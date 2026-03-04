// src/pages/settings/SettingsTeam.tsx

// #region Imports
import { useMemo, useState } from "react";
import {
  Code2,
  Copy,
  Link2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Trash2,
  UserCog,
  Users2,
  ExternalLink,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Input } from "@/components/focuswin/common/ui/input";
import { Label } from "@/components/ui/label";

import PageShell from "@/components/focuswin/common/page-shell";

import { useCompanyMembersViewModel } from "@/hooks/focuswin/company/useCompanyMembersViewModel";
import { useWorkspaceSwitcher } from "@/hooks/focuswin/company/useWorkspaceSwitcher";

import { toast } from "sonner";

// ✅ Radix Select (네가 준 컴포넌트)
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/focuswin/common/ui/select";
// #endregion

// #region Constants
const ROLE_LABEL: Record<string, string> = {
  owner: "소유자",
  admin: "관리자",
  member: "멤버",
};
// #endregion

// #region Invite Result Component
function InviteResult({ token, onDismiss }: { token: string; onDismiss: () => void }) {
  const link = `${window.location.origin}/invite/${token}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(link);
    toast.success("초대 링크가 복사되었습니다");
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(token);
    toast.success("초대 코드가 복사되었습니다");
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold text-blue-800">초대가 생성되었습니다</p>
        <button onClick={onDismiss} className="text-xs text-blue-500 hover:text-blue-700">
          닫기
        </button>
      </div>

      {/* Link */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-blue-700 flex items-center gap-1">
          <Link2 size={11} />
          초대 링크
        </p>

        <div className="flex gap-2">
          <Input readOnly value={link} className="text-xs bg-white h-8" />
          <Button size="sm" variant="outline" className="h-8" onClick={copyLink}>
            <Copy size={12} className="mr-1" />
            복사
          </Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={() => window.open(link)}>
            <ExternalLink size={12} />
          </Button>
        </div>
      </div>

      {/* Code */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-blue-700 flex items-center gap-1">
          <Code2 size={11} />
          초대 코드
        </p>

        <div className="flex gap-2">
          <Input readOnly value={token} className="text-xs bg-white h-8 font-mono" />
          <Button size="sm" variant="outline" className="h-8" onClick={copyCode}>
            <Copy size={12} className="mr-1" />
            복사
          </Button>
        </div>
      </div>

      <p className="text-xs text-blue-600">링크와 코드는 7일 후 만료됩니다</p>
    </div>
  );
}
// #endregion

// #region Page
export default function SettingsTeam() {
  const vm = useCompanyMembersViewModel();
  const { companyRole } = useWorkspaceSwitcher();

  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  const isAdmin = companyRole === "owner" || companyRole === "admin";

  // ✅ Radix Select는 value가 string이어야 하니 안전하게 처리
  const inviteRoleValue = useMemo<"member" | "admin">(() => {
    return vm.inviteRole === "admin" ? "admin" : "member";
  }, [vm.inviteRole]);

  return (
    <PageShell size="sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Users2 size={20} className="text-slate-400" />
        <h1 className="text-lg font-bold text-slate-900">팀 관리</h1>
      </div>

      {/* Current role */}
      <div className="mb-6 text-xs text-slate-500">
        현재 역할:
        <span className="ml-1 font-semibold text-slate-700">{ROLE_LABEL[companyRole ?? "member"]}</span>
      </div>

      {/* Create invite */}
      {isAdmin && (
        <section className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Plus size={14} />
            초대 만들기
          </p>

          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="invite-role">
                권한
              </Label>

              {/* ✅ 기존 <select> 제거 → Radix Select 적용 */}
              <Select
                value={inviteRoleValue}
                onValueChange={(v) => vm.setInviteRole(v as "admin" | "member")}
                disabled={vm.isSending}
              >
                <SelectTrigger id="invite-role" size="sm" className="w-full">
                  <SelectValue placeholder="권한 선택" />
                </SelectTrigger>

                <SelectContent align="start">
                  <SelectItem value="member">멤버</SelectItem>
                  <SelectItem value="admin">관리자</SelectItem>
                </SelectContent>
              </Select>

              <p className="text-[11px] text-slate-400">
                멤버: 기본 권한 / 관리자: 초대 및 권한 변경 가능
              </p>
            </div>

            <Button onClick={vm.handleCreateInvite} disabled={vm.isSending} className="w-full" size="sm">
              {vm.isSending ? "생성 중…" : "초대 만들기"}
            </Button>
          </div>
        </section>
      )}

      {/* Invite result */}
      {vm.latestToken && (
        <div className="mb-6">
          <InviteResult token={vm.latestToken} onDismiss={() => vm.setLatestToken(null)} />
        </div>
      )}

      {/* Pending invites */}
      {isAdmin && vm.invites.length > 0 && (
        <section className="mb-6 space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase">대기 중인 초대</p>

          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
            {vm.invites.map((inv) => (
              <li key={inv.invt_idno} className="flex items-center justify-between px-4 py-3 bg-white">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">링크</Badge>

                    <span className="text-sm text-slate-700">{ROLE_LABEL[inv.role_code]}</span>
                  </div>

                  <p className="text-xs text-slate-400 pt-2 ml-1">
                    만료 {new Date(inv.expi_date).toLocaleDateString("ko-KR")}
                  </p>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="링크 재발급"
                    onClick={() => vm.handleResendInvite(inv.invt_idno)}
                  >
                    <RefreshCw size={13} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500"
                    title="취소"
                    onClick={() => vm.handleCancelInvite(inv.invt_idno)}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Member list */}
      <section className="space-y-2">
        <p className="text-xs font-medium text-slate-500 uppercase">현재 멤버 ({vm.members.length})</p>

        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
          {vm.members.map((m) => (
            <li key={m.user_idno} className="flex items-center justify-between px-4 py-3 bg-white">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold">
                  {m.user_name?.[0] ?? "U"}
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-900">{m.user_name ?? "이름 없음"}</p>
                  <p className="text-xs text-slate-500">{m.mail_idno ?? "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">{ROLE_LABEL[m.role_code]}</Badge>

                {isAdmin && m.role_code !== "owner" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal size={14} />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          vm.handleUpdateRole(m.user_idno, m.role_code === "admin" ? "member" : "admin")
                        }
                      >
                        <UserCog size={14} className="mr-2" />
                        권한 변경
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem className="text-red-600" onClick={() => setConfirmRemove(m.user_idno)}>
                        <Trash2 size={14} className="mr-2" />
                        제거
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Remove dialog */}
      <Dialog open={confirmRemove !== null} onOpenChange={() => setConfirmRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>멤버 제거</DialogTitle>
            <DialogDescription>이 멤버를 회사에서 제거하시겠습니까?</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>
              취소
            </Button>

            <Button
              variant="destructive"
              onClick={async () => {
                if (confirmRemove !== null) {
                  await vm.handleRemoveMember(confirmRemove);
                  setConfirmRemove(null);
                }
              }}
            >
              제거
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
// #endregion