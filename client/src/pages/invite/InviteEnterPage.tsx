import { useState } from "react";
import { Building2, Hash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";

const ROLE_LABEL: Record<string, string> = { admin: "관리자", member: "멤버" };

export default function InviteEnterPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const [rawCode, setRawCode] = useState("");
  // 사용자가 입력하는 "코드"는 token 앞 8자 대문자이므로 → 전체 token을 받으려면 사전에
  // 백엔드에서 코드(앞8자) ↔ token 매핑이 필요하지만, 여기서는 전체 token 입력도 지원함.
  // UX: "링크에 포함된 전체 코드 또는 초대 링크의 토큰 부분"을 입력.
  const [previewToken, setPreviewToken] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const accept = trpc.company.acceptInvite.useMutation();

  const {
    data: info,
    isLoading: previewLoading,
  } = trpc.company.getInviteInfo.useQuery(
    { token: previewToken ?? "" },
    { enabled: !!previewToken, retry: false },
  );

  const handlePreview = () => {
    const trimmed = rawCode.trim();
    if (!trimmed) { toast.error("코드를 입력해주세요."); return; }

    // 링크 URL 붙여넣기 시 토큰 부분만 추출
    let token = trimmed;
    try {
      const url = new URL(trimmed);
      const parts = url.pathname.split("/");
      const idx = parts.indexOf("invite");
      if (idx !== -1 && parts[idx + 1] && parts[idx + 1] !== "enter") {
        token = parts[idx + 1];
      }
    } catch {
      // URL 아님 → 그대로 사용
    }

    setPreviewToken(token);
  };

  const handleAccept = async () => {
    if (!previewToken) return;
    if (!isAuthenticated) {
      navigate(`/auth/login?redirect=/invite/enter`);
      return;
    }
    try {
      const result = await accept.mutateAsync({ token: previewToken });
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <Hash className="mx-auto text-blue-500 mb-3" size={36} />
          <h1 className="text-xl font-bold text-slate-900">초대 코드 입력</h1>
          <p className="text-sm text-slate-500">초대 링크 또는 초대 코드를 붙여넣으세요.</p>
        </div>

        {/* Code input */}
        {!previewToken && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="code-input">초대 링크 또는 초대 코드</Label>
              <Input
                id="code-input"
                placeholder="https://… 링크 또는 초대 코드 붙여넣기"
                value={rawCode}
                onChange={(e) => setRawCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePreview()}
                className="text-center font-mono tracking-widest"
              />
            </div>
            <Button className="w-full" onClick={handlePreview}>
              초대 확인
            </Button>
          </div>
        )}

        {/* Preview */}
        {previewToken && (
          <div className="space-y-4">
            {previewLoading ? (
              <div className="flex items-center justify-center gap-2 text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">초대 정보 확인 중…</span>
              </div>
            ) : info?.stat_code === "active" ? (
              <>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center space-y-2">
                  <Building2 className="mx-auto text-blue-500" size={28} />
                  <p className="font-bold text-slate-900">{info.comp_name}</p>
                  <p className="text-sm text-slate-500">
                    <strong>{ROLE_LABEL[info.role_code]}</strong>으로 초대받으셨습니다.
                  </p>
                  <p className="text-xs text-slate-400">
                    만료: {new Date(info.expi_date).toLocaleDateString("ko-KR")}
                  </p>
                </div>

                {!isAuthenticated && (
                  <p className="text-sm text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    초대를 수락하려면 먼저 로그인이 필요합니다.
                  </p>
                )}

                <Button
                  className="w-full"
                  onClick={handleAccept}
                  disabled={accept.isPending}
                >
                  {accept.isPending
                    ? "처리 중…"
                    : isAuthenticated
                      ? "초대 수락"
                      : "로그인하고 수락"}
                </Button>

                <button
                  className="w-full text-xs text-slate-400 hover:text-slate-600 transition"
                  onClick={() => { setPreviewToken(null); setRawCode(""); }}
                >
                  다른 코드 입력
                </button>
              </>
            ) : (
              <div className="text-center space-y-2">
                <p className="text-sm text-red-600 font-medium">
                  {{
                    used: "이미 사용된 초대입니다.",
                    revoked: "취소된 초대입니다.",
                    expired: "만료된 초대입니다.",
                  }[info?.stat_code ?? "expired"] ?? "유효하지 않은 초대입니다."}
                </p>
                <button
                  className="text-xs text-slate-400 hover:text-slate-600 transition"
                  onClick={() => { setPreviewToken(null); setRawCode(""); }}
                >
                  다시 시도
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
