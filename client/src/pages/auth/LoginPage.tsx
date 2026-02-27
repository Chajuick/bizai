import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import AuthCard from "@/components/focuswin/auth/AuthCard";
import AuthProviderButton from "@/components/focuswin/auth/AuthProviderButton";
import AuthDivider from "@/components/focuswin/auth/AuthDivider";
import { Button } from "@/components/focuswin/common/ui/button";
import { Input } from "@/components/focuswin/common/ui/input";
import { trpc } from "@/lib/trpc";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const emailInvalid = !!error && !email;
  const passwordInvalid = !!error && !password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as any)?.error ?? "로그인에 실패했습니다.");
        return;
      }

      // 세션 쿠키가 설정됐으므로 auth 상태 갱신 후 홈으로
      await utils.auth.me.invalidate();
      setLocation("/");
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="로그인"
      description="BizAI 계정으로 시작하세요"
      footer={
        <p className="text-center text-xs text-slate-500">
          계정이 없으신가요?{" "}
          <a href="/auth/register" className="font-semibold text-blue-600 hover:underline">
            회원가입
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
          <label className="text-xs font-semibold text-slate-700">이메일</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={emailInvalid}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">비밀번호</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-invalid={passwordInvalid}
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
          {loading ? "로그인 중…" : "로그인"}
        </Button>
      </form>
    </AuthCard>
  );
}