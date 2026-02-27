import * as React from "react";
import LogoAvatar from "@/components/focuswin/common/ui/avatar";

const LOGO_SRC = "/brand/bizai-icon-512.png";

type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-7">
          <LogoAvatar src={LOGO_SRC} size={52} />
          <span className="font-black text-xl tracking-tight text-slate-900">BizAI</span>
          <p className="text-xs text-slate-500 -mt-1">AI 기반 영업관리</p>
        </div>

        {/* Card */}
        <div className="bp-card px-8 py-8">
          <h1 className="text-[22px] font-black text-slate-900 text-center">{title}</h1>
          <p className="mt-1 text-sm text-slate-500 text-center">{description}</p>

          <div className="mt-6">{children}</div>

          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>

        <p className="mt-5 text-center text-[11px] text-slate-400 leading-relaxed">
          로그인/가입 시 서비스 이용약관 및 개인정보처리방침에 동의합니다.
        </p>
      </div>
    </div>
  );
}