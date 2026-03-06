// src/hooks/focuswin/sale/useSaleRegistVM.tsx

import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toLocalDatetimeInputValue } from "@/lib/utils";
import { toast } from "sonner";
import { handleApiError } from "@/lib/handleApiError";

import type { PageStatus } from "@/components/focuswin/common/page/scaffold/page-scaffold";
import type { PreSaveState, SaleFormState } from "@/types/sale";

import { useSaleAiClientLinkFlow } from "./useSaleAiClientLinkFlow";

export function useSaleRegistVM() {
  // #region Router / Utils

  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const goList = () => navigate("/sale-list");
  const goDetail = (id: number) => navigate(`/sale-list/${id}`);

  // #endregion

  // #region State

  const [form, setForm] = useState<SaleFormState>({
    clie_name: "",
    clie_idno: undefined,
    cont_name: "",
    sale_loca: "",
    vist_date: toLocalDatetimeInputValue(new Date()),
    orig_memo: "",
    audi_addr: "",
    sttx_text: "",
  });

  const [audioFileIdno, setAudioFileIdno] = useState<number | null>(null);

  const [preSaveState, setPreSaveState] = useState<PreSaveState | null>(null);
  const [isCheckingClient, setIsCheckingClient] = useState(false);

  // ✅ 공용 훅: AI 분석 후 고객사 연결 플로우
  const aiLink = useSaleAiClientLinkFlow();

  // #endregion

  // #region Queries / Mutations

  const createMutation = trpc.crm.sale.create.useMutation();
  const analyzeMutation = trpc.crm.sale.analyze.useMutation();

  // #endregion

  // #region Derived

  const status: PageStatus = "ready";

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
    if (d.schedule_idno) return "AI 분석 완료. 일정이 자동 등록되었습니다.";
    return "AI 분석이 완료되었습니다.";
  }, [analyzeMutation.data]);

  const canDismissBanner = bannerState === "success" || bannerState === "error";
  const dismissBanner = () => analyzeMutation.reset();

  // #endregion

  // #region Handlers

  const handleTranscribed = (text: string) => {
    setForm((f) => ({
      ...f,
      orig_memo: f.orig_memo ? `${f.orig_memo}\n${text}` : text,
      sttx_text: text,
    }));
    toast.success("음성이 텍스트로 변환되었습니다.");
  };

  const setAudioUrl = (url: string) => setForm((f) => ({ ...f, audi_addr: url }));

  // #endregion

  // #region Core Flow

  /**
   * 영업일지 저장(선택적으로 AI 분석까지)
   * - 저장 성공 후 list/stats invalidate
   * - AI 분석 성공 시 고객사 자동 연결 모달 조건 검사
   * - 모달을 띄운 경우: 상세 이동은 보류(모달에서 처리)
   */
  const doSave = async ({
    clie_idno,
    clie_name,
    analyze,
  }: {
    clie_idno?: number;
    clie_name?: string;
    analyze: boolean;
  }) => {
    const created = await createMutation.mutateAsync({
      clie_idno,
      clie_name: clie_name || undefined,
      cont_name: form.cont_name || undefined,
      sale_loca: form.sale_loca || undefined,
      vist_date: new Date(form.vist_date || new Date()).toISOString(),
      orig_memo: form.orig_memo,
      sttx_text: form.sttx_text || undefined,
      attachments: audioFileIdno
        ? [{ file_idno: audioFileIdno, purp_type: "sale_audio" as const, sort_orde: 0 }]
        : undefined,
    });

    let analyzeResult: Awaited<ReturnType<typeof analyzeMutation.mutateAsync>> | null = null;

    if (analyze && created.sale_idno) {
      try {
        analyzeResult = await analyzeMutation.mutateAsync({ sale_idno: created.sale_idno });
        if (analyzeResult.schedule_idno) toast.success("AI 분석 완료. 일정이 자동 등록되었습니다.");
        else toast.success("AI 분석이 완료되었습니다.");
      } catch (e) {
        handleApiError(e);
      }
    }

    await utils.crm.sale.list.invalidate();
    await utils.crm.dashboard.stats.invalidate();
    toast.success("영업일지가 저장되었습니다.");

    if (analyzeResult && created.sale_idno) {
      const opened = aiLink.maybeOpenPostAnalyzeModal(
        created.sale_idno,
        analyzeResult,
        !!clie_idno,
      );
      if (opened) return;
    }

    goDetail(created.sale_idno);
  };

  /**
   * 저장 버튼 진입점
   * - 고객사명이 입력되었는데 id가 없으면: 유사 고객사 매칭 검사 → 프리세이브 모달
   * - 그 외: 바로 저장
   */
  const submit = async (analyze: boolean) => {
    if (!form.orig_memo.trim()) {
      toast.error("내용을 입력해주세요.");
      return;
    }

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
        // no-op
      } finally {
        setIsCheckingClient(false);
      }
    }

    await doSave({ clie_idno: form.clie_idno, clie_name: form.clie_name, analyze });
  };

  // #endregion

  // #region PreSave / PostAnalyze Modal Handlers

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

  // PostAnalyze 핸들러: goDetail 포함하여 래핑 (Page에 노출할 안정적 인터페이스)
  const handlePostAnalyzeConfirm = async () => {
    const saleId = await aiLink.confirmPostAnalyze();
    if (saleId) goDetail(saleId);
  };

  const handlePostAnalyzeDeny = async () => {
    const saleId = await aiLink.denyPostAnalyze();
    if (saleId) goDetail(saleId);
  };

  // #endregion

  // #region Actions UI Model

  const primaryAction = {
    label: "AI 저장",
    onClick: () => submit(true),
    variant: "primary" as const,
    disabled: isBusy,
  };

  const actions = [
    {
      label: "저장",
      onClick: () => submit(false),
      variant: "secondary" as const,
      disabled: isBusy,
    },
  ];

  // #endregion

  // #region Modal props (SaleRegistModals 컴포넌트에 전달)
  const modalProps = {
    preSaveState,
    onPreSaveConfirm: handlePreSaveConfirm,
    onPreSaveDeny: handlePreSaveDeny,
    postAnalyzeClientState: aiLink.postAnalyzeClientState,
    onPostAnalyzeConfirm: handlePostAnalyzeConfirm,
    onPostAnalyzeDeny: handlePostAnalyzeDeny,
  };
  // #endregion

  return {
    // status
    status,

    // banner props (SaleRegistAnalysisBanner 렌더는 Page에서)
    bannerState,
    bannerMessage,
    canDismissBanner,
    dismissBanner,

    // actions
    primaryAction,
    actions,

    // navigation
    goList,

    // form
    form,
    setForm,
    setAudioFileIdno,

    // handlers
    handleTranscribed,
    setAudioUrl,

    // flags
    isBusy,
    isSaving,
    isAnalyzing,

    // modal props → SaleRegistModals 컴포넌트에 spread
    modalProps,
  };
}