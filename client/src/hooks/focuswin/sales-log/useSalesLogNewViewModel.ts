import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toLocalDatetimeInputValue } from "@/lib/utils";
import { toast } from "sonner";

export type MatchSuggestion = {
  logId: number;
  originalName: string;
  matchedId: number;
  matchedName: string;
};

type FormState = {
  clientName: string;
  clientId?: number;
  contactPerson: string;
  location: string;
  visitedAt: string;
  rawContent: string;
  audioUrl: string;
  transcribedText: string;
};

type PreSaveState = {
  typedName: string;
  matchedId: number;
  matchedName: string;
  analyze: boolean;
};

export function useSalesLogNewViewModel() {
  const [, navigate] = useLocation();

  const [form, setForm] = useState<FormState>({
    clientName: "",
    clientId: undefined,
    contactPerson: "",
    location: "",
    visitedAt: toLocalDatetimeInputValue(new Date()),
    rawContent: "",
    audioUrl: "",
    transcribedText: "",
  });

  const [preSaveState, setPreSaveState] = useState<PreSaveState | null>(null);
  const [isCheckingClient, setIsCheckingClient] = useState(false);
  const [matchSuggestion, setMatchSuggestion] = useState<MatchSuggestion | null>(null);

  const createMutation = trpc.salesLogs.create.useMutation();
  const analyzeMutation = trpc.salesLogs.analyze.useMutation();
  const updateMutation = trpc.salesLogs.update.useMutation();
  const findOrCreateClientMutation = trpc.clients.findOrCreate.useMutation();
  const utils = trpc.useUtils();

  const goList = () => navigate("/sales-logs");
  const goDetail = (id: number) => navigate(`/sales-logs/${id}`);

  const handleTranscribed = (text: string) => {
    setForm((f) => ({
      ...f,
      rawContent: f.rawContent ? `${f.rawContent}\n${text}` : text,
      transcribedText: text,
    }));
    toast.success("음성이 텍스트로 변환되었습니다.");
  };

  const setAudioUrl = (url: string) => setForm((f) => ({ ...f, audioUrl: url }));

  const doSave = async ({
    clientId,
    clientName,
    analyze,
  }: {
    clientId?: number;
    clientName?: string;
    analyze: boolean;
  }) => {
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
        const analysisResult: any = await analyzeMutation.mutateAsync({ id: result.id });

        // ✅ matchSuggestion이 있으면 이동 보류하고 모달 띄우기
        if (analysisResult.matchSuggestion) {
          setMatchSuggestion({ logId: result.id, ...analysisResult.matchSuggestion });
          await utils.salesLogs.list.invalidate();
          await utils.dashboard.stats.invalidate();
          return;
        }

        toast.success(`AI 분석 완료! 일정 ${analysisResult.promisesCreated}개가 자동 등록되었습니다.`);
      } catch {
        toast.error("AI 분석에 실패했습니다. 나중에 다시 시도해주세요.");
      }
    }

    await utils.salesLogs.list.invalidate();
    await utils.dashboard.stats.invalidate();
    toast.success("영업일지가 저장되었습니다.");
    goDetail(result.id);
  };

  const submit = async (analyze: boolean) => {
    if (!form.rawContent.trim()) {
      toast.error("내용을 입력해주세요.");
      return;
    }

    // ✅ 고객사명만 입력하고 clientId가 없으면: 저장 전 best match 확인
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
        // ignore
      } finally {
        setIsCheckingClient(false);
      }
    }

    await doSave({ clientId: form.clientId, clientName: form.clientName, analyze });
  };

  const handlePreSaveConfirm = async () => {
    if (!preSaveState) return;
    const s = preSaveState;
    setPreSaveState(null);
    await doSave({ clientId: s.matchedId, clientName: s.matchedName, analyze: s.analyze });
  };

  const handlePreSaveDeny = async () => {
    if (!preSaveState) return;
    const s = preSaveState;
    setPreSaveState(null);
    await doSave({ clientId: undefined, clientName: s.typedName, analyze: s.analyze });
  };

  const handleMatchConfirm = async () => {
    if (!matchSuggestion) return;
    await utils.salesLogs.list.invalidate();
    await utils.dashboard.stats.invalidate();
    toast.success(`'${matchSuggestion.matchedName}'으로 연결되었습니다.`);
    goDetail(matchSuggestion.logId);
    setMatchSuggestion(null);
  };

  const handleMatchDeny = async () => {
    if (!matchSuggestion) return;

    try {
      const client = await findOrCreateClientMutation.mutateAsync({ name: matchSuggestion.originalName });
      await updateMutation.mutateAsync({
        id: matchSuggestion.logId,
        clientId: client.id,
        clientName: client.name,
      });
      await utils.clients.list.invalidate();
    } catch {
      try {
        await updateMutation.mutateAsync({
          id: matchSuggestion.logId,
          clientId: null,
          clientName: matchSuggestion.originalName,
        });
      } catch {
        // ignore
      }
    }

    await utils.salesLogs.list.invalidate();
    await utils.dashboard.stats.invalidate();
    toast.success("영업일지가 저장되었습니다.");
    goDetail(matchSuggestion.logId);
    setMatchSuggestion(null);
  };

  const isSaving = createMutation.isPending;
  const isAnalyzing = analyzeMutation.isPending;

  const isDenyingMatch = updateMutation.isPending || findOrCreateClientMutation.isPending;

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

  const canDismissBanner = bannerState === "success" || bannerState === "error";
  const dismissBanner = () => analyzeMutation.reset();

  return {
    form,
    setForm,

    preSaveState,
    isCheckingClient,

    matchSuggestion,
    isDenyingMatch,

    isSaving,
    isAnalyzing,
    isBusy,

    bannerState,
    bannerMessage,
    canDismissBanner,
    dismissBanner,

    goList,
    submit,

    handleTranscribed,
    setAudioUrl,

    handlePreSaveConfirm,
    handlePreSaveDeny,

    handleMatchConfirm,
    handleMatchDeny,
  };
}