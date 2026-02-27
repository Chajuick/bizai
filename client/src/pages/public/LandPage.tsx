import * as React from "react";
import { getLoginUrl } from "@/const";
import { ArrowRight, BadgeCheck, Brain, Calendar, CheckCircle2, Mic, Shield, Smartphone, Sparkles, TrendingUp, Workflow, ShoppingCart, BookOpen } from "lucide-react";

import LogoAvatar from "@/components/focuswin/common/ui/avatar";
import AppFooter from "@/components/focuswin/common/app-footer";
import HeroDemo from "@/components/focuswin/landing/hero-demo";

export default function LandPage() {
  const LOGO_SRC = "/brand/bizai-icon-512.png";

  const features = [
    { icon: Mic, title: "음성 기록", desc: "현장에서 바로 녹음으로 입력" },
    { icon: Brain, title: "AI 자동 분석", desc: "고객·금액·다음 액션 추출" },
    { icon: Calendar, title: "일정 자동 생성", desc: "누락 없이 일정으로 자동 등록" },
    { icon: BookOpen, title: "영업일지", desc: "기록이 보고서처럼 정리됩니다" },
    { icon: ShoppingCart, title: "수주 상태 추적", desc: "제안→협상→확정 흐름 관리" },
    { icon: TrendingUp, title: "납품/매출 관리", desc: "청구→수금까지 한 번에" },
  ];

  const faqs = [
    {
      q: "녹음만 하면 정말로 일정이 자동으로 만들어지나요?",
      a: "네. 음성을 텍스트로 변환한 뒤, AI가 일정과 핵심 정보를 구조화합니다. 사용자는 결과를 확인/수정만 하면 됩니다.",
    },
    {
      q: "현장에서 네트워크가 불안정해도 쓸 수 있나요?",
      a: "기록(텍스트/녹음)만 간단하게 남겨주세요. 남겨둔 기록을 바탕으로, AI가 분석을 통해 데이터를 정리합니다.",
    },
    {
      q: "AI가 고객사를 잘못 인식하면 어떻게 되나요?",
      a: "AI 결과는 항상 사용자가 최종 확인합니다. 기존 고객사와 유사한 이름이 있으면 항상 사용자에게 먼저 물어봐요.",
    },
    {
      q: "내 데이터는 안전하게 관리되나요?",
      a: "세션 쿠키 기반 인증 흐름을 사용하고, 파일은 스토리지 업로드 후 접근 권한을 통제하여 안전하게 보관됩니다.",
    },
    {
      q: "모바일에서도 사용하기 편한가요?",
      a: "네. 현장 영업을 기준으로 설계되어, 모바일에서 녹음/입력/확인 흐름이 빠르게 끝나도록 최적화 되었습니다.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 page-enter">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoAvatar src={LOGO_SRC} />
            <span className="font-black tracking-tight text-slate-900">BizAI</span>
            <span className="text-xs text-slate-400">v1.0</span>
          </div>

          <a href={getLoginUrl()} className="inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">
            무료로 시작하기
            <ArrowRight size={16} />
          </a>
        </div>
      </header>

      {/* Background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-blue-50/60 via-white to-white" />

      <main className="mx-auto max-w-6xl px-4">
        {/* HERO */}
        <section className="pt-10 sm:pt-12 pb-10 sm:pb-14">
          <div className="mt-6 grid lg:grid-cols-2 gap-10 items-center">
            {/* Left */}
            <div className="min-w-0">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                AI AUTOMATION
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                현장에서는 <span className="text-blue-600">녹음</span>만.
                <br />
                나머지는 <span className="text-blue-600">AI가</span> 정리합니다.
              </h1>

              <p className="mt-4 text-slate-600 leading-relaxed">
                음성 데이터를 통해<span className="font-semibold text-slate-800"> 고객·영업일지·일정</span>까지 자동으로 정리.
                <br className="hidden sm:block" />
                보고/관리용 데이터가 자연스럽게 쌓이는 영업 도구
              </p>

              <div className="mt-6 grid gap-2 text-sm text-slate-700">
                <Bullet icon={CheckCircle2} text="녹음 1번으로 영업일지 자동 작성" />
                <Bullet icon={CheckCircle2} text="AI가 일정/다음 액션까지 자동 추출" />
                <Bullet icon={CheckCircle2} text="수주·납품·매출까지 흐름으로 추적" />
              </div>

              {/* CTA: Primary 1 + Secondary link (잡다함 감소) */}
              <div className="mt-7 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <a href={getLoginUrl()} className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-bold bg-blue-600 text-white hover:bg-blue-700 transition">
                  무료로 시작하기
                  <ArrowRight size={18} />
                </a>

                <a href="#how" className="inline-flex items-center justify-center rounded-2xl px-2 py-3 font-semibold text-slate-700 hover:text-slate-900 transition">
                  어떻게 작동하나요?
                  <span className="ml-1 text-slate-400">→</span>
                </a>
              </div>

              {/* Trust chips (3개 유지하되 단순하게) */}
              <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-500">
                <Pill>모바일 최적화</Pill>
                <Pill>자동 구조화</Pill>
                <Pill>상태 기반 추적</Pill>
              </div>
            </div>

            {/* Right: Compact Demo (Before → After) */}
            <div className="lg:justify-self-end w-full">
              <div
                className={[
                  "rounded-3xl border border-slate-200/70 bg-white",
                  "shadow-[0_18px_60px_rgba(15,23,42,0.10)]",
                  "p-5 sm:p-6",
                  // ✅ 히어로 균형: 너무 길어지지 않게 상한을 걸고 내부는 딱 보이는 만큼만
                  "max-h-[520px] sm:max-h-[560px]",
                  "overflow-hidden",
                ].join(" ")}
              >
                <HeroDemo />
              </div>

              {/* ✅ 오른쪽 아래 안내 (과잉 장식 X) */}
              <p className="mt-3 text-xs text-slate-400 text-center lg:text-right">“녹음 → 구조화 → 생성” 흐름만 핵심으로 보여줍니다.</p>
            </div>
          </div>
        </section>

        {/* HOW */}
        <section id="how" className="pb-14 sm:pb-16">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">녹음부터 관리까지, 자동 흐름</h2>
            <p className="mt-2 text-slate-600">내가 정리하던 일을 BizAI가 대신합니다.</p>
          </div>

          <div className="mt-6">
            <div className="grid gap-3 lg:grid-cols-3">
              <FlowCard step="STEP 1" title="현장 기록" desc="음성 녹음 또는 텍스트 입력" icon={Mic} />
              <FlowCard step="STEP 2" title="AI 구조화" desc="고객/금액/일정/다음 액션 자동 추출" icon={Brain} />
              <FlowCard step="STEP 3" title="자동 등록 & 추적" desc="일정 생성 + 수주/납품/매출 흐름 관리" icon={Workflow} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MiniStat icon={Smartphone} title="모바일 우선" desc="현장에서 끝나는 입력" />
              <MiniStat icon={Shield} title="안전한 인증" desc="세션 쿠키 기반 인증 흐름" />
              <MiniStat icon={BadgeCheck} title="확인/수정" desc="AI 결과는 최종 검수 가능" />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="pb-14 sm:pb-16">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">필요한 기능만, 딱 깔끔하게</h2>
            <p className="mt-2 text-slate-600">영업 흐름에 꼭 필요한 핵심만 담았습니다.</p>
          </div>

          <div className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {features.map(f => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className={[
                      "rounded-3xl bg-white",
                      "border border-slate-200/70",
                      "p-4 shadow-sm",
                      // ✅ 랜딩에서는 과한 -translate 제거 (잡다함 체감 줄어듦)
                      "hover:shadow-md transition",
                    ].join(" ")}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <Icon size={18} className="text-blue-600" />
                    </div>
                    <p className="mt-3 text-sm font-black text-slate-900">{f.title}</p>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA strip */}
          <div className="mt-10 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-black text-slate-900">현장 기록을 ‘보고 가능한 데이터’로 바꾸세요</p>
                <p className="mt-1 text-sm text-slate-600">기록 누락을 줄이고, 다음 액션이 남는 영업 루틴을 만듭니다.</p>
              </div>

              <a href={getLoginUrl()} className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-bold bg-blue-600 text-white hover:bg-blue-700 transition">
                무료로 시작하기
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="pb-14 sm:pb-16">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">자주 묻는 질문</h2>
            <p className="mt-2 text-slate-600">도입 전에 많이 물어보는 질문을 정리했어요.</p>
          </div>

          <div className="mt-6 rounded-3xl bg-white border border-slate-200/70 shadow-sm divide-y divide-slate-100">
            {faqs.map(f => (
              <FaqRow key={f.q} q={f.q} a={f.a} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <a href={getLoginUrl()} className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-bold bg-blue-600 text-white hover:bg-blue-700 transition">
              지금 시작하기
              <ArrowRight size={18} />
            </a>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}

/* ---------- UI Bits ---------- */

function Bullet({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={18} className="text-blue-600 mt-0.5" />
      <p className="text-sm text-slate-700">{text}</p>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">{children}</span>;
}

function FlowCard({ step, title, desc, icon: Icon }: { step: string; title: string; desc: string; icon: any }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black text-slate-400">{step}</p>
          <p className="mt-1 text-base font-black text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">{desc}</p>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-blue-600" />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200/70 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
          <Icon size={16} className="text-slate-700" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function FaqRow({ q, a }: { q: string; a: string }) {
  return (
    <div className="p-5">
      <p className="text-sm font-black text-slate-900">{q}</p>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{a}</p>
    </div>
  );
}

/* ---------- Hero Demo UI ---------- */

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 p-3 shadow-sm">
      <p className="text-[11px] text-slate-500 font-semibold">{label}</p>
      <p className="mt-0.5 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function DemoPanel({ title, subtitle, rightTag, tone = "after", children }: { title: string; subtitle: string; rightTag?: string; tone?: "before" | "after"; children: React.ReactNode }) {
  const toneCls = tone === "before" ? "bg-white border-slate-200/70" : "bg-gradient-to-b from-white to-slate-50 border-slate-200/70";

  return (
    <div className={`rounded-3xl border p-4 ${toneCls}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black text-slate-400">{title}</p>
          <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
        </div>
        {rightTag ? <span className="text-[11px] font-semibold text-slate-400 rounded-full border border-slate-200 px-2 py-0.5">{rightTag}</span> : null}
      </div>

      <div className="mt-3">{children}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-slate-400 font-semibold">{label}</p>
      <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">{value}</p>
    </div>
  );
}

function ScheduleRow({ title, meta, badge, badgeTone }: { title: string; meta: string; badge: string; badgeTone: "blue" | "orange" }) {
  const cls = badgeTone === "orange" ? "bg-orange-50 border-orange-100 text-orange-700" : "bg-blue-50 border-blue-100 text-blue-700";

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 px-3 py-2 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-black text-slate-900 truncate">{title}</p>
        <p className="mt-0.5 text-[11px] text-slate-500 truncate">{meta}</p>
      </div>
      <span className={`shrink-0 text-[11px] font-black border rounded-full px-2 py-0.5 ${cls}`}>{badge}</span>
    </div>
  );
}
