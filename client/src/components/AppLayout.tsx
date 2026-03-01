import React, { useMemo, useState } from "react";
import { useLocation, Link } from "wouter";
import {
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Hash,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShoppingCart,
  TrendingUp,
  Users,
  Users2,
  X,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/focuswin/common/ui/button";
import LogoAvatar from "@/components/focuswin/common/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/focuswin/common/ui/popover";
import { useWorkspaceSwitcher } from "@/hooks/focuswin/company/useWorkspaceSwitcher";

// ─── Nav items (업무 중심) ───────────────────────────────────────────────────
const navItems = [
  { path: "/", label: "대시보드", icon: LayoutDashboard, shortLabel: "홈" },
  { path: "/sale-list", label: "영업일지", icon: BookOpen, shortLabel: "일지" },
  { path: "/sche-list", label: "일정", icon: Calendar, shortLabel: "일정" },
  { path: "/orde-list", label: "수주", icon: ShoppingCart, shortLabel: "수주" },
  { path: "/ship-list", label: "납품/매출", icon: TrendingUp, shortLabel: "매출" },
  { path: "/clie-list", label: "고객사", icon: Users, shortLabel: "고객" },
];

// ─── Plan badge styles ───────────────────────────────────────────────────────
const PLAN_BADGE_CLASS: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  pro: "bg-blue-100 text-blue-700",
  team: "bg-purple-100 text-purple-700",
  enterprise: "bg-amber-100 text-amber-700",
};

// ─── Account menu items ──────────────────────────────────────────────────────
const accountMenuItems = [
  { path: "/settings", label: "설정", icon: Settings },
  { path: "/settings/team", label: "팀 관리", icon: Users2 },
  { path: "/settings/usage", label: "사용량", icon: BarChart3 },
  { path: "/settings/billing", label: "플랜/결제", icon: CreditCard },
];

// ─── WorkspaceSwitcher ───────────────────────────────────────────────────────
function WorkspaceSwitcher() {
  const { currentCompIdno, currentCompName, planCode, companies, switchCompany } =
    useWorkspaceSwitcher();
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  return (
    <div className="relative">
      <button
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl hover:bg-slate-50 transition text-left"
        onClick={() => setOpen(!open)}
        aria-label="워크스페이스 전환"
      >
        <Building2 size={15} className="text-slate-400 shrink-0" />
        <span className="flex-1 text-sm font-semibold text-slate-800 truncate min-w-0">
          {currentCompName ?? "로딩 중…"}
        </span>
        {planCode && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${PLAN_BADGE_CLASS[planCode] ?? PLAN_BADGE_CLASS.free}`}
          >
            {planCode}
          </span>
        )}
        <ChevronDown
          size={13}
          className={`text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 z-20 rounded-2xl border border-slate-100 bg-white shadow-lg overflow-hidden">
            {companies.length > 1 &&
              companies.map((c) => (
                <button
                  key={c.comp_idno}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-slate-50 transition text-left ${
                    c.comp_idno === currentCompIdno
                      ? "text-blue-700 font-semibold"
                      : "text-slate-700"
                  }`}
                  onClick={() => {
                    void switchCompany(c.comp_idno);
                    setOpen(false);
                  }}
                >
                  <Building2 size={13} className="shrink-0" />
                  <span className="truncate flex-1">{c.comp_name}</span>
                  {c.comp_idno === currentCompIdno && (
                    <Check size={13} className="text-blue-600 shrink-0" />
                  )}
                </button>
              ))}
            {companies.length > 1 && <div className="border-t border-slate-100" />}
            <button
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition text-left"
              onClick={() => {
                navigate("/invite/enter");
                setOpen(false);
              }}
            >
              <Hash size={13} className="shrink-0" />
              초대 코드 입력
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── AccountPopover (PC 전용) ────────────────────────────────────────────────
function AccountPopover({
  userInitial,
  userName,
  userEmail,
  onLogout,
}: {
  userInitial: string;
  userName: string;
  userEmail: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="w-full flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-slate-50 transition cursor-pointer group"
          aria-label="계정 메뉴 열기"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
            style={{
              background: "var(--blueprint-accent)",
              boxShadow: "0 10px 26px rgba(37,99,235,0.22)",
            }}
          >
            {userInitial}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-bold text-[color:var(--blueprint-text)] truncate">{userName}</p>
            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          </div>
          <ChevronRight
            size={14}
            className="text-slate-400 group-hover:text-slate-600 transition shrink-0"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent side="top" align="start" sideOffset={8} className="w-56">
        {/* User info header */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
          <p className="text-xs text-slate-500 truncate">{userEmail}</p>
        </div>

        {/* Menu items */}
        <div className="p-1.5 space-y-0.5">
          {accountMenuItems.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              onClick={() => { navigate(path); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <Icon size={15} className="text-slate-400" />
              {label}
            </button>
          ))}
        </div>

        {/* Invite code entry */}
        <div className="p-1.5 border-t border-slate-100">
          <button
            onClick={() => { navigate("/invite/enter"); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <Hash size={15} className="text-slate-400" />
            초대 코드 입력
          </button>
        </div>

        {/* Logout */}
        <div className="p-1.5 border-t border-slate-100">
          <button
            onClick={() => { onLogout(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
          >
            <LogOut size={15} />
            로그아웃
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── AppLayout ───────────────────────────────────────────────────────────────
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const LOGO_SRC = "/brand/bizai-icon-512.png";

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  const userInitial = useMemo(() => {
    const n = user?.user_name?.trim();
    if (!n) return "U";
    return n[0].toUpperCase();
  }, [user?.user_name]);

  const userName = user?.user_name || "사용자";
  const userEmail = user?.mail_idno || "";

  return (
    <div className="h-[100dvh] overflow-hidden flex bg-[color:var(--blueprint-bg)]">
      {/* ─── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 border-r"
        style={{
          background: "var(--blueprint-surface)",
          borderColor: "var(--blueprint-border)",
        }}
      >
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: "var(--blueprint-border)" }}>
          <div className="flex items-center gap-3">
            <LogoAvatar src={LOGO_SRC} size={40} className="rounded-2xl" />
            <div className="min-w-0">
              <p className="font-black text-[color:var(--blueprint-text)] text-sm tracking-tight">BizAI</p>
              <p className="text-xs text-slate-500 truncate">영업 관리 시스템</p>
            </div>
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="px-3 py-2 border-b" style={{ borderColor: "var(--blueprint-border)" }}>
          <WorkspaceSwitcher />
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4">
          <p className="bp-section-header mb-3">NAVIGATION</p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={[
                      "group flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition cursor-pointer",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200",
                      active
                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    ].join(" ")}
                    style={active ? { boxShadow: "0 10px 24px rgba(37,99,235,0.08)" } : undefined}
                  >
                    <Icon
                      size={18}
                      className={active ? "text-blue-700" : "text-slate-400 group-hover:text-slate-700"}
                    />
                    <span className="flex-1">{item.label}</span>
                    <span
                      className={[
                        "w-1.5 h-1.5 rounded-full transition",
                        active ? "bg-blue-600" : "bg-transparent group-hover:bg-slate-300",
                      ].join(" ")}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Account (클릭 → 팝오버) */}
        <div className="p-4 border-t" style={{ borderColor: "var(--blueprint-border)" }}>
          <AccountPopover
            userInitial={userInitial}
            userName={userName}
            userEmail={userEmail}
            onLogout={logout}
          />
        </div>
      </aside>

      {/* ─── Mobile Sidebar Overlay ───────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />

          <aside
            className="relative w-72 flex flex-col border-r"
            style={{
              background: "var(--blueprint-surface)",
              borderColor: "var(--blueprint-border)",
            }}
          >
            {/* Header */}
            <div
              className="p-5 border-b flex items-center justify-between"
              style={{ borderColor: "var(--blueprint-border)" }}
            >
              <div className="flex items-center gap-3">
                <LogoAvatar src={LOGO_SRC} size={36} className="rounded-2xl" />
                <span className="font-black text-[color:var(--blueprint-text)]">BizAI</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-500 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-50 transition"
                aria-label="메뉴 닫기"
              >
                <X size={18} />
              </button>
            </div>

            {/* Workspace Switcher (Mobile) */}
            <div className="px-3 py-2 border-b" style={{ borderColor: "var(--blueprint-border)" }}>
              <WorkspaceSwitcher />
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={[
                        "flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-semibold transition cursor-pointer",
                        active
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : "text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon size={18} className={active ? "text-blue-700" : "text-slate-400"} />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile 프로필 카드 (클릭 → /settings) */}
            <div
              className="p-4 border-t pb-6"
              style={{ borderColor: "var(--blueprint-border)" }}
            >
              <button
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition text-left"
                onClick={() => { navigate("/settings"); setSidebarOpen(false); }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                  style={{
                    background: "var(--blueprint-accent)",
                    boxShadow: "0 10px 26px rgba(37,99,235,0.22)",
                  }}
                >
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[color:var(--blueprint-text)] truncate">{userName}</p>
                  <p className="text-xs text-slate-500 truncate">{userEmail || "설정 보기"}</p>
                </div>
                <Settings size={15} className="text-slate-400 shrink-0" />
              </button>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 text-xs rounded-2xl text-red-500 border-red-100 hover:bg-red-50"
                onClick={() => logout()}
              >
                <LogOut size={13} className="mr-1.5" />
                로그아웃
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header
          className="lg:hidden flex items-center justify-between px-4 h-14 border-b shrink-0 sticky top-0 z-40"
          style={{
            background: "rgba(255,255,255,0.86)",
            borderColor: "rgba(15,23,42,0.08)",
            backdropFilter: "blur(18px)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition"
            aria-label="메뉴 열기"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2">
            <LogoAvatar src={LOGO_SRC} size={28} className="rounded-2xl" />
            <span className="font-black text-slate-900 text-sm">BizAI</span>
          </div>

          {/* Mobile: 설정 아이콘 버튼 */}
          <button
            onClick={() => navigate("/settings")}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition"
            aria-label="설정"
          >
            <Settings size={18} />
          </button>
        </header>

        {/* Page Content */}
        <main
          className="flex-1 min-h-0 overflow-y-auto lg:pb-6"
          style={{ scrollbarGutter: "stable both-edges" }}
        >
          <div className="page-enter">{children}</div>
        </main>
      </div>

      {/* ─── Mobile Bottom Nav ────────────────────────────────────────────── */}
      <nav className="mobile-nav lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={[
                  "relative flex flex-col items-center gap-1 px-3 py-2 rounded-2xl",
                  "transition-all duration-200 cursor-pointer min-w-[52px]",
                  active ? "text-blue-700" : "text-slate-500 hover:text-slate-800",
                ].join(" ")}
                style={{ transform: active ? "translateY(-1px)" : "translateY(0px)" }}
              >
                <Icon size={20} strokeWidth={active ? 2.6 : 1.7} />
                <span className="text-[10px] font-semibold">{item.shortLabel}</span>
                <span
                  className={[
                    "absolute -bottom-0.5 left-1/2 -translate-x-1/2",
                    "w-1.5 h-1.5 rounded-full transition-all duration-200",
                    active ? "bg-blue-600 opacity-100 scale-100" : "bg-slate-300 opacity-0 scale-75",
                  ].join(" ")}
                />
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
