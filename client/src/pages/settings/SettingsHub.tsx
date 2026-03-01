import { Link } from "wouter";
import { BarChart3, ChevronRight, CreditCard, Settings, Users2 } from "lucide-react";
import PageShell from "@/components/focuswin/common/page-shell";
import { useAuth } from "@/_core/hooks/useAuth";

const sections = [
  {
    path: "/settings/team",
    icon: Users2,
    label: "팀 관리",
    desc: "멤버 초대, 역할 설정, 초대 링크 관리",
  },
  {
    path: "/settings/usage",
    icon: BarChart3,
    label: "사용량",
    desc: "AI 토큰 사용량 및 통계 확인",
  },
  {
    path: "/settings/billing",
    icon: CreditCard,
    label: "플랜/결제",
    desc: "구독 플랜 및 결제 정보 관리",
  },
];

export default function SettingsHub() {
  const { user } = useAuth();

  return (
    <PageShell size="sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Settings size={20} className="text-slate-400" />
        <h1 className="text-lg font-bold text-slate-900">설정</h1>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 mb-6 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-base font-black text-white shrink-0"
          style={{ background: "var(--blueprint-accent)" }}
        >
          {(user?.user_name?.[0] ?? "U").toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900">{user?.user_name || "사용자"}</p>
          <p className="text-sm text-slate-500 truncate">{user?.mail_idno || ""}</p>
        </div>
      </div>

      {/* Section links */}
      <div className="space-y-2">
        {sections.map(({ path, icon: Icon, label, desc }) => (
          <Link key={path} href={path}>
            <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition cursor-pointer group">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Icon size={17} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition" />
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
