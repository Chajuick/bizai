import React from "react";
import { Mic, MicOff, Loader2, Sparkles, Brain } from "lucide-react";
import InfoCard from "@/components/focuswin/common/info-card";
import { Card, CardContent, CardHeader } from "@/components/focuswin/common/ui/card";

/**
 * ✅ Demo timings
 */
const RECORD_TIME = 3400;
const UPLOAD_TIME = 1600;
const TRANSCRIBE_TIME = 1200;
const EDITING_HOLD = 1200;
const ANALYZE_TIME = 2600;
const RESULT_HOLD = 11000;

/**
 * ✅ Layout stability
 */
const STAGE_H = 500;

/**
 * ✅ Curtain transition (black cut)
 */
const CURTAIN_IN_MS = 320;
const CURTAIN_OUT_MS = 380;
const CURTAIN_HOLD_MS = 100;

/**
 * ✅ Debug / Control
 * - debugPause: true면 자동 사이클이 돌지 않고 지정한 화면에서 "멈춤"
 * - debugStage: 멈출 화면 선택
 * - showDebugBar: 우상단 컨트롤 바 표시
 */
const debugPause = false as boolean;
type DebugStage = "regi_recording" | "regi_uploading" | "regi_transcribing" | "regi_editing" | "regi_analyzing" | "deta";
const debugStage: DebugStage = "regi_recording";
const showDebugBar = true as boolean;

type View = "regi" | "deta";
type Phase = "recording" | "uploading" | "transcribing" | "editing" | "analyzing";

const DEMO_TRANSCRIPT = "삼성전자 홍길동 부장 미팅. 다음 주 화요일 제안서 제출, 예산 약 5천만 원.";

export default function HeroDemo() {
  const [view, setView] = React.useState<View>("regi");
  const [phase, setPhase] = React.useState<Phase>("recording");
  const [memo, setMemo] = React.useState("");

  // ✅ Curtain opacity
  const [curtainOn, setCurtainOn] = React.useState(false);

  // ✅ Page enter animation retrigger
  const [enterKey, setEnterKey] = React.useState(0);

  // ✅ Runtime controls (편집/디버그용)
  const [paused, setPaused] = React.useState<boolean>(debugPause);
  const [stage, setStage] = React.useState<DebugStage>(debugStage);

  // -----------------------------
  // helpers
  // -----------------------------
  const applyStage = React.useCallback(
    (s: DebugStage) => {
      // 커튼은 끄고, 상태를 즉시 고정시켜 편집이 쉽게
      setCurtainOn(false);

      if (s === "deta") {
        setView("deta");
        setEnterKey((k) => k + 1);
        return;
      }

      setView("regi");
      setEnterKey((k) => k + 1);

      // regi_* stages
      const [, p] = s.split("_") as ["regi", Phase];
      setPhase(p);

      // memo는 transcribing 이후부터 보여주고 싶으면 이렇게
      if (p === "editing" || p === "analyzing") setMemo(DEMO_TRANSCRIPT);
      else if (p === "transcribing") setMemo("");
      else setMemo("");
    },
    []
  );

  const curtainSwitch = React.useCallback(
    async (aliveRef: React.MutableRefObject<boolean>, swap: () => void) => {
      setCurtainOn(true);
      await wait(CURTAIN_IN_MS);
      if (!aliveRef.current) return;

      await wait(CURTAIN_HOLD_MS);
      if (!aliveRef.current) return;

      swap();

      // ✅ swap 직후 1프레임 쉬면 레이아웃/paint가 안정적
      await new Promise<void>((r) => requestAnimationFrame(() => r()));

      setCurtainOn(false);
      await wait(CURTAIN_OUT_MS);
    },
    []
  );

  // -----------------------------
  // Main demo cycle (no setInterval; no overlap)
  // -----------------------------
  const aliveRef = React.useRef(true);

  React.useEffect(() => {
    aliveRef.current = true;

    let t: ReturnType<typeof setTimeout> | null = null;

    const cycle = async () => {
      if (!aliveRef.current) return;

      // ✅ paused면 지정 stage에 고정
      if (paused) {
        applyStage(stage);
        // paused 상태에서는 계속 돌지 않게 하고, 주기적으로만 체크
        t = setTimeout(cycle, 250);
        return;
      }

      // 1) 등록 화면 시작
      setView("regi");
      setEnterKey((k) => k + 1);

      setPhase("recording");
      setMemo("");
      setCurtainOn(false);

      await wait(RECORD_TIME);
      if (!aliveRef.current) return;

      setPhase("uploading");
      await wait(UPLOAD_TIME);
      if (!aliveRef.current) return;

      setPhase("transcribing");
      await wait(TRANSCRIBE_TIME);
      if (!aliveRef.current) return;

      // 변환 결과 주입
      setMemo(DEMO_TRANSCRIPT);

      setPhase("editing");
      await wait(EDITING_HOLD);
      if (!aliveRef.current) return;

      setPhase("analyzing");
      await wait(ANALYZE_TIME);
      if (!aliveRef.current) return;

      // 2) 커튼 닫기 → 상세 화면 전환 → 커튼 열기
      await curtainSwitch(aliveRef, () => {
        setView("deta");
        setEnterKey((k) => k + 1);
      });
      if (!aliveRef.current) return;

      // 3) 결과 화면 유지
      await wait(RESULT_HOLD);
      if (!aliveRef.current) return;

      // 4) 다시 등록 화면으로
      await curtainSwitch(aliveRef, () => {
        setView("regi");
        setPhase("recording");
        setMemo("");
        setEnterKey((k) => k + 1);
      });
      if (!aliveRef.current) return;

      // 다음 사이클 (겹침 방지)
      t = setTimeout(cycle, 800);
    };

    cycle();

    return () => {
      aliveRef.current = false;
      if (t) clearTimeout(t);
    };
  }, [paused, stage, applyStage, curtainSwitch]);

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="relative" style={{ height: STAGE_H }}>
      {/* ✅ Debug bar (optional) */}
      {showDebugBar ? (
        <DebugBar
          paused={paused}
          stage={stage}
          setPaused={setPaused}
          setStage={(s) => {
            setStage(s);
            // paused 상태에서 stage 바꾸면 즉시 반영
            if (paused) applyStage(s);
          }}
          jump={(s) => applyStage(s)}
        />
      ) : null}

      {/* Content */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-auto pr-1">
          {/* ✅ 항상 page-enter 적용: 첫 화면만 다른 느낌 제거 */}
          <div key={enterKey} className="page-enter">
            {view === "regi" ? (
              <div className="space-y-4">
                <VoiceCard phase={phase} />
                <MemoCard memo={memo} />
                <AnalyzeButton analyzing={phase === "analyzing"} />
              </div>
            ) : (
              <div className="space-y-4">
                <MetaCard />
                <AISummaryCard />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Black curtain (inline transitionDuration fixes tailwind runtime class issue) */}
      <div
        className="pointer-events-none absolute inset-0 bg-black transition-opacity"
        style={{
          opacity: curtainOn ? 1 : 0,
          transitionDuration: `${curtainOn ? CURTAIN_IN_MS : CURTAIN_OUT_MS}ms`,
          transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------ */

function VoiceCard({ phase }: { phase: Phase }) {
  return (
    <InfoCard title="음성 입력" desc="현장에서 말로 남기면 자동으로 텍스트로 붙여줘요." icon={Mic}>
      <div className="flex items-center gap-3">
        {phase === "recording" && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600">
            <MicOff size={16} />
            녹음 중…
          </div>
        )}

        {(phase === "uploading" || phase === "transcribing") && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
            <Loader2 size={16} className="animate-spin" />
            {phase === "uploading" ? "업로드 중…" : "AI 변환 중…"}
          </div>
        )}

        {(phase === "editing" || phase === "analyzing") && (
          <div className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
            변환 완료
          </div>
        )}
      </div>
    </InfoCard>
  );
}

function MemoCard({ memo }: { memo: string }) {
  return (
    <InfoCard title="내용" desc="AI가 고객/일정/금액을 추출합니다." icon={Brain}>
      <textarea
        value={memo}
        readOnly
        rows={5}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 resize-none"
        placeholder="음성 내용을 분석 중…"
      />
    </InfoCard>
  );
}

function AnalyzeButton({ analyzing }: { analyzing: boolean }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        className="px-5 py-2.5 rounded-2xl text-white font-semibold shadow"
        style={{ background: "var(--blueprint-accent)" }}
      >
        {analyzing ? (
          <span className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            분석 중…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles size={16} />
            저장 + AI
          </span>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------ */

function MetaCard() {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-black text-slate-900">영업 정보</p>
      </CardHeader>

      <CardContent className="grid grid-cols-2 gap-3 text-sm">
        <Meta label="고객사" value="삼성전자" />
        <Meta label="담당자" value="홍길동 부장" />
        <Meta label="방문일시" value="3월 3일 10:00" />
        <Meta label="장소" value="판교 R&D센터" />
      </CardContent>
    </Card>
  );
}

function AISummaryCard() {
  return (
    <Card className="border-violet-100 bg-gradient-to-b from-violet-50/60 to-white">
      <CardHeader className="flex items-center gap-2">
        <Brain size={18} className="text-violet-600" />
        <p className="font-black text-slate-900">AI 요약</p>
      </CardHeader>

      <CardContent className="space-y-4 text-sm text-slate-700">
        <p>삼성전자와 신규 납품 관련 첫 미팅 진행. 다음 주 제안서 제출 후 계약 논의 예정.</p>

        <div>
          <p className="text-xs font-bold text-violet-700 mb-1">NEXT ACTIONS</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>제안서 작성</li>
            <li>가격 협상 준비</li>
          </ul>
        </div>

        <div className="flex gap-2 flex-wrap">
          {["제조", "납품", "협력사"].map((k) => (
            <span key={k} className="text-xs px-2 py-1 rounded-full bg-white border border-violet-100 text-violet-700">
              #{k}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------ */
/**
 * ✅ DebugBar
 * - Pause 토글
 * - Stage 선택
 * - 즉시 점프(편집용)
 */
function DebugBar({
  paused,
  stage,
  setPaused,
  setStage,
  jump,
}: {
  paused: boolean;
  stage: DebugStage;
  setPaused: (v: boolean) => void;
  setStage: (s: DebugStage) => void;
  jump: (s: DebugStage) => void;
}) {
  const stages: DebugStage[] = [
    "regi_recording",
    "regi_uploading",
    "regi_transcribing",
    "regi_editing",
    "regi_analyzing",
    "deta",
  ];

  return (
    <div className="absolute top-2 right-2 z-20">
      <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur px-3 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaused(!paused)}
            className={[
              "px-3 py-1 rounded-xl text-xs font-bold border",
              paused ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-800 border-slate-200",
            ].join(" ")}
          >
            {paused ? "Paused" : "Auto"}
          </button>

          <select
            className="text-xs rounded-xl border border-slate-200 px-2 py-1 bg-white"
            value={stage}
            onChange={(e) => setStage(e.target.value as DebugStage)}
            title="편집할 화면 선택"
          >
            {stages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => jump(stage)}
            className="px-3 py-1 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-800"
            title="지정 화면으로 즉시 이동"
          >
            Jump
          </button>
        </div>

        <p className="mt-1 text-[11px] text-slate-500">
          편집할 땐 <b>Paused</b>로 두고 stage 바꾸면 즉시 고정됩니다.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ */

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}