import React, { useMemo, useState } from "react";
import { useLocation, Link } from "wouter";
import { LayoutDashboard, BookOpen, Calendar, ShoppingCart, TrendingUp, Users, Menu, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";

import LogoSlot from "@/components/focuswin/logo-slot";

const navItems = [
  { path: "/", label: "대시보드", icon: LayoutDashboard, shortLabel: "홈" },
  { path: "/sales-logs", label: "영업일지", icon: BookOpen, shortLabel: "일지" },
  { path: "/promises", label: "일정", icon: Calendar, shortLabel: "일정" },
  { path: "/orders", label: "수주", icon: ShoppingCart, shortLabel: "수주" },
  { path: "/deliveries", label: "납품/매출", icon: TrendingUp, shortLabel: "매출" },
  { path: "/clients", label: "고객사", icon: Users, shortLabel: "고객" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ 로고 아이콘(원하면 경로만 바꿔 끼우기)
  const LOGO_SRC = "/brand/bizai-icon-512.png";

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  const userInitial = useMemo(() => {
    const n = user?.name?.trim();
    if (!n) return "U";
    return n[0].toUpperCase();
  }, [user?.name]);

  return (
    <div className="h-[100dvh] overflow-hidden flex bg-[color:var(--blueprint-bg)]">
      {/* Desktop Sidebar */}
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
            <LogoSlot src={LOGO_SRC} size={40} className="rounded-2xl" />

            <div className="min-w-0">
              <p className="font-black text-[color:var(--blueprint-text)] text-sm tracking-tight">BizAI</p>
              <p className="text-xs text-slate-500 truncate">영업 관리 시스템</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4">
          <p className="bp-section-header mb-3">NAVIGATION</p>

          <div className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={[
                      "group flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition cursor-pointer",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200",
                      active ? "bg-blue-50 text-blue-700 border border-blue-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    ].join(" ")}
                    style={active ? { boxShadow: "0 10px 24px rgba(37,99,235,0.08)" } : undefined}
                  >
                    <Icon size={18} className={active ? "text-blue-700" : "text-slate-400 group-hover:text-slate-700"} />

                    <span className="flex-1">{item.label}</span>

                    {/* active indicator */}
                    <span className={["w-1.5 h-1.5 rounded-full transition", active ? "bg-blue-600" : "bg-transparent group-hover:bg-slate-300"].join(" ")} />
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User */}
        <div className="p-4 border-t" style={{ borderColor: "var(--blueprint-border)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
              style={{
                background: "var(--blueprint-accent)",
                boxShadow: "0 10px 26px rgba(37,99,235,0.22)",
              }}
            >
              {userInitial}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[color:var(--blueprint-text)] truncate">{user?.name || "사용자"}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || ""}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs rounded-2xl"
            style={{
              borderColor: "rgba(15,23,42,0.12)",
              color: "rgba(15,23,42,0.72)",
              background: "transparent",
            }}
            onClick={() => logout()}
          >
            로그아웃
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />

          <aside
            className="relative w-72 flex flex-col border-r"
            style={{
              background: "var(--blueprint-surface)",
              borderColor: "var(--blueprint-border)",
            }}
          >
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "var(--blueprint-border)" }}>
              <div className="flex items-center gap-3">
                <LogoSlot src={LOGO_SRC} size={36} className="rounded-2xl" />
                <span className="font-black text-[color:var(--blueprint-text)]">BizAI</span>
              </div>

              <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-50 transition" aria-label="메뉴 닫기">
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={[
                        "flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-semibold transition cursor-pointer",
                        active ? "bg-blue-50 text-blue-700 border border-blue-100" : "text-slate-700 hover:bg-slate-50",
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

            <div className="p-4 border-t pb-20" style={{ borderColor: "var(--blueprint-border)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{
                    background: "var(--blueprint-accent)",
                    boxShadow: "0 10px 26px rgba(37,99,235,0.22)",
                  }}
                >
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[color:var(--blueprint-text)] truncate">{user?.name || "사용자"}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || ""}</p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs rounded-2xl"
                style={{
                  borderColor: "rgba(15,23,42,0.12)",
                  color: "rgba(15,23,42,0.72)",
                  background: "transparent",
                }}
                onClick={() => logout()}
              >
                로그아웃
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
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
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition" aria-label="메뉴 열기">
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2">
            <LogoSlot src={LOGO_SRC} size={28} className="rounded-2xl" />
            <span className="font-black text-slate-900 text-sm">BizAI</span>
          </div>

          <div className="w-9" />
        </header>

        {/* Page Content */}
        <main className="flex-1 min-h-0 overflow-y-auto lg:pb-6" style={{ scrollbarGutter: "stable both-edges" }}>
          <div className="page-enter">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav lg:hidden">
        {navItems.map(item => {
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
                style={{
                  transform: active ? "translateY(-1px)" : "translateY(0px)", // ✅ 미세하게 떠오르는 느낌
                }}
              >
                <Icon size={20} strokeWidth={active ? 2.6 : 1.7} />
                <span className="text-[10px] font-semibold">{item.shortLabel}</span>

                {/* ✅ active dot */}
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
