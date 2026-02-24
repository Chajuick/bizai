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

export default function SalesLogNew() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    clientName: "",
    contactPerson: "",
    location: "",
    visitedAt: new Date().toISOString().slice(0, 16),
    rawContent: "",
    audioUrl: "",
    transcribedText: "",
  });

  const createMutation = trpc.salesLogs.create.useMutation();
  const analyzeMutation = trpc.salesLogs.analyze.useMutation();
  const utils = trpc.useUtils();

  const handleTranscribed = (text: string) => {
    setForm((f) => ({
      ...f,
      rawContent: f.rawContent ? `${f.rawContent}\n${text}` : text,
      transcribedText: text,
    }));
    toast.success("음성이 텍스트로 변환되었습니다.");
  };

  const handleSubmit = async (e: React.FormEvent, analyze = false) => {
    e.preventDefault();
    if (!form.rawContent.trim()) {
      toast.error("내용을 입력해주세요.");
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        ...form,
        visitedAt: form.visitedAt || new Date().toISOString(),
        audioUrl: form.audioUrl || undefined,
        transcribedText: form.transcribedText || undefined,
        clientName: form.clientName || undefined,
        contactPerson: form.contactPerson || undefined,
        location: form.location || undefined,
      });

      if (analyze && result.id) {
        try {
          const analysis = await analyzeMutation.mutateAsync({ id: result.id });
          toast.success(`AI 분석 완료! 일정 ${analysis.promisesCreated}개가 자동 등록되었습니다.`);
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

  const isSaving = createMutation.isPending;
  const isAnalyzing = analyzeMutation.isPending;
  const isBusy = isSaving || isAnalyzing;

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
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : "저장"}
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
              <Input
                value={form.clientName}
                onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                placeholder="(주)삼성전자"
                className="rounded-2xl bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-200"
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
              팁: “언제/누구/무엇/다음 일정/금액”이 들어가면 분석 정확도가 좋아져요.
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
            {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            저장만
          </Button>

          <Button
            type="button"
            disabled={isBusy}
            className="rounded-2xl text-white"
            style={{
              background: "var(--blueprint-accent)",
              boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
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