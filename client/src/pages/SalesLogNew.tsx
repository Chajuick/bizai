import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ArrowLeft, Brain, Loader2, Mic, Sparkles, CheckCircle2, XCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import VoiceRecorder from "@/components/VoiceRecorder";
import ClientNameInput from "@/components/ClientNameInput";

function Card({
  title,
  desc,
  icon: Icon,
  children,
}: {
  title: string;
  desc?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900">{title}</p>
          {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Banner({
  state,
  message,
  onDismiss,
}: {
  state: "idle" | "pending" | "success" | "error";
  message?: string;
  onDismiss?: () => void;
}) {
  if (state === "idle") return null;

  if (state === "pending") {
    return (
      <div className="mb-3 rounded-3xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
          <Loader2 size={16} className="animate-spin" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900">저장 & AI 분석 중…</p>
          <p className="text-xs text-slate-600 mt-0.5">
            일정/금액/다음 액션을 추출하고 있어요.
          </p>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="mb-3 rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-3 flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <CheckCircle2 size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-900">AI 분석 완료</p>
          <p className="text-xs text-slate-600 mt-0.5">{message || "완료되었습니다."}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="w-9 h-9 rounded-2xl border border-emerald-100 bg-white/60 hover:bg-white transition flex items-center justify-center text-emerald-700"
            aria-label="배너 닫기"
          >
            <XCircle size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mb-3 rounded-3xl border border-red-100 bg-red-50 px-4 py-3 flex items-start gap-3">
      <div className="w-9 h-9 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
        <XCircle size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-slate-900">AI 분석 실패</p>
        <p className="text-xs text-slate-600 mt-0.5">{message || "나중에 다시 시도해주세요."}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="w-9 h-9 rounded-2xl border border-red-100 bg-white/60 hover:bg-white transition flex items-center justify-center text-red-700"
          aria-label="배너 닫기"
        >
          <XCircle size={16} />
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-slate-500 mt-1.5">{hint}</p>}
    </div>
  );
}

// 저장 전 고객사 확인 모달 (직접 입력 시)
function PreSaveClientModal({
  typedName,
  matchedName,
  onConfirm,
  onDeny,
}: {
  typedName: string;
  matchedName: string;
  onConfirm: () => void;
  onDeny: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-[0_24px_64px_rgba(15,23,42,0.18)] p-5">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 mb-4">
          <Building2 size={22} />
        </div>
        <p className="text-[11px] font-extrabold tracking-[0.16em] text-slate-400 uppercase mb-1">
          고객사 확인
        </p>
        <p className="text-base font-black text-slate-900 leading-snug mb-3">
          혹시 고객사에 등록된<br />
          <span className="text-blue-700">'{matchedName}'</span>을(를) 말씀하시는 건가요?
        </p>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 mb-4 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-16 shrink-0">입력한 이름</span>
            <span className="font-semibold text-slate-700">{typedName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-16 shrink-0">등록된 고객사</span>
            <span className="font-black text-blue-700">{matchedName}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full py-2.5 rounded-2xl text-sm font-bold text-white transition"
            style={{
              background: "var(--blueprint-accent)",
              boxShadow: "0 8px 20px rgba(37,99,235,0.20)",
            }}
          >
            맞아요, '{matchedName}'으로 연결
          </button>
          <button
            onClick={onDeny}
            className="w-full py-2.5 rounded-2xl text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-700"
          >
            아니에요, '{typedName}'으로 신규 등록
          </button>
        </div>
      </div>
    </div>
  );
}

// AI 분석 후 매칭 확인 모달
type MatchSuggestion = {
  logId: number;
  originalName: string;
  matchedId: number;
  matchedName: string;
};

function ClientMatchModal({
  suggestion,
  onConfirm,
  onDeny,
  isDenying,
}: {
  suggestion: MatchSuggestion;
  onConfirm: () => void;
  onDeny: () => void;
  isDenying: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-[0_24px_64px_rgba(15,23,42,0.18)] p-5">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 mb-4">
          <Building2 size={22} />
        </div>
        <p className="text-[11px] font-extrabold tracking-[0.16em] text-slate-400 uppercase mb-1">
          고객사 확인
        </p>
        <p className="text-base font-black text-slate-900 leading-snug mb-3">
          혹시 고객사에 등록된<br />
          <span className="text-blue-700">'{suggestion.matchedName}'</span>을(를) 말씀하시는 건가요?
        </p>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 mb-4 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-16 shrink-0">AI 추출</span>
            <span className="font-semibold text-slate-700">{suggestion.originalName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-16 shrink-0">등록된 고객사</span>
            <span className="font-black text-blue-700">{suggestion.matchedName}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full py-2.5 rounded-2xl text-sm font-bold text-white transition"
            style={{
              background: "var(--blueprint-accent)",
              boxShadow: "0 8px 20px rgba(37,99,235,0.20)",
            }}
          >
            맞아요, 연결해줘
          </button>
          <button
            onClick={onDeny}
            disabled={isDenying}
            className="w-full py-2.5 rounded-2xl text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isDenying && <Loader2 size={14} className="animate-spin" />}
            아니에요, 원래 이름으로 저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SalesLogNew() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    clientName: "",
    clientId: undefined as number | undefined,
    contactPerson: "",
    location: "",
    visitedAt: new Date().toISOString().slice(0, 16),
    rawContent: "",
    audioUrl: "",
    transcribedText: "",
  });

  // 저장 전 고객사 확인 모달 상태
  type PreSaveState = {
    typedName: string;
    matchedId: number;
    matchedName: string;
    analyze: boolean;
  };
  const [preSaveState, setPreSaveState] = useState<PreSaveState | null>(null);
  const [isCheckingClient, setIsCheckingClient] = useState(false);

  // AI 분석 후 매칭 모달 상태
  const [matchSuggestion, setMatchSuggestion] = useState<MatchSuggestion | null>(null);

  const createMutation = trpc.salesLogs.create.useMutation();
  const analyzeMutation = trpc.salesLogs.analyze.useMutation();
  const updateMutation = trpc.salesLogs.update.useMutation();
  const findOrCreateClientMutation = trpc.clients.findOrCreate.useMutation();
  const utils = trpc.useUtils();

  const handleTranscribed = (text: string) => {
    setForm((f) => ({
      ...f,
      rawContent: f.rawContent ? `${f.rawContent}\n${text}` : text,
      transcribedText: text,
    }));
    toast.success("음성이 텍스트로 변환되었습니다.");
  };

  // 실제 저장 로직 (clientId/clientName을 직접 받아 처리)
  const doSave = async ({
    clientId,
    clientName,
    analyze,
  }: {
    clientId?: number;
    clientName?: string;
    analyze: boolean;
  }) => {
    try {
      const result = await createMutation.mutateAsync({
        clientId,
        clientName: clientName || undefined,
        contactPerson: form.contactPerson || undefined,
        location: form.location || undefined,
        visitedAt: form.visitedAt || new Date().toISOString(),
        rawContent: form.rawContent,
        audioUrl: form.audioUrl || undefined,
        transcribedText: form.transcribedText || undefined,
      });

      if (analyze && result.id) {
        try {
          const analysisResult = await analyzeMutation.mutateAsync({ id: result.id });

          if (analysisResult.matchSuggestion) {
            setMatchSuggestion({ logId: result.id, ...analysisResult.matchSuggestion });
            utils.salesLogs.list.invalidate();
            utils.dashboard.stats.invalidate();
            return;
          }

          toast.success(`AI 분석 완료! 일정 ${analysisResult.promisesCreated}개가 자동 등록되었습니다.`);
        } catch {
          toast.error("AI 분석에 실패했습니다. 나중에 다시 시도해주세요.");
        }
      }

      utils.salesLogs.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("영업일지가 저장되었습니다.");
      navigate(`/sales-logs/${result.id}`);
    } catch {
      toast.error("저장에 실패했습니다.");
    }
  };

  const handleSubmit = async (e: React.FormEvent, analyze = false) => {
    e.preventDefault();
    if (!form.rawContent.trim()) {
      toast.error("내용을 입력해주세요.");
      return;
    }

    // clientName 입력됐지만 clientId 없으면 → 저장 전 기존 고객사 확인
    if (form.clientName.trim() && !form.clientId) {
      setIsCheckingClient(true);
      try {
        const match = await utils.clients.findBestMatch.fetch({ name: form.clientName });
        if (match) {
          setPreSaveState({
            typedName: form.clientName,
            matchedId: match.id,
            matchedName: match.name,
            analyze,
          });
          return;
        }
      } catch {
        // 체크 실패 시 그냥 진행
      } finally {
        setIsCheckingClient(false);
      }
    }

    await doSave({ clientId: form.clientId, clientName: form.clientName, analyze });
  };

  // 저장 전 모달: "맞아요" → 기존 고객사로 연결 후 저장
  const handlePreSaveConfirm = async () => {
    if (!preSaveState) return;
    setPreSaveState(null);
    await doSave({
      clientId: preSaveState.matchedId,
      clientName: preSaveState.matchedName,
      analyze: preSaveState.analyze,
    });
  };

  // 저장 전 모달: "아니에요" → 입력한 이름 그대로 신규 등록
  const handlePreSaveDeny = async () => {
    if (!preSaveState) return;
    const { typedName, analyze } = preSaveState;
    setPreSaveState(null);
    await doSave({ clientId: undefined, clientName: typedName, analyze });
  };

  // AI 매칭 모달: "맞아요" → 이미 적용됨, 바로 이동
  const handleMatchConfirm = () => {
    if (!matchSuggestion) return;
    utils.salesLogs.list.invalidate();
    utils.dashboard.stats.invalidate();
    toast.success(`'${matchSuggestion.matchedName}'으로 연결되었습니다.`);
    navigate(`/sales-logs/${matchSuggestion.logId}`);
    setMatchSuggestion(null);
  };

  // AI 매칭 모달: "아니에요" → 원래 이름으로 신규 고객사 등록 후 이동
  const handleMatchDeny = async () => {
    if (!matchSuggestion) return;
    try {
      const client = await findOrCreateClientMutation.mutateAsync({
        name: matchSuggestion.originalName,
      });
      await updateMutation.mutateAsync({
        id: matchSuggestion.logId,
        clientId: client.id,
        clientName: client.name,
      });
      utils.clients.list.invalidate();
    } catch {
      try {
        await updateMutation.mutateAsync({
          id: matchSuggestion.logId,
          clientId: null,
          clientName: matchSuggestion.originalName,
        });
      } catch { /* ignore */ }
    }
    utils.salesLogs.list.invalidate();
    utils.dashboard.stats.invalidate();
    toast.success("영업일지가 저장되었습니다.");
    navigate(`/sales-logs/${matchSuggestion.logId}`);
    setMatchSuggestion(null);
  };

  const isSaving = createMutation.isPending;
  const isAnalyzing = analyzeMutation.isPending;
  const isBusy =
    isSaving ||
    isAnalyzing ||
    isCheckingClient ||
    updateMutation.isPending ||
    findOrCreateClientMutation.isPending;

  const bannerState: "idle" | "pending" | "success" | "error" = useMemo(() => {
    if (analyzeMutation.isPending) return "pending";
    if (analyzeMutation.isSuccess) return "success";
    if (analyzeMutation.isError) return "error";
    return "idle";
  }, [analyzeMutation.isPending, analyzeMutation.isSuccess, analyzeMutation.isError]);

  const bannerMessage = useMemo(() => {
    const d: any = analyzeMutation.data;
    if (!d) return undefined;
    return `일정 ${d.promisesCreated ?? 0}개가 자동 등록되었습니다.`;
  }, [analyzeMutation.data]);

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      {/* 저장 전 고객사 확인 모달 */}
      {preSaveState && (
        <PreSaveClientModal
          typedName={preSaveState.typedName}
          matchedName={preSaveState.matchedName}
          onConfirm={handlePreSaveConfirm}
          onDeny={handlePreSaveDeny}
        />
      )}

      {/* AI 분석 후 매칭 확인 모달 */}
      {matchSuggestion && (
        <ClientMatchModal
          suggestion={matchSuggestion}
          onConfirm={handleMatchConfirm}
          onDeny={handleMatchDeny}
          isDenying={updateMutation.isPending || findOrCreateClientMutation.isPending}
        />
      )}

      {/* Sticky header */}
      <div
        className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 border-b mb-4"
        style={{
          background: "rgba(255,255,255,0.86)",
          borderColor: "rgba(15,23,42,0.08)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate("/sales-logs")}
              className="p-2 rounded-xl hover:bg-slate-50 transition text-slate-700"
              aria-label="뒤로"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
                NEW LOG
              </p>
              <h1 className="text-base sm:text-lg font-black text-slate-900 truncate">영업일지 작성</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isBusy}
              onClick={(e) => handleSubmit(e as any, false)}
              className="px-3 py-2 rounded-2xl text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-60"
            >
              {isSaving || isCheckingClient ? <Loader2 size={16} className="animate-spin" /> : "저장"}
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={(e) => handleSubmit(e as any, true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-bold text-white transition disabled:opacity-60"
              style={{
                background: "var(--blueprint-accent)",
                boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
              }}
            >
              {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              저장+AI
            </button>
          </div>
        </div>
      </div>

      {/* Banner */}
      <Banner
        state={bannerState}
        message={bannerMessage}
        onDismiss={bannerState === "success" || bannerState === "error" ? () => analyzeMutation.reset() : undefined}
      />

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
        {/* Voice */}
        <Card
          title="음성 입력"
          desc="현장에서 말로 남기면 자동으로 텍스트로 붙여줘요."
          icon={Mic}
        >
          <VoiceRecorder
            onTranscribed={handleTranscribed}
            onAudioUrl={(url) => setForm((f) => ({ ...f, audioUrl: url }))}
          />
        </Card>

        {/* Basic info */}
        <Card
          title="기본 정보"
          desc="필수는 아니지만, 입력하면 검색/정리가 훨씬 쉬워져요."
          icon={Building2}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="고객사">
              <ClientNameInput
                value={form.clientName}
                clientId={form.clientId}
                onChange={(name, id) => setForm((f) => ({ ...f, clientName: name, clientId: id }))}
                placeholder="(주)삼성전자"
              />
            </Field>

            <Field label="담당자">
              <Input
                value={form.contactPerson}
                onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                placeholder="홍길동 부장"
                className="rounded-2xl bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-200"
              />
            </Field>

            <Field label="방문 일시">
              <Input
                type="datetime-local"
                value={form.visitedAt}
                onChange={(e) => setForm((f) => ({ ...f, visitedAt: e.target.value }))}
                className="rounded-2xl bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-200"
              />
            </Field>

            <Field label="장소 (선택)">
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="서울 강남구"
                className="rounded-2xl bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-200"
              />
            </Field>
          </div>

          {form.audioUrl ? (
            <div className="mt-4 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">첨부됨:</span> 음성 파일 URL 저장됨
            </div>
          ) : null}
        </Card>

        {/* Content */}
        <Card
          title="내용"
          desc="텍스트로 기록하면 AI가 고객/일정/금액/다음 액션을 자동 추출해요."
          icon={Brain}
        >
          <Textarea
            value={form.rawContent}
            onChange={(e) => setForm((f) => ({ ...f, rawContent: e.target.value }))}
            placeholder='예: "오늘 삼성전자 홍길동 부장님과 미팅. 다음 주 화요일 오전 10시에 제안서 발표. 예산 5천만원."'
            rows={9}
            className="rounded-2xl bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-200 resize-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px] text-slate-500">
              팁: "언제/누구/무엇/다음 일정/금액"이 들어가면 분석 정확도가 좋아져요.
            </p>
            <p className="text-[11px] font-semibold text-slate-400">
              {form.rawContent.length.toLocaleString()} chars
            </p>
          </div>
        </Card>

        {/* Bottom actions (mobile friendly) */}
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          <Button
            type="button"
            disabled={isBusy}
            variant="outline"
            className="rounded-2xl border-slate-200"
            onClick={(e) => handleSubmit(e as any, false)}
          >
            {isSaving || isCheckingClient ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            저장만
          </Button>

          <Button
            type="button"
            disabled={isBusy}
            className="rounded-2xl text-white"
            style={{
              background: "var(--blueprint-accent)",
              boxShadow: "0 10px 26px rgba(37,99,265,0.20)",
            }}
            onClick={(e) => handleSubmit(e as any, true)}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                분석 중…
              </>
            ) : (
              <>
                <Sparkles size={16} className="mr-2" />
                저장+AI
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
