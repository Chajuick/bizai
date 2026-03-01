import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageShell from "@/components/focuswin/common/page-shell";
import { useCompanyMembersViewModel } from "@/hooks/focuswin/company/useCompanyMembersViewModel";
import { useWorkspaceSwitcher } from "@/hooks/focuswin/company/useWorkspaceSwitcher";

const ROLE_LABEL: Record<string, string> = {
  owner: "소유자",
  admin: "관리자",
  member: "멤버",
};

function InviteResult({ token, onDismiss }: { token: string; onDismiss: () => void }) {
  const link = `${window.location.origin}/invite/${token}`;

  const copyLink = () => navigator.clipboard.writeText(link).then(() => alert("링크 복사됨"));
  const copyCode = () => navigator.clipboard.writeText(token).then(() => alert("코드 복사됨"));

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-blue-800">초대가 생성되었습니다</p>
        <button
          onClick={onDismiss}
          className="text-blue-400 hover:text-blue-600 text-xs"
        >
          닫기
        </button>
      </div>

      {/* Link */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-blue-700 flex items-center gap-1">
          <Link2 size={11} /> 초대 링크
        </p>
        <div className="flex gap-2">
          <Input
            readOnly
            value={link}
            className="text-xs bg-white h-8"
          />
          <Button size="sm" variant="outline" className="shrink-0 h-8" onClick={copyLink}>
            <Copy size={12} className="mr-1" /> 복사
          </Button>
        </div>
      </div>

      {/* Code */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-blue-700 flex items-center gap-1">
          <Code2 size={11} /> 초대 코드
          <span className="text-blue-500 font-normal">(/invite/enter 에 붙여넣기)</span>
        </p>
        <div className="flex gap-2">
          <Input
            readOnly
            value={token}
            className="text-xs bg-white h-8 font-mono"
          />
          <Button size="sm" variant="outline" className="shrink-0 h-8" onClick={copyCode}>
            <Copy size={12} className="mr-1" /> 복사
          </Button>
        </div>
      </div>

      <p className="text-xs text-blue-600">
        링크와 코드는 7일 후 만료됩니다. 한 번만 표시됩니다.
      </p>
    </div>
  );
}

export default function SettingsTeam() {
  const vm = useCompanyMembersViewModel();
  const { companyRole } = useWorkspaceSwitcher();
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  const isAdmin = companyRole === "owner" || companyRole === "admin";

  return (
    <PageShell size="sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Users2 size={20} className="text-slate-400" />
        <h1 className="text-lg font-bold text-slate-900">팀 관리</h1>
      </div>

      {/* Invite result (최신 생성된 초대) */}
      {vm.latestToken && (
        <div className="mb-6">
          <InviteResult token={vm.latestToken} onDismiss={() => vm.setLatestToken(null)} />
        </div>
      )}

      {/* Create invite section — admin only */}
      {isAdmin && (
        <section className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Plus size={14} /> 초대 만들기
          </p>

          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="invite-role">권한</Label>
              <select
                id="invite-role"
                value={vm.inviteRole}
                onChange={(e) => vm.setInviteRole(e.target.value as "admin" | "member")}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 h-9"
              >
                <option value="member">멤버</option>
                <option value="admin">관리자</option>
              </select>
            </div>

            <Button
              onClick={vm.handleCreateInvite}
              disabled={vm.isSending}
              className="w-full"
              size="sm"
            >
              {vm.isSending ? "생성 중…" : "초대 만들기"}
            </Button>
          </div>
        </section>
      )}

      {/* Active invites — admin only */}
      {isAdmin && vm.invites.length > 0 && (
        <section className="mb-6 space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">대기 중인 초대</p>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
            {vm.invites.map((inv) => (
              <li key={inv.invt_idno} className="flex items-center justify-between px-4 py-3 bg-white">
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 truncate">
                    {inv.mail_idno ?? <span className="text-slate-400 italic">링크 초대</span>}
                  </p>
                  <p className="text-xs text-slate-400">
                    {ROLE_LABEL[inv.role_code]} · 만료{" "}
                    {new Date(inv.expi_date).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
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
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          현재 멤버 {vm.members.length > 0 && `(${vm.members.length})`}
        </p>

        {vm.isLoading ? (
          <p className="text-sm text-slate-400">불러오는 중…</p>
        ) : vm.members.length === 0 ? (
          <p className="text-sm text-slate-400">멤버가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
            {vm.members.map((m) => (
              <li key={m.user_idno} className="flex items-center justify-between px-4 py-3 bg-white">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {m.user_name ?? "이름 없음"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{m.mail_idno ?? "-"}</p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {ROLE_LABEL[m.role_code] ?? m.role_code}
                  </Badge>
                  {/* 관리자만 멤버 관리 드롭다운 표시 */}
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
                            vm.handleUpdateRole(
                              m.user_idno,
                              m.role_code === "admin" ? "member" : "admin",
                            )
                          }
                        >
                          <UserCog size={14} className="mr-2" />
                          {m.role_code === "admin" ? "멤버로 변경" : "관리자로 변경"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setConfirmRemove(m.user_idno)}
                        >
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
        )}
      </section>

      {/* Remove confirm dialog */}
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
