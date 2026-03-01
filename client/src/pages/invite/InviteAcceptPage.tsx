import { Building2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInviteAcceptViewModel } from "@/hooks/focuswin/company/useInviteAcceptViewModel";

type Props = { params: { token: string } };

const ROLE_LABEL: Record<string, string> = {
  admin: "관리자",
  member: "멤버",
};

export default function InviteAcceptPage({ params }: Props) {
  const { token } = params;
  const vm = useInviteAcceptViewModel(token);

  if (vm.infoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">초대장 확인 중…</p>
      </div>
    );
  }

  if (vm.infoError || !vm.info) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <XCircle className="mx-auto text-red-400" size={40} />
          <h1 className="text-lg font-semibold text-slate-800">초대장을 찾을 수 없습니다</h1>
          <p className="text-sm text-slate-500">링크가 올바른지 확인해 주세요.</p>
        </div>
      </div>
    );
  }

  // 유효하지 않은 상태 처리
  if (vm.info.stat_code !== "active") {
    const messages: Record<string, { icon: React.ReactNode; title: string; desc: string }> = {
      used: {
        icon: <CheckCircle2 className="mx-auto text-green-400" size={40} />,
        title: "이미 사용된 초대입니다",
        desc: "이 초대는 이미 수락되었습니다.",
      },
      revoked: {
        icon: <XCircle className="mx-auto text-red-400" size={40} />,
        title: "취소된 초대입니다",
        desc: "관리자에게 새 초대를 요청하세요.",
      },
      expired: {
        icon: <Clock className="mx-auto text-amber-400" size={40} />,
        title: "만료된 초대입니다",
        desc: "관리자에게 새 초대를 요청하세요.",
      },
    };

    const info = messages[vm.info.stat_code] ?? messages.expired;

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          {info.icon}
          <h1 className="text-lg font-semibold text-slate-800">{info.title}</h1>
          <p className="text-sm text-slate-500">{info.desc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <Building2 className="mx-auto text-blue-500" size={40} />

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900">{vm.info.comp_name}</h1>
          <p className="text-sm text-slate-500">
            회사에 <strong>{ROLE_LABEL[vm.info.role_code]}</strong>으로 초대받으셨습니다.
          </p>
          <p className="text-xs text-slate-400">
            만료: {new Date(vm.info.expi_date).toLocaleDateString("ko-KR")}
          </p>
        </div>

        {!vm.isAuthenticated && (
          <p className="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            초대를 수락하려면 먼저 로그인이 필요합니다.
          </p>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={vm.handleAccept}
          disabled={vm.isAccepting}
        >
          {vm.isAccepting
            ? "처리 중…"
            : vm.isAuthenticated
              ? "초대 수락"
              : "로그인하고 수락"}
        </Button>
      </div>
    </div>
  );
}
