// src/hooks/focuswin/sale/useSaleDetailVM.tsx

import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

import type { AiCore, AiCorePricing } from "@/types/ai";
import type { PageInvalidState, PageStatus } from "@/components/focuswin/common/page-scaffold";
import type { ConfirmState } from "@/components/focuswin/common/confirm-action-dialog";
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
  const utils = trpc.useUtils();

  const goList = () => navigate("/sale-list");
  const goKeywordSearch = (kw: string) => navigate(`/sale-list?search=${encodeURIComponent(kw)}`);
  const goScheduleDetail = (sche_idno: number) => navigate(`/schedule/${sche_idno}`);

  // #endregion

  // #region Queries / Mutations

  const saleGet = trpc.crm.sale.get.useQuery(
    { sale_idno: logId },
    { enabled: Number.isFinite(logId) }
  );

  const analyze = trpc.crm.sale.analyze.useMutation();
  const del = trpc.crm.sale.delete.useMutation();
  const update = trpc.crm.sale.update.useMutation();

  // 공용 훅: AI 분석 후 고객사 연결 플로우
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
      timeZone: "UTC",
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
    });
  }, [log]);

  // #endregion

  // #region UI Helpers

  const resetAnalyze = () => analyze.reset();

  const startEdit = () => setIsEditing(true);
  const cancelEdit = () => setIsEditing(false);

  // #endregion

  // #region Actions (CRUD)

  const save = async () => {
    try {
      await update.mutateAsync({
        sale_idno: logId,
        ...editForm,
        sale_pric: editForm.sale_pric ?? undefined,
        vist_date: editForm.vist_date ? new Date(editForm.vist_date).toISOString() : undefined,
      });

      await utils.crm.sale.get.invalidate({ sale_idno: logId });
      await utils.crm.sale.list.invalidate();

      setIsEditing(false);
      toast.success("수정되었습니다.");
    } catch {
      toast.error("수정에 실패했습니다.");
    }
  };

  const runAnalyze = async () => {
    try {
      const res = await analyze.mutateAsync({ sale_idno: logId });

      await utils.crm.sale.get.invalidate({ sale_idno: logId });
      await utils.crm.sale.list.invalidate();

      if (res.schedule_idno) toast.success("AI 분석 완료. 일정이 자동 등록되었습니다.");
      else toast.success("AI 분석이 완료되었습니다.");

      const opened = aiLink.maybeOpenPostAnalyzeModal(logId, res, !!log?.sale.clie_idno);
      if (opened) return;
    } catch {
      toast.error("AI 분석에 실패했습니다.");
    }
  };

  const remove = async () => {
    try {
      await del.mutateAsync({ sale_idno: logId });
      await utils.crm.sale.list.invalidate();
      toast.success("삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  // #endregion

  // #region Actions UI Model

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

  const primaryAction = isEditing
    ? {
        label: "저장",
        icon: update.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />,
        onClick: save,
        disabled: update.isPending,
        variant: "primary" as const,
      }
    : !log?.sale.aiex_done
      ? {
          label: "AI 분석",
          icon: analyze.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />,
          onClick: runAnalyze,
          disabled: analyze.isPending,
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
                  { label: "고객사", value: log.sale.clie_name || "-" },
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
    bannerMessage,
    resetAnalyze,

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