// src/hooks/focuswin/sale/useSaleDetailVM.tsx

import { useMemo, useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { handleApiError } from "@/lib/handleApiError";

import type { AiCore, AiCorePricing } from "@/types/ai";
import type { PageInvalidState, PageStatus } from "@/components/focuswin/common/page/scaffold/page-scaffold";
import type { ConfirmState } from "@/components/focuswin/common/overlays/confirm-action-dialog";
import type { SaleEditForm } from "@/types/sale";

import { useSaleAiClientLinkFlow } from "./useSaleAiClientLinkFlow";
import { buildDeleteConfirm } from "@/lib/confirm";

import { BookMarked, Check, List, Loader2, Pencil, Plus, Sparkles, Trash2, XCircle } from "lucide-react";

// #region Types

type BannerState = "idle" | "pending" | "success" | "error";

export type AiActionUI = {
  key: string;
  title: string;
  date: string | null;
  desc: string;
  action_owner: "self" | "client" | "shared";

  status: "created" | "pending" | "no-date";
  sche_idno?: number;
};

// #endregion

export function useSaleDetailVM(logId: number) {
  // #region Router / Utils

  const [, navigate] = useLocation();
  const search = useSearch();
  const utils = trpc.useUtils();

  const goList = () => navigate("/sale-list");
  const goKeywordSearch = (kw: string) => navigate(`/sale-list?search=${encodeURIComponent(kw)}`);
  const goScheduleDetail = (sche_idno: number) => navigate(`/schedule/${sche_idno}`);

  // #endregion

  // #region Queries / Mutations

  // polling: aiex_stat가 pending/processing일 때 3초마다 재조회
  const [shouldPoll, setShouldPoll] = useState(false);

  const saleGet = trpc.crm.sale.get.useQuery(
    { sale_idno: logId },
    { enabled: Number.isFinite(logId), refetchInterval: shouldPoll ? 3000 : false }
  );

  // analyzeResult: 워커 완료 후 모달용 데이터 조회 (수동 fetch)
  const analyzeResult = trpc.crm.sale.analyzeResult.useQuery(
    { sale_idno: logId },
    { enabled: false }
  );

  const analyze = trpc.crm.sale.analyze.useMutation();
  const del = trpc.crm.sale.delete.useMutation();
  const update = trpc.crm.sale.update.useMutation();

  // 공용 훅: AI 분석 후 거래처 연결 플로우
  const aiLink = useSaleAiClientLinkFlow();

  // #endregion

  // #region State

  const [isEditing, setIsEditing] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const [editForm, setEditForm] = useState<SaleEditForm>({
    clie_name: "",
    clie_idno: undefined,
    cont_name: "",
    cont_role: "",
    cont_tele: "",
    cont_mail: "",
    sale_loca: "",
    vist_date: "",
    sale_pric: undefined,
    orig_memo: "",
  });

  // #endregion

  // #region Derived (Base)

  const log = saleGet.data ?? null;
  const isLoading = saleGet.isLoading;

  const title = useMemo(() => log?.sale.clie_name || "영업일지", [log?.sale.clie_name]);
  const status: PageStatus = isLoading ? "loading" : !log ? "empty" : "ready";

  const visitedLabel = useMemo(() => {
    if (!log?.sale.vist_date) return "";
    return new Date(log.sale.vist_date).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [log?.sale.vist_date]);

  const invalidState = useMemo(() => {
    if (isLoading || log) return null;

    return {
      replacePage: true,
      icon: <BookMarked size={24} />,
      title: "영업일지",
      actions: [
        {
          label: "목록으로",
          icon: <List size={16} />,
          onClick: goList,
        },
        {
          label: "새로 작성",
          icon: <Plus size={16} />,
          href: "/sale-list/regi",
        },
      ],
    } satisfies PageInvalidState;
  }, [isLoading, log, goList]);

  // #endregion

  // #region Derived (AI summary/core)

  const ai = useMemo(() => {
    const core = (log?.sale.aiex_core ?? null) as AiCore | null;

    return {
      summary: log?.sale.aiex_summ ?? null,
      core,

      pricing: (core?.pricing ?? null) as AiCorePricing,
      appointments: core?.appointments ?? [],
      notes: core?.notes?.trim() ? core.notes.trim() : null,
    };
  }, [log?.sale.aiex_summ, log?.sale.aiex_core]);

  // #endregion

  // #region Derived (AI actions → schedule matching)

  const aiActions: AiActionUI[] = useMemo(() => {
    const core = log?.sale.aiex_core;
    if (!core) return [];

    const schedules = log?.schedules ?? [];

    return core.appointments.map((a) => {
      // key는 서버에서 내려오는 appointment.key 사용 (필수)
      const key = a.key;

      if (!a.date) {
        return {
          ...a,
          key,
          status: "no-date",
        };
      }

      const matched = schedules.find((s) => s.aiex_keys === key);

      if (matched) {
        return {
          ...a,
          key,
          status: "created",
          sche_idno: matched.sche_idno,
        };
      }

      return {
        ...a,
        key,
        status: "pending",
      };
    });
  }, [log]);

  // #endregion

  // #region Effects (server → edit form)

  useEffect(() => {
    if (!log) return;

    setEditForm({
      clie_name: log.sale.clie_name ?? "",
      clie_idno: log.sale.clie_idno ?? undefined,
      cont_name: log.sale.cont_name ?? "",
      cont_role: log.sale.cont_role ?? "",
      cont_tele: log.sale.cont_tele ?? "",
      cont_mail: log.sale.cont_mail ?? "",
      sale_loca: log.sale.sale_loca ?? "",
      vist_date: log.sale.vist_date ? new Date(log.sale.vist_date).toISOString().slice(0, 16) : "",
      sale_pric: log.sale.sale_pric != null ? Number(log.sale.sale_pric) : undefined,
      orig_memo: log.sale.orig_memo ?? "",
      edit_text: log.sale.edit_text ?? undefined,
    });
  }, [log]);

  // #endregion

  // #region Effects (polling + completion detection)

  const aiStatus = saleGet.data?.sale?.aiex_stat ?? "pending";

  useEffect(() => {
    setShouldPoll(aiStatus === "pending" || aiStatus === "processing");
  }, [aiStatus]);

  // aiex_stat가 pending/processing → completed/failed 전환 시 결과 조회 + 모달/토스트
  const prevAiStatusRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const prev = prevAiStatusRef.current;
    prevAiStatusRef.current = aiStatus;

    if (
      prev !== undefined &&
      (prev === "pending" || prev === "processing")
    ) {
      if (aiStatus === "completed") {
        analyze.reset(); // 배너 초기화 (완료 알림은 토스트로)
        utils.crm.sale.list.invalidate();
        analyzeResult.refetch().then((r) => {
          if (!r.data) {
            toast.success("AI 분석이 완료되었습니다.");
            return;
          }
          if (r.data.schedule_idno) toast.success("AI 분석 완료. 일정이 자동 등록되었습니다.");
          else toast.success("AI 분석이 완료되었습니다.");

          aiLink.maybeOpenPostAnalyzeModal(logId, r.data, !!saleGet.data?.sale?.clie_idno);
        });
      } else if (aiStatus === "failed") {
        analyze.reset(); // 배너 초기화
        toast.error("AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiStatus]);

  // #endregion

  // #region UI Helpers

  const resetAnalyze = () => analyze.reset();

  const startEdit = () => setIsEditing(true);
  const cancelEdit = () => setIsEditing(false);

  // #endregion

  // #region Actions (CRUD)

  const save = async () => {
    try {
      // STT 원본이 있고 사용자가 내용을 저장하면 edit_text에 반영
      // → AI 분석이 항상 사용자 최종 수정본을 사용하도록 보장
      const edit_text = log?.sale.sttx_text ? editForm.orig_memo : undefined;

      await update.mutateAsync({
        sale_idno: logId,
        ...editForm,
        sale_pric: editForm.sale_pric ?? undefined,
        vist_date: editForm.vist_date ? new Date(editForm.vist_date).toISOString() : undefined,
        edit_text: edit_text ?? null,
      });

      await utils.crm.sale.get.invalidate({ sale_idno: logId });
      await utils.crm.sale.list.invalidate();

      setIsEditing(false);
      toast.success("수정되었습니다.");
    } catch (e) {
      handleApiError(e);
    }
  };

  const runAnalyze = async () => {
    try {
      await analyze.mutateAsync({ sale_idno: logId });
      await utils.crm.sale.get.invalidate({ sale_idno: logId }); // → aiex_stat=pending 반영
      toast.info("AI 분석을 시작했습니다. 완료되면 알려드립니다.");
    } catch (e) {
      handleApiError(e);
    }
  };

  const remove = async () => {
    try {
      await del.mutateAsync({ sale_idno: logId });
      await utils.crm.sale.list.invalidate();
      toast.success("삭제되었습니다.");
    } catch (e) {
      handleApiError(e);
    }
  };

  // #endregion

  // #region Actions UI Model

  const bannerState: BannerState = useMemo(() => {
    // HTTP 요청 진행 중
    if (analyze.isPending) return "pending";
    // 잡 큐 등록 완료 = 분석 진행 중 (completed 전환 시 useEffect에서 reset)
    if (analyze.isSuccess) return "pending";
    // 큐 등록 자체 실패
    if (analyze.isError) return "error";
    return "idle";
  }, [analyze.isPending, analyze.isSuccess, analyze.isError]);

  const bannerTitle = useMemo(() => {
    if (analyze.isPending) return "분석 요청 중...";
    if (analyze.isSuccess) return "AI 분석 진행 중";
    if (analyze.isError) return "AI 분석 실패";
    return undefined;
  }, [analyze.isPending, analyze.isSuccess, analyze.isError]);

  const bannerMessage = useMemo(() => {
    if (analyze.isPending) return "잠시만 기다려주세요.";
    if (analyze.isSuccess) return "AI가 영업일지를 분석하고 있습니다...";
    if (analyze.isError) return "AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.";
    return undefined;
  }, [analyze.isPending, analyze.isSuccess, analyze.isError]);

  const canAnalyze = aiStatus === "pending" || aiStatus === "failed";

  // 등록 페이지에서 "AI 저장" 후 이동 시 (?analyzing=1) → 분석 완료까지 overlay 유지
  const isFromAnalyze = useMemo(() => new URLSearchParams(search).has("analyzing"), [search]);
  const showAnalysisOverlay = isFromAnalyze && (aiStatus === "pending" || aiStatus === "processing");

  const primaryAction = isEditing
    ? {
        label: "저장",
        icon: update.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />,
        onClick: save,
        disabled: update.isPending,
        variant: "primary" as const,
      }
    : canAnalyze
      ? {
          label: aiStatus === "failed" ? "AI 재분석" : "AI 분석",
          icon: analyze.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />,
          onClick: runAnalyze,
          disabled: analyze.isPending,
          variant: "primary" as const,
        }
      : aiStatus === "processing"
      ? {
          label: "AI 분석 중...",
          icon: <Loader2 size={16} className="animate-spin" />,
          onClick: () => {},
          disabled: true,
          variant: "primary" as const,
        }
      : undefined;

  const actions = isEditing
    ? [{ label: "취소", icon: <XCircle size={16} />, onClick: cancelEdit, variant: "outline" as const }]
    : [
        { label: "수정", icon: <Pencil size={16} />, onClick: startEdit, variant: "ghost" as const },
        {
          label: "삭제",
          icon: del.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />,
          onClick: () => {
            if (!log) return;
            setConfirm(
              buildDeleteConfirm({
                kind: "sale",
                id: log.sale.sale_idno,
                title: "해당 일지",
                metas: [
                  { label: "거래처", value: log.sale.clie_name || "-" },
                  { label: "방문일", value: log.sale.vist_date ? new Date(log.sale.vist_date).toLocaleDateString("ko-KR") : "-" },
                ],
              })
            );
          },
          variant: "ghost" as const,
        },
      ];

  // #endregion

  // #region Modal handlers (래핑하여 안정적인 인터페이스 노출)

  const handleConfirmAction = async (c: NonNullable<ConfirmState>) => {
    if (c.intent !== "delete") return;
    await remove();
    goList();
  };

  const handlePostAnalyzeConfirm = async () => {
    const saleId = await aiLink.confirmPostAnalyze();
    if (!saleId) return;
    await utils.crm.sale.get.invalidate({ sale_idno: saleId });
  };

  const handlePostAnalyzeDeny = async () => {
    const saleId = await aiLink.denyPostAnalyze();
    if (!saleId) return;
    await utils.crm.sale.get.invalidate({ sale_idno: saleId });
  };

  // #endregion

  // #region Modal props (SaleDetailModals 컴포넌트에 전달)
  const modalProps = {
    confirm,
    setConfirm,
    onConfirm: handleConfirmAction,
    postAnalyzeClientState: aiLink.postAnalyzeClientState,
    onPostAnalyzeConfirm: handlePostAnalyzeConfirm,
    onPostAnalyzeDeny: handlePostAnalyzeDeny,
  };
  // #endregion

  return {
    // data
    log,
    status,
    title,
    visitedLabel,
    invalidState,

    // ai
    ai,
    aiActions,
    aiStatus,

    // navigation
    goList,
    goKeywordSearch,
    goScheduleDetail,

    // editing
    isEditing,
    editForm,
    setEditForm,

    // banner
    bannerState,
    bannerTitle,
    bannerMessage,
    resetAnalyze,

    // analysis overlay (등록→상세 이동 시 분석 완료까지 표시)
    showAnalysisOverlay,

    // actions
    startEdit,
    cancelEdit,
    save,
    runAnalyze,
    remove,

    // action models
    primaryAction,
    actions,

    // mutations (for UI states)
    analyze,
    update,
    del,

    // modal props → SaleDetailModals 컴포넌트에 spread
    modalProps,

    // raw query (if needed)
    saleGet,
  };
}