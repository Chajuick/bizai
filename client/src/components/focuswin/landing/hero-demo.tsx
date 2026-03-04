// src/components/landing/DemoSalesLogLoop.tsx

// #region Imports
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Loader2,
  CheckCircle2,
  UploadCloud,
  Sparkles,
  Building2,
  User,
  Mail,
  Coins,
  CalendarClock,
  MapPin,
} from "lucide-react";
// #endregion

// #region Types
type Phase =
  | "idle"
  | "recording"
  | "transcribing"
  | "typing"
  | "aiSaving"
  | "result"
  | "reset";
// #endregion

// #region Demo Data
const SPOKEN_LINES = [
  "어… 오늘 A전자 쪽이랑 미팅했거든요.",
  "담당은 김민수 부장님… 아, 정확히는 구매팀 김민수 부장님이요.",
  "예산은 대략… 음 1200에서 1500 사이 생각하는 것 같고요.",
  "3월 말쯤에 내부 결재 한 번 올린다 했거든요.",
  "그리고 다음 주 화요일까지 견적서랑 제안서 같이 보내달라고 했어요.",
  "아, 담당자 이메일은 kimsu@aelec.co.kr 이었나… 맞을 거예요.",
  "그리고 한 가지 더, 기존 업체가 있어서 교체 이유 정리한 비교표도 있으면 좋겠다 했습니다.",
];

const RESULT = {
  company: "A전자",
  person: "김민수 부장",
  email: "kimsu@aelec.co.kr",
  amount: "₩12,000,000 ~ ₩15,000,000",
  visitAt: "2026-03-04 18:51",
  place: "서울 강남구",
  summary:
    "A전자 구매팀 김민수 부장과 미팅. 예산은 1,200~1,500만원 예상이며 3월 말 내부 결재 예정. 다음 주 화요일까지 견적서/제안서 발송 요청. 기존 업체 교체 사유 비교표도 희망.",
  actions: [
    { id: 1, title: "견적서/제안서 발송", when: "3월 10일(화) 오전 09:00", owner: "자사 과제" },
    { id: 2, title: "비교표(교체 사유) 정리", when: "3월 10일(화) 오전 09:00", owner: "자사 과제" },
    { id: 3, title: "내부 결재 일정 체크", when: "3월 31일(화) 오후 05:00", owner: "고객 과제" },
  ],
};
// #endregion

// #region Timeline (속도 조절)
const TIMING = {
  idleMs: 1400,
  recordingMs: 3600,
  transcribingMs: 1900,

  linePauseMs: 4,
  charMinMs: 4,
  charJitterMs: 10,
  lineEndPauseMs: 40,

  aiBannerMs: 1400,
  resultHoldMs: 3200,
  resultScrollMs: 1300,
  resetMs: 1200,
} as const;
// #endregion

// #region Utils
function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}

function formatMMSS(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

async function smoothScrollTo(el: HTMLElement, top: number, ms = 650) {
  const start = el.scrollTop;
  const diff = top - start;
  const t0 = performance.now();

  return new Promise<void>(resolve => {
    function tick(t: number) {
      const p = Math.min(1, (t - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.scrollTop = start + diff * eased;
      if (p < 1) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });
}
// #endregion

// #region Component
export default function DemoSalesLogLoop({
  className,
  loopDelayMs = 700,
}: {
  className?: string;
  loopDelayMs?: number;
}) {
  // #region Refs/State
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [recordSec, setRecordSec] = useState(0);

  const [typed, setTyped] = useState("");
  const [lineIdx, setLineIdx] = useState(0);

  const [showAiBanner, setShowAiBanner] = useState(false);
  const [fadeOutCompose, setFadeOutCompose] = useState(false);

  const script = useMemo(() => SPOKEN_LINES, []);
  // #endregion

  // #region Recording timer
  useEffect(() => {
    if (phase !== "recording") return;
    const id = window.setInterval(() => setRecordSec(s => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);
  // #endregion

  // #region Loop Orchestrator (tokenized + reset 화면 분리)
  const runIdRef = useRef(0);

  useEffect(() => {
    runIdRef.current += 1;
    const myRunId = runIdRef.current;
    let cancelled = false;

    const alive = () => !cancelled && runIdRef.current === myRunId;

    const safeSetPhase = (p: Phase) => alive() && setPhase(p);
    const safeSetRecordSec = (v: number) => alive() && setRecordSec(v);
    const safeSetTyped = (fn: (t: string) => string) => alive() && setTyped(fn);
    const safeResetTyped = () => alive() && setTyped("");
    const safeSetLineIdx = (i: number) => alive() && setLineIdx(i);
    const safeSetShowAiBanner = (b: boolean) => alive() && setShowAiBanner(b);
    const safeSetFadeOutCompose = (b: boolean) => alive() && setFadeOutCompose(b);

    const safeSleep = async (ms: number) => {
      const step = 50;
      let left = ms;
      while (left > 0) {
        if (!alive()) return false;
        const chunk = Math.min(step, left);
        await sleep(chunk);
        left -= chunk;
      }
      return alive();
    };

    async function run() {
      while (alive()) {
        const vp = viewportRef.current;

        // ✅ 사이클 시작 리셋
        safeSetPhase("idle");
        safeSetRecordSec(0);
        safeResetTyped();
        safeSetLineIdx(0);
        safeSetShowAiBanner(false);
        safeSetFadeOutCompose(false);
        if (vp) vp.scrollTop = 0;

        if (!(await safeSleep(TIMING.idleMs))) break;

        safeSetPhase("recording");
        safeSetRecordSec(0);
        if (!(await safeSleep(TIMING.recordingMs))) break;

        safeSetPhase("transcribing");
        if (!(await safeSleep(TIMING.transcribingMs))) break;

        safeSetPhase("typing");
        if (!(await safeSleep(260))) break;

        for (let i = 0; i < script.length && alive(); i++) {
          safeSetLineIdx(i);
          if (!(await safeSleep(TIMING.linePauseMs))) break;

          const line = script[i];
          for (let c = 0; c < line.length && alive(); c++) {
            safeSetTyped(t => t + line[c]);
            if (!(await safeSleep(TIMING.charMinMs + Math.random() * TIMING.charJitterMs))) break;
          }

          safeSetTyped(t => t + "\n");
          if (!(await safeSleep(TIMING.lineEndPauseMs))) break;
        }
        if (!alive()) break;

        safeSetShowAiBanner(true);
        safeSetFadeOutCompose(true);
        safeSetPhase("aiSaving");
        if (!(await safeSleep(TIMING.aiBannerMs))) break;

        safeSetPhase("result");

        const vp2 = viewportRef.current;
        if (vp2 && alive()) await smoothScrollTo(vp2, 0, 1);
        if (!(await safeSleep(TIMING.resultHoldMs))) break;

        const vp3 = viewportRef.current;
        if (vp3 && alive()) await smoothScrollTo(vp3, 340, TIMING.resultScrollMs);
        if (!(await safeSleep(2000))) break;

        // ✅ reset 단계에서는 compose로 튀지 않도록 "reset" 화면을 별도로 렌더
        //    그리고 AI 배너/페이드 상태도 바로 정리해서 플리커 방지
        safeSetShowAiBanner(false);
        safeSetFadeOutCompose(false);
        safeSetPhase("reset");
        if (!(await safeSleep(TIMING.resetMs))) break;

        if (!(await safeSleep(loopDelayMs))) break;
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [loopDelayMs, script]);
  // #endregion

  // #region Derived
  const isIdle = phase === "idle";
  const isRecording = phase === "recording";
  const isTranscribing = phase === "transcribing";
  const isTyping = phase === "typing";
  const isAiSaving = phase === "aiSaving";
  const isResult = phase === "result";
  const isReset = phase === "reset";

  const voiceStatusLabel =
    isRecording ? "녹음 중" : isTranscribing ? "텍스트 변환 중…" : isTyping ? "변환 완료" : "";

  const showDonePill = isTyping;

  // ✅ Compose/Result/Reset 화면 분리
  const showCompose =
    phase === "idle" || phase === "recording" || phase === "transcribing" || phase === "typing" || phase === "aiSaving";
  // #endregion

  return (
    <div className={cn("w-full", className)}>
      {/* Phone/Preview frame */}
      <div className="rounded-[28px] border border-slate-100 bg-white">
        <div>
          {/* Viewport (내부 스크롤 가능) */}
          <div
            ref={viewportRef}
            className={cn(
              "rounded-[22px] border border-slate-100",
              "h-[520px] overflow-y-auto overscroll-contain",
              "relative"
            )}
          >
            {/* content */}
            <div className="px-4 py-4">
              {showCompose ? (
                <div className={cn("transition-opacity duration-300", fadeOutCompose && "opacity-55")}>
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <button className="w-8 h-8 rounded-2xl hover:bg-white/70 grid place-items-center transition">
                        <ArrowLeft size={16} className="text-slate-500" />
                      </button>
                      <div>
                        <p className="text-[11px] tracking-[0.16em] text-slate-400 font-extrabold">NEW LOG</p>
                        <p className="text-base font-black text-slate-900 -mt-0.5">영업일지 작성</p>
                        <p className="text-xs text-slate-500 mt-1">내용을 기록하면 AI가 일정/요약을 도와줘요</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-9 px-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs grid place-items-center">
                        저장
                      </div>
                      <div
                        className={cn(
                          "h-9 px-3 rounded-2xl text-white text-xs grid place-items-center",
                          isAiSaving ? "bg-blue-600" : "bg-blue-700"
                        )}
                      >
                        {isAiSaving ? "AI 저장…" : "AI 저장"}
                      </div>
                    </div>
                  </div>

                  {/* Banner (AI saving) */}
                  <div
                    className={cn(
                      "rounded-3xl border border-blue-100 bg-blue-50 px-4 flex items-center gap-3 transition-all duration-300",
                      showAiBanner ? "py-3 mt-3 opacity-100 translate-y-0" : "opacity-0 -translate-y-1 h-0 p-0 border-transparent"
                    )}
                  >
                    <div className="w-9 h-9 rounded-2xl bg-white border border-blue-100 grid place-items-center">
                      <Loader2 size={16} className="animate-spin text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900">저장 & AI 분석 중…</p>
                      <p className="text-xs text-slate-600 mt-0.5">일정/금액/후속 액션을 추출하고 있어요</p>
                    </div>
                  </div>

                  {/* Voice Card */}
                  <div className="mt-4 rounded-3xl border border-slate-100 bg-white p-4">
                    <div className="flex flex-col items-start gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 grid place-items-center">
                          <Mic size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">음성 입력</p>
                          <p className="text-xs text-slate-500 mt-1">
                            음성 녹음 또는 파일 첨부로 텍스트를 추출합니다.
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2">
                          {isIdle && (
                            <>
                              <PillButton tone="blue" icon={<Mic size={15} />} label="음성 녹음" />
                              <PillButton
                                tone="violet"
                                icon={<UploadCloud size={15} />}
                                label="음성 파일 첨부 (최대 50MB)"
                              />
                            </>
                          )}

                          {isRecording && (
                            <div className="inline-flex items-center gap-3 px-4 h-9 rounded-2xl border border-red-200 bg-red-50 text-red-600 font-bold text-xs">
                              <span className="inline-flex items-center gap-2">
                                <span className="w-6 h-6 rounded-xl bg-white/70 grid place-items-center">
                                  <MicOff size={14} className="text-red-500" />
                                </span>
                                <WaveMini />
                              </span>
                              <span className="font-mono tabular-nums">{formatMMSS(recordSec)}</span>
                              <span className="ml-1">중지</span>
                            </div>
                          )}

                          {isTranscribing && (
                            <div className="inline-flex items-center gap-2 px-4 h-9 rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 font-bold text-xs">
                              <Loader2 size={14} className="animate-spin" />
                              텍스트 변환 중…
                              <span className="ml-2 opacity-75 font-semibold">취소</span>
                            </div>
                          )}

                          {showDonePill && (
                            <div className="inline-flex items-center gap-2 px-4 h-9 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-xs">
                              <CheckCircle2 size={14} />
                              변환 완료
                            </div>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 mt-3">지원 형식: MP3, M4A, WAV, WEBM, OGG, FLAC, AAC</p>

                        {(isRecording || isTranscribing || isTyping) && (
                          <p className="text-[11px] text-slate-500 mt-2">
                            상태: <span className="font-bold">{voiceStatusLabel}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Text Card */}
                  <div className="mt-4 rounded-3xl border border-slate-100 bg-white p-4">
                    <div className="flex flex-col items-start gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-violet-50 grid place-items-center">
                          <Sparkles size={18} className="text-violet-700" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">내용</p>
                          <p className="text-xs text-slate-500 mt-1">
                            텍스트로 기록하면 AI가 고객/일정/금액/다음 액션을 자동 추출해요.
                          </p>
                        </div>
                      </div>
                      <div className="w-full">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 min-h-[168px]">
                          {typed ? (
                            <pre className="whitespace-pre-wrap text-xs leading-6 text-slate-800 font-medium">
                              {typed}
                              {(isTranscribing || isTyping) && (
                                <span className="inline-block w-2 h-4 bg-slate-300 align-middle ml-1 animate-pulse" />
                              )}
                            </pre>
                          ) : (
                            <p className="text-xs text-slate-400">
                              예: “오늘 삼성전자 홍길동 부장님과 미팅. 다음 주 화요일 오전 10시에 제안서 발표. 예산 5천만원.”
                            </p>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-[11px] text-slate-400">
                            팁: “언제/누구/무엇/다음 일정/금액”이 들어가면 정확도가 좋아져요.
                          </p>
                          <p className="text-[11px] text-slate-400 tabular-nums">{typed.length}자</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* spacer to enable scroll */}
                  <div className="h-16" />
                </div>
              ) : isResult ? (
                <div className="animate-in fade-in-0 duration-300">
                  {/* RESULT PAGE */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <button className="w-8 h-8 rounded-2xl hover:bg-white/70 grid place-items-center transition">
                        <ArrowLeft size={16} className="text-slate-500" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-black text-slate-900">{RESULT.company}</p>
                          <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-bold">
                            AI 완료
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">3월 4일 오후 06:51</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-9 h-9 rounded-2xl border border-slate-200 bg-white" />
                      <div className="w-9 h-9 rounded-2xl border border-slate-200 bg-white" />
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="mt-4 rounded-3xl border border-slate-100 bg-white p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Meta icon={<Building2 size={15} className="text-blue-600" />} label="고객사" value={RESULT.company} />
                      <Meta icon={<User size={15} className="text-blue-600" />} label="담당자" value={RESULT.person} />
                      <Meta icon={<Mail size={15} className="text-blue-600" />} label="이메일" value={RESULT.email} />
                      <Meta icon={<Coins size={15} className="text-amber-600" />} label="금액" value={RESULT.amount} />
                      <Meta icon={<CalendarClock size={15} className="text-slate-600" />} label="방문 일시" value={RESULT.visitAt} />
                      <Meta icon={<MapPin size={15} className="text-slate-600" />} label="장소" value={RESULT.place} />
                    </div>
                  </div>

                  {/* AI 분석 */}
                  <div className="mt-4 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-violet-100 grid place-items-center">
                        <Sparkles size={18} className="text-violet-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-900">AI 분석</p>
                        <p className="text-xs text-slate-500 mt-1">미팅 핵심 요약과 후속 조치를 정리했어요</p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                      <p className="text-sm text-slate-800 leading-6 font-medium">{RESULT.summary}</p>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-black text-slate-900">후속 조치</p>
                      <div className="mt-2 space-y-2">
                        {RESULT.actions.map(a => (
                          <div key={a.id} className="rounded-3xl border border-slate-100 bg-white p-4">
                            <p className="text-sm font-black text-slate-900">
                              <span className="text-violet-700 mr-2">{String(a.id).padStart(2, "0")}</span>
                              {a.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {a.when} · <span className="font-semibold">{a.owner}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="h-20" />
                  </div>
                </div>
              ) : (
                // ✅ RESET SCREEN (result → compose 사이 플리커 제거)
                <div className="h-[520px] grid place-items-center">
                  <div className="w-full">
                    <div className="mx-auto w-[92%] rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 grid place-items-center">
                          <Loader2 size={18} className="animate-spin text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900">다음 로그 준비 중…</p>
                          <p className="text-xs text-slate-500 mt-1">데모 루프를 초기화하고 있어요</p>
                        </div>
                      </div>

                      <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full w-1/3 bg-slate-300 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inline keyframes (wave) */}
        <style>{`
          @keyframes demoWave {
            0% { transform: scaleY(.35); opacity: .6; }
            50% { transform: scaleY(1); opacity: 1; }
            100% { transform: scaleY(.35); opacity: .6; }
          }
        `}</style>
      </div>
    </div>
  );
}
// #endregion

// #region Sub UI
function PillButton({
  tone,
  icon,
  label,
}: {
  tone: "blue" | "violet";
  icon: React.ReactNode;
  label: string;
}) {
  const cls =
    tone === "blue"
      ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
      : "bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100";

  return (
    <div className={cn("inline-flex items-center gap-2 px-4 h-9 rounded-2xl border", "text-xs font-bold transition", cls)}>
      {icon}
      {label}
    </div>
  );
}

function WaveMini() {
  return (
    <div className="flex items-end gap-1 h-5">
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="w-1 rounded-full"
          style={{
            height: 4 + i * 2,
            background: "#f87171",
            transformOrigin: "bottom",
            animation: `demoWave 680ms ease-in-out ${i * 90}ms infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-3 flex items-start gap-2">
      <div className="w-8 h-8 rounded-2xl bg-slate-50 border border-slate-100 grid place-items-center">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 font-bold">{label}</p>
        <p className="text-xs font-black text-slate-900 mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
}
// #endregion