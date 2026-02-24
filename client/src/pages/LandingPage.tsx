import { getLoginUrl } from "@/const";
import {
  BookOpen,
  Calendar,
  ShoppingCart,
  TrendingUp,
  Mic,
  Brain,
  ArrowRight,
} from "lucide-react";

import LogoSlot from '@/components/ui/focuswin/logo-slot';

export default function LandingPage() {
  const features = [
    { icon: Mic, title: "음성 녹음", desc: "현장에서 바로 음성으로 기록" },
    { icon: Brain, title: "AI 자동 분석", desc: "LLM이 핵심 정보를 자동 추출" },
    { icon: BookOpen, title: "영업일지", desc: "체계적인 영업 활동 기록" },
    { icon: Calendar, title: "일정 관리", desc: "AI가 일정을 자동 등록" },
    { icon: ShoppingCart, title: "수주 관리", desc: "거래 진행 상태 추적" },
    { icon: TrendingUp, title: "매출 분석", desc: "실시간 매출 현황 파악" },
  ];

  // ✅ 로고 아이콘 경로만 바꿔 끼우면 됨 (public 폴더 기준)
  const LOGO_SRC = "/brand/bizai-icon-512.png"; // 예: public/brand/bizai-icon-512.png

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoSlot src={LOGO_SRC} />

            <span className="font-black tracking-tight text-slate-900">
              BizAI
            </span>
            <span className="text-xs text-slate-400">v1.0</span>
          </div>

          <a
            href={getLoginUrl()}
            className="inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            무료로 시작하기
            <ArrowRight size={16} />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        {/* Hero */}
        <section className="pt-12 pb-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            AI-POWERED SALES MANAGEMENT
          </div>

          <div className="mt-6 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                말하면 자동으로 정리되는
                <br />
                <span className="text-blue-600">AI 영업 관리</span>
              </h1>

              <p className="mt-4 text-slate-600 leading-relaxed">
                현장에서 녹음만 하면 고객·일정·수주가 자동으로 정리됩니다.
                <br className="hidden sm:block" />
                현장에서 바로 사용하는 모바일 최적화 영업 도구
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <a
                  href={getLoginUrl()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-bold bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  무료로 시작하기
                  <ArrowRight size={18} />
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-2xl px-6 py-3 font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                >
                  기능 보기
                </a>
              </div>

              {import.meta.env.DEV && (
                <div className="mt-4">
                  <a
                    href="/api/dev/login"
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    개발 모드 로그인 (로컬 전용)
                  </a>
                </div>
              )}

              {/* trust mini */}
              <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100">
                  빠른 입력
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100">
                  자동 분류
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100">
                  모바일 최적화
                </span>
              </div>
            </div>

            {/* Right visual card */}
            <div className="lg:justify-self-end w-full">
              <div className="rounded-3xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900">
                    오늘의 요약
                  </p>
                  <p className="text-xs text-slate-400">실시간</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <StatCard label="오늘 매출" value="₩ 1,240,000" />
                  <StatCard label="진행 수주" value="7건" />
                  <StatCard label="이번 달" value="₩ 18,900,000" />
                  <StatCard label="미수금" value="₩ 2,300,000" />
                </div>

                <div className="mt-5 rounded-2xl bg-white border border-slate-100 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    AI 인사이트
                  </p>
                  <p className="mt-1 text-sm text-slate-800">
                    이번 달 매출이 지난달 대비{" "}
                    <span className="font-bold text-blue-600">+12%</span>{" "}
                    증가했어요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="pb-16">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                필요한 기능만, 딱 깔끔하게
              </h2>
              <p className="mt-2 text-slate-600">
                1인 기업/소규모에서도 쓰기 쉬운 영업 관리 핵심 기능
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {features.map(f => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-3xl border border-slate-100 bg-white p-4 hover:shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition"
                >
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <Icon size={18} className="text-blue-600" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-900">
                    {f.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500">
          © {new Date().getFullYear()} BizAI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-4">
      <p className="text-xs text-slate-500 font-semibold">{label}</p>
      <p className="mt-1 text-base font-black text-slate-900">{value}</p>
    </div>
  );
}
