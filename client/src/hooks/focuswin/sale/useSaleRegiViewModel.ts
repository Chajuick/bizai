import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toLocalDatetimeInputValue } from "@/lib/utils";
import { toast } from "sonner";
import type {
  PreSaveState,
  SalesLogFormState,
} from "@/types/salesLog";
import type { PostAnalyzeClientState } from "./useSalesLogDetailViewModel";

export type FileUploadState = "idle" | "uploading" | "transcribing" | "done" | "error";

export function useSaleRegiViewModel() {
  const [, navigate] = useLocation();

  const [form, setForm] = useState<SalesLogFormState>({
    clie_name: "",
    clie_idno: undefined,
    cont_name: "",
    sale_loca: "",
    vist_date: toLocalDatetimeInputValue(new Date()),
    orig_memo: "",
    audi_addr: "",
    sttx_text: "",
  });

  const [preSaveState, setPreSaveState] = useState<PreSaveState | null>(null);
  const [isCheckingClient, setIsCheckingClient] = useState(false);

  // AI 저장 후 고객사 확인 상태 (고객사 없이 저장된 경우 AI 추출 결과로 확인)
  const [postAnalyzeClientState, setPostAnalyzeClientState] = useState<PostAnalyzeClientState>(null);
  const [savedSaleId, setSavedSaleId] = useState<number | null>(null);

  const [fileUploadState, setFileUploadState] = useState<FileUploadState>("idle");
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [audioFileIdno, setAudioFileIdno] = useState<number | null>(null);

  const createMutation = trpc.crm.sale.create.useMutation();
  const analyzeMutation = trpc.crm.sale.analyze.useMutation();
  const updateMutation = trpc.crm.sale.update.useMutation();
  const findOrCreate = trpc.crm.client.findOrCreate.useMutation();
  const syncContacts = trpc.crm.client.syncContacts.useMutation();
  const prepareUpload = trpc.crm.files.prepareUpload.useMutation();
  const confirmUpload = trpc.crm.files.confirmUpload.useMutation();
  const transcribeFile = trpc.crm.files.transcribeFile.useMutation();
  const utils = trpc.useUtils();

  const goList = () => navigate("/sale-list");
  const goDetail = (id: number) => navigate(`/sale-list/${id}`);

  const handleTranscribed = (text: string) => {
    setForm((f) => ({
      ...f,
      orig_memo: f.orig_memo ? `${f.orig_memo}\n${text}` : text,
      sttx_text: text,
    }));
    toast.success("음성이 텍스트로 변환되었습니다.");
  };

  const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

  const handleFileSelected = async (file: File) => {
    if (file.size > MAX_AUDIO_SIZE) {
      toast.error("파일 크기가 50MB를 초과합니다.");
      return;
    }

    setFileUploadState("uploading");
    setFileUploadError(null);

    try {
      const { file_path, upload_url } = await prepareUpload.mutateAsync({
        file_name: file.name,
        mime_type: file.type || undefined,
      });

      const uploadResp = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "audio/webm" },
        body: file,
      });
      if (!uploadResp.ok) throw new Error("파일 업로드에 실패했습니다.");

      const { file_idno } = await confirmUpload.mutateAsync({
        file_path,
        file_name: file.name,
        mime_type: file.type || undefined,
        file_size: file.size,
      });

      setFileUploadState("transcribing");
      const { text } = await transcribeFile.mutateAsync({ file_idno });

      handleTranscribed(text);
      setAudioFileIdno(file_idno);
      setFileUploadState("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "처리 중 오류가 발생했습니다.";
      setFileUploadState("error");
      setFileUploadError(msg);
      toast.error(msg);
    }
  };

  const resetFileUpload = () => {
    setFileUploadState("idle");
    setFileUploadError(null);
  };

  const setAudioUrl = (url: string) => setForm((f) => ({ ...f, audi_addr: url }));

  const doSave = async ({
    clie_idno,
    clie_name,
    analyze,
  }: {
    clie_idno?: number;
    clie_name?: string;
    analyze: boolean;
  }) => {
    const result = await createMutation.mutateAsync({
      clie_idno,
      clie_name: clie_name || undefined,
      cont_name: form.cont_name || undefined,
      sale_loca: form.sale_loca || undefined,
      vist_date: new Date(form.vist_date || new Date()).toISOString(),
      orig_memo: form.orig_memo,
      audi_addr: form.audi_addr || undefined,
      sttx_text: form.sttx_text || undefined,
      attachments: audioFileIdno
        ? [{ file_idno: audioFileIdno, purp_type: "sale_audio" as const, sort_orde: 0 }]
        : undefined,
    });

    let analyzeResult: Awaited<ReturnType<typeof analyzeMutation.mutateAsync>> | null = null;

    if (analyze && result.sale_idno) {
      try {
        analyzeResult = await analyzeMutation.mutateAsync({ sale_idno: result.sale_idno });

        if (analyzeResult.schedule_idno) {
          toast.success("AI 분석 완료. 일정이 자동 등록되었습니다.");
        } else {
          toast.success("AI 분석이 완료되었습니다.");
        }
      } catch {
        toast.error("AI 분석에 실패했습니다. 나중에 다시 시도해주세요.");
      }
    }

    await utils.crm.sale.list.invalidate();
    await utils.crm.dashboard.stats.invalidate();
    toast.success("영업일지가 저장되었습니다.");

    // AI가 고객사를 추출했고, 저장 시 고객사 연결이 없는 경우 → 다이얼로그 표시 후 이동
    if (analyzeResult?.ai_client_name && !clie_idno) {
      setSavedSaleId(result.sale_idno);
      setPostAnalyzeClientState({
        ai_client_name: analyzeResult.ai_client_name,
        matched_idno: analyzeResult.matched_client_idno ?? null,
        matched_name: analyzeResult.matched_client_name ?? null,
        ai_contacts: analyzeResult.ai_contacts ?? [],
      });
      return; // 다이얼로그 확인 후 이동
    }

    goDetail(result.sale_idno);
  };

  const submit = async (analyze: boolean) => {
    if (!form.orig_memo.trim()) {
      toast.error("내용을 입력해주세요.");
      return;
    }

    // ✅ 고객사명만 입력하고 clie_idno가 없으면: 저장 전 best match 확인
    if (form.clie_name.trim() && !form.clie_idno) {
      setIsCheckingClient(true);
      try {
        const match = await utils.crm.client.findBestMatch.fetch({ name: form.clie_name });
        if (match) {
          setPreSaveState({
            typedName: form.clie_name,
            matchedId: match.clie_idno,
            matchedName: match.clie_name,
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

    await doSave({ clie_idno: form.clie_idno, clie_name: form.clie_name, analyze });
  };

  const handlePreSaveConfirm = async () => {
    if (!preSaveState) return;
    const s = preSaveState;
    setPreSaveState(null);
    await doSave({ clie_idno: s.matchedId, clie_name: s.matchedName, analyze: s.analyze });
  };

  const handlePreSaveDeny = async () => {
    if (!preSaveState) return;
    const s = preSaveState;
    setPreSaveState(null);
    await doSave({ clie_idno: undefined, clie_name: s.typedName, analyze: s.analyze });
  };

  const syncContactsToClient = async (
    clie_idno: number,
    contacts: { cont_name: string; cont_role?: string | null; cont_tele?: string | null; cont_mail?: string | null }[]
  ) => {
    if (!contacts.length) return;
    try {
      await syncContacts.mutateAsync({ clie_idno, contacts });
    } catch {
      // 연락처 sync 실패는 조용히 처리 (고객사 연결 자체는 성공)
    }
  };

  // AI 분석 후 고객사 확인 — 확인 (매칭 연결 OR 신규 등록)
  const handlePostAnalyzeConfirm = async () => {
    if (!postAnalyzeClientState || !savedSaleId) return;
    const state = postAnalyzeClientState;
    const saleId = savedSaleId;
    setPostAnalyzeClientState(null);
    setSavedSaleId(null);

    try {
      if (state.matched_idno) {
        await updateMutation.mutateAsync({
          sale_idno: saleId,
          clie_idno: state.matched_idno,
          clie_name: state.matched_name ?? undefined,
        });
        await syncContactsToClient(state.matched_idno, state.ai_contacts);
        toast.success(`고객사 '${state.matched_name}'에 연결되었습니다.`);
      } else {
        const client = await findOrCreate.mutateAsync({ name: state.ai_client_name });
        if (client) {
          await updateMutation.mutateAsync({
            sale_idno: saleId,
            clie_idno: client.clie_idno,
            clie_name: client.clie_name,
          });
          await syncContactsToClient(client.clie_idno, state.ai_contacts);
          toast.success(`'${client.clie_name}'을(를) 신규 고객사로 등록하고 연결했습니다.`);
          await utils.crm.client.list.invalidate();
        }
      }
    } catch {
      toast.error("고객사 연결에 실패했습니다.");
    }

    goDetail(saleId);
  };

  // AI 분석 후 고객사 확인 — 거부 (매칭 거부 → 신규 등록 / 신규 거부 → 건너뜀)
  const handlePostAnalyzeDeny = async () => {
    if (!postAnalyzeClientState || !savedSaleId) return;
    const state = postAnalyzeClientState;
    const saleId = savedSaleId;
    setPostAnalyzeClientState(null);
    setSavedSaleId(null);

    try {
      if (state.matched_idno) {
        // 매칭 거부 → AI 추출 이름으로 신규 등록
        const client = await findOrCreate.mutateAsync({ name: state.ai_client_name });
        if (client) {
          await updateMutation.mutateAsync({
            sale_idno: saleId,
            clie_idno: client.clie_idno,
            clie_name: client.clie_name,
          });
          await syncContactsToClient(client.clie_idno, state.ai_contacts);
          toast.success(`'${client.clie_name}'을(를) 신규 고객사로 등록하고 연결했습니다.`);
          await utils.crm.client.list.invalidate();
        }
      } else {
        // 신규 등록 거부 → 건너뜀
        toast.info("고객사 연결을 건너뛰었습니다.");
      }
    } catch {
      toast.error("고객사 처리 중 오류가 발생했습니다.");
    }

    goDetail(saleId);
  };

  const isSaving = createMutation.isPending;
  const isAnalyzing = analyzeMutation.isPending;

  const isUploadingFile = fileUploadState === "uploading" || fileUploadState === "transcribing";
  const isBusy = isSaving || isAnalyzing || isCheckingClient || isUploadingFile;

  const bannerState: "idle" | "pending" | "success" | "error" = useMemo(() => {
    if (analyzeMutation.isPending) return "pending";
    if (analyzeMutation.isSuccess) return "success";
    if (analyzeMutation.isError) return "error";
    return "idle";
  }, [analyzeMutation.isPending, analyzeMutation.isSuccess, analyzeMutation.isError]);

  const bannerMessage = useMemo(() => {
    const d = analyzeMutation.data;
    if (!d) return undefined;
    if (d.schedule_idno) return "AI 분석 완료. 일정이 자동 등록되었습니다.";
    return "AI 분석이 완료되었습니다.";
  }, [analyzeMutation.data]);

  const canDismissBanner = bannerState === "success" || bannerState === "error";
  const dismissBanner = () => analyzeMutation.reset();

  return {
    form,
    setForm,

    preSaveState,
    isCheckingClient,

    postAnalyzeClientState,
    handlePostAnalyzeConfirm,
    handlePostAnalyzeDeny,

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

    fileUploadState,
    fileUploadError,
    handleFileSelected,
    resetFileUpload,

    handlePreSaveConfirm,
    handlePreSaveDeny,
  };
}
