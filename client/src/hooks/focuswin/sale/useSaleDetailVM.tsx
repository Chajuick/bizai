// src/hooks/focuswin/sale/useSaleDetailVM.tsx

import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

import type { PageStatus } from "@/components/focuswin/common/page-scaffold";
import type { ConfirmState } from "@/components/focuswin/common/confirm-action-dialog";
import type { SalesLogEditForm } from "@/types/salesLog";

import ConfirmActionDialog from "@/components/focuswin/common/confirm-action-dialog";
import PostAnalyzeClientModal from "@/components/focuswin/sale/common/PostAnalyzeClientModal";

import { Check, Loader2, Pencil, Sparkles, Trash2, XCircle } from "lucide-react";


// #region Types

type BannerState = "idle" | "pending" | "success" | "error";

// TODO: 기존에 쓰던 PostAnalyzeClientState 타입이 있으면 any 제거 추천
type PostAnalyzeClientState = any;

// #endregion


// #region ViewModel

export function useSaleDetailVM(logId: number) {

  // #region Router / Utils

  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const goList = () => navigate("/sale-list");

  const goKeywordSearch = (kw: string) => {
    navigate(`/sale-list?search=${encodeURIComponent(kw)}`);
  };

  // #endregion


  // #region Data

  const { data: log, isLoading } = trpc.crm.sale.get.useQuery(
    { sale_idno: logId },
    { enabled: Number.isFinite(logId) }
  );

  // #endregion


  // #region Mutations

  const analyze = trpc.crm.sale.analyze.useMutation();
  const del = trpc.crm.sale.delete.useMutation();
  const update = trpc.crm.sale.update.useMutation();

  // #endregion


  // #region Local State

  const [isEditing, setIsEditing] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [postAnalyzeClientState, setPostAnalyzeClientState] = useState<PostAnalyzeClientState>(null);

  const [editForm, setEditForm] = useState<SalesLogEditForm>({
    clie_name: "",
    clie_idno: undefined,
    cont_name: "",
    sale_loca: "",
    vist_date: "",
    orig_memo: "",
  });

  // #endregion


  // #region Derived

  const title = useMemo(() => log?.sale.clie_name || "영업일지", [log?.sale.clie_name]);

  const visitedLabel = useMemo(() => {
    if (!log?.sale.vist_date) return "";
    return new Date(log.sale.vist_date).toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [log?.sale.vist_date]);

  const status: PageStatus = isLoading ? "loading" : !log ? "empty" : "ready";

  // 배너 (분석 mutation 상태로 표시)
  const bannerState: BannerState = useMemo(() => {
    if (analyze.isPending) return "pending";
    if (analyze.isSuccess) return "success";
    if (analyze.isError) return "error";
    return "idle";
  }, [analyze.isPending, analyze.isSuccess, analyze.isError]);

  const bannerMessage = useMemo(() => {
    const d = analyze.data;
    if (!d) return undefined;
    if (d.schedule_idno) return "AI 분석 완료. 일정이 자동 등록되었습니다.";
    return "AI 분석이 완료되었습니다.";
  }, [analyze.data]);

  // #endregion


  // #region Actions - Edit

  const startEdit = () => {
    if (!log) return;

    setEditForm({
      clie_name: log.sale.clie_name ?? "",
      clie_idno: log.sale.clie_idno ?? undefined,
      cont_name: log.sale.cont_name ?? "",
      sale_loca: log.sale.sale_loca ?? "",
      // TODO: 기존에 toLocalDatetimeInputValue 쓰던 로직이 있으면 여기로 복구 추천
      vist_date: log.sale.vist_date ? new Date(log.sale.vist_date).toISOString().slice(0, 16) : "",
      orig_memo: log.sale.orig_memo ?? "",
    });

    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const save = async () => {
    try {
      await update.mutateAsync({
        sale_idno: logId,
        clie_idno: editForm.clie_idno ?? undefined,
        clie_name: editForm.clie_name || undefined,
        cont_name: editForm.cont_name || undefined,
        sale_loca: editForm.sale_loca || undefined,
        vist_date: editForm.vist_date ? new Date(editForm.vist_date).toISOString() : undefined,
        orig_memo: editForm.orig_memo,
      });

      await utils.crm.sale.get.invalidate({ sale_idno: logId });
      await utils.crm.sale.list.invalidate();

      setIsEditing(false);
      toast.success("수정되었습니다.");
    } catch {
      toast.error("수정에 실패했습니다.");
    }
  };

  // #endregion


  // #region Actions - Analyze

  const resetAnalyze = () => analyze.reset();

  const runAnalyze = async () => {
    try {
      const result = await analyze.mutateAsync({ sale_idno: logId });

      await utils.crm.sale.get.invalidate({ sale_idno: logId });
      await utils.crm.schedule.list.invalidate();
      await utils.crm.dashboard.stats.invalidate();

      // ✅ 여기서 postAnalyzeClientState까지 연결하려면
      // 기존 로직(고객사 매칭/등록/담당자 sync)을 다시 붙여야 함.
      // 일단은 배너/토스트는 analyze 상태로 처리되므로 최소 구현 OK.
      if (result?.ai_client_name && !log?.sale.clie_idno) {
        setPostAnalyzeClientState({
          ai_client_name: result.ai_client_name,
          matched_name: result.matched_client_name ?? null,
        });
      }

      toast.success("AI 분석 완료");
    } catch {
      toast.error("AI 분석 실패");
    }
  };

  // #endregion


  // #region Actions - Delete

  const remove = async () => {
    try {
      await del.mutateAsync({ sale_idno: logId });
      await utils.crm.sale.list.invalidate();
      await utils.crm.dashboard.stats.invalidate();
      toast.success("삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
      throw new Error("delete failed");
    }
  };

  // #endregion


  // #region Header Actions

  const primaryAction = isEditing
    ? {
      label: "저장",
      icon: update.isPending
        ? <Loader2 size={16} className="animate-spin" />
        : <Check size={16} />,
      onClick: save,
      disabled: update.isPending,
      variant: "primary" as const,
    }
    : !log?.sale.aiex_done
      ? {
        label: "AI 분석",
        icon: analyze.isPending
          ? <Loader2 size={16} className="animate-spin" />
          : <Sparkles size={16} />,
        onClick: runAnalyze,
        disabled: analyze.isPending,
        variant: "primary" as const,
      }
      : undefined;

  const actions = isEditing
    ? [
      {
        label: "취소",
        icon: <XCircle size={16} />,
        onClick: cancelEdit,
        variant: "outline" as const,
      },
    ]
    : [
      {
        label: "수정",
        icon: <Pencil size={16} />,
        onClick: startEdit,
        variant: "ghost" as const,
      },
      {
        label: "삭제",
        icon: del.isPending
          ? <Loader2 size={16} className="animate-spin" />
          : <Trash2 size={16} />,
        onClick: () => {
          if (!log) return;
          setConfirm({ type: "delete", id: log.sale.sale_idno, title });
        },
        disabled: del.isPending,
        variant: "ghost" as const,
      },
    ];

  // #endregion


  // #region Modals

  const Modals = () => (
    <>
      <PostAnalyzeClientModal
        open={!!postAnalyzeClientState}
        ai_client_name={postAnalyzeClientState?.ai_client_name ?? ""}
        matched_name={postAnalyzeClientState?.matched_name ?? null}
        onConfirm={() => setPostAnalyzeClientState(null)}
        onDeny={() => setPostAnalyzeClientState(null)}
      />

      <ConfirmActionDialog
        confirm={confirm}
        setConfirm={setConfirm}
        onConfirm={async (c) => {
          if (c.type !== "delete") return;
          await remove();
          goList();
        }}
      />
    </>
  );

  // #endregion


  // #region Public API

  return {
    // data
    log,
    title,
    visitedLabel,
    status,

    // nav
    goList,
    goKeywordSearch,

    // ui state
    isEditing,

    // banner
    bannerState,
    bannerMessage,
    resetAnalyze,

    // edit
    editForm,
    setEditForm,

    startEdit,
    cancelEdit,
    save,

    // server ops (외부에서 pending 체크용)
    analyze,
    update,
    del,

    runAnalyze,
    remove,

    // header actions
    primaryAction,
    actions,

    // ui
    Modals,
  };

  // #endregion
}

// #endregion