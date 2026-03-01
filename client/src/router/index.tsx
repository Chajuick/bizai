// src/router/index.tsx
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { AuthRoutes } from "./auth";
import { AppRoutes } from "./app";
import { popAuthRedirect } from "./redirect";

function FullscreenLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-500">불러오는 중…</p>
      </div>
    </div>
  );
}

export default function Router() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const pendingRef = useRef<string | null>(null);
  const didNavigateRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    if (didNavigateRef.current) return;

    // pop은 한 번만
    if (pendingRef.current === null) {
      pendingRef.current = popAuthRedirect();
    }

    const pending = pendingRef.current;

    // 방어: auth 경로면 무시
    if (pending && !pending.startsWith("/auth/")) {
      didNavigateRef.current = true;
      navigate(pending, { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) return <FullscreenLoading />;

  return isAuthenticated ? <AppRoutes /> : <AuthRoutes />;
}