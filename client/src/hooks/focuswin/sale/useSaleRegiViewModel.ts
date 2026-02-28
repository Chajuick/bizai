import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toLocalDatetimeInputValue } from "@/lib/utils";
import { toast } from "sonner";
import type {
  PreSaveState,
  SalesLogFormState,
} from "@/types/salesLog";

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

  const createMutation = trpc.crm.sale.create.useMutation();
  const analyzeMutation = trpc.crm.sale.analyze.useMutation();
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
      vist_date: form.vist_date || new Date().toISOString(),
      orig_memo: form.orig_memo,
      audi_addr: form.audi_addr || undefined,
      sttx_text: form.sttx_text || undefined,
    });

    if (analyze && result.sale_idno) {
      try {
        await analyzeMutation.mutateAsync({ sale_idno: result.sale_idno });
        toast.success("AI 분석이 요청되었습니다.");
      } catch {
        toast.error("AI 분석에 실패했습니다. 나중에 다시 시도해주세요.");
      }
    }

    await utils.crm.sale.list.invalidate();
    await utils.crm.dashboard.stats.invalidate();
    toast.success("영업일지가 저장되었습니다.");
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

  const isSaving = createMutation.isPending;
  const isAnalyzing = analyzeMutation.isPending;

  const isBusy = isSaving || isAnalyzing || isCheckingClient;

  const bannerState: "idle" | "pending" | "success" | "error" = useMemo(() => {
    if (analyzeMutation.isPending) return "pending";
    if (analyzeMutation.isSuccess) return "success";
    if (analyzeMutation.isError) return "error";
    return "idle";
  }, [analyzeMutation.isPending, analyzeMutation.isSuccess, analyzeMutation.isError]);

  const bannerMessage = useMemo(() => {
    const d = analyzeMutation.data;
    if (!d) return undefined;
    return "AI 분석이 요청되었습니다.";
  }, [analyzeMutation.data]);

  const canDismissBanner = bannerState === "success" || bannerState === "error";
  const dismissBanner = () => analyzeMutation.reset();

  return {
    form,
    setForm,

    preSaveState,
    isCheckingClient,

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
  };
}
