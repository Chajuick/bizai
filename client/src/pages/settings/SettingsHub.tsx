// src/pages/settings/SettingsHub.tsx

// #region Imports
import { Link } from "wouter";
import { useEffect, useState } from "react";

import {
  BarChart3,
  ChevronRight,
  CreditCard,
  Settings,
  Users2,
  Pencil,
  Building2,
  Zap,
  AlertTriangle,
} from "lucide-react";

import PageShell from "@/components/focuswin/common/page-shell";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
// #endregion


// #region Section Config
const sections = [
  {
    path: "/settings/team",
    icon: Users2,
    label: "팀 관리",
    desc: "멤버 초대, 멤버 권한 설정, 초대 링크 관리",
  },
  {
    path: "/settings/usage",
    icon: BarChart3,
    label: "사용량",
    desc: "AI 사용량 및 기능별 통계 확인",
  },
  {
    path: "/settings/billing",
    icon: CreditCard,
    label: "플랜 / 결제",
    desc: "구독 플랜 및 결제 정보 관리",
  },
];
// #endregion


export default function SettingsHub() {
  // #region Hooks
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: context } = trpc.company.getMyCompanyContext.useQuery();
  const { data: billing } = trpc.billing.getSummary.useQuery();
  const { data: usage } = trpc.billing.getUsageSummary.useQuery();
  // #endregion


  // #region Team Name State
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (context?.comp_name) {
      setName(context.comp_name);
    }
  }, [context?.comp_name]);
  // #endregion


  // #region Mutation
  const updateName = trpc.company.updateCompanyName.useMutation({
    onSuccess: () => {
      utils.company.getMyCompanyContext.invalidate();
      setEditing(false);
    },
  });
  // #endregion


  // #region Helpers
  const changed = name.trim() !== context?.comp_name;

  const usageWarning =
    usage?.warning_level === "warning" || usage?.warning_level === "exceeded";
  // #endregion


  return (
    <PageShell size="sm">
      {/* #region Header */}
      <div className="flex items-center gap-2 mb-6">
        <Settings size={20} className="text-slate-400" />
        <h1 className="text-lg font-bold text-slate-900">설정</h1>
      </div>
      {/* #endregion */}



      {/* #region Profile Card */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 mb-6 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-base font-black text-white shrink-0"
          style={{ background: "var(--blueprint-accent)" }}
        >
          {(user?.user_name?.[0] ?? "U").toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="font-bold text-slate-900">
            {user?.user_name || "사용자"}
          </p>
          <p className="text-sm text-slate-500 truncate">
            {user?.mail_idno || ""}
          </p>
        </div>
      </div>
      {/* #endregion */}



      {/* #region Team Name Card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={14} className="text-slate-400" />
          <p className="text-xs text-slate-400">팀 이름</p>
        </div>

        {!editing ? (
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">
              {context?.comp_name || "-"}
            </p>

            <button
              onClick={() => {
                setName(context?.comp_name ?? "");
                setEditing(true);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <Pencil size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && changed) {
                  updateName.mutate({ comp_name: name });
                }
              }}
              className="h-10 px-3 rounded-xl border border-slate-200 text-sm flex-1"
            />

            <Button
              size="sm"
              disabled={!changed || updateName.isPending}
              onClick={() =>
                updateName.mutate({
                  comp_name: name,
                })
              }
            >
              {updateName.isPending ? "저장 중..." : "저장"}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setName(context?.comp_name ?? "");
              }}
            >
              취소
            </Button>
          </div>
        )}
      </div>
      {/* #endregion */}



      {/* #region Plan Card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">현재 플랜</p>
          <p className="text-sm font-semibold text-slate-900">
            {billing?.plan_name ?? "Free"}
          </p>
        </div>

        {usageWarning ? (
          <Link href="/settings/billing">
            <Button size="sm" className="flex items-center gap-1">
              <Zap size={14} />
              업그레이드
            </Button>
          </Link>
        ) : null}
      </div>
      {/* #endregion */}



      {/* #region Usage Warning */}
      {usageWarning && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-6">
          <AlertTriangle size={14} />
          AI 사용량이 한도에 가까워지고 있습니다.
        </div>
      )}
      {/* #endregion */}



      {/* #region Section Links */}
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

              <ChevronRight
                size={16}
                className="text-slate-300 group-hover:text-slate-500 transition"
              />
            </div>
          </Link>
        ))}
      </div>
      {/* #endregion */}
    </PageShell>
  );
}