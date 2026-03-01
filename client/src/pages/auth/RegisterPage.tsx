import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import AuthCard from "@/components/focuswin/auth/AuthCard";
import AuthProviderButton from "@/components/focuswin/auth/AuthProviderButton";
import AuthDivider from "@/components/focuswin/auth/AuthDivider";
import { Button } from "@/components/focuswin/common/ui/button";
import { Input } from "@/components/focuswin/common/ui/input";
import { trpc } from "@/lib/trpc";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const redirectTo = new URLSearchParams(window.location.search).get("redirect") ?? "/";

  useEffect(() => {
    if (redirectTo !== "/") {
      sessionStorage.setItem("auth_redirect", redirectTo);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409) {
          setError("이미 사용 중인 이메일입니다.");
        } else {
          setError((data as any)?.error ?? "회원가입에 실패했습니다.");
        }
        return;
      }

      await utils.auth.me.invalidate();
      sessionStorage.removeItem("auth_redirect");
      setLocation(redirectTo);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="회원가입"
      description="무료로 BizAI를 시작하세요"
      footer={
        <p className="text-center text-xs text-slate-500">
          이미 계정이 있으신가요?{" "}
          <a href="/auth/login" className="font-semibold text-blue-600 hover:underline">
            로그인
          </a>
        </p>
      }
    >
      {/* Google OAuth */}
      <AuthProviderButton href="/api/auth/google" />

      <AuthDivider />

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">
            이름 <span className="text-slate-400 font-normal">(선택)</span>
          </label>
          <Input
            type="text"
            placeholder="홍길동"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">이메일</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={!!error && !email}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">비밀번호</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="6자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              aria-invalid={!!error && !password}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error ? (
          <p role="alert" className="text-xs text-red-500 font-medium -mt-1">
            {error}
          </p>
        ) : null}

        <Button type="submit" tone="primary" variant="solid" fullWidth disabled={loading}>
          {loading ? "가입 중…" : "가입하기"}
        </Button>
      </form>
    </AuthCard>
  );
}