import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toLocalDatetimeInputValue } from "@/lib/utils";
import { toast } from "sonner";
import type { SalesLogEditForm } from "@/types/salesLog";

export type AiContact = {
  cont_name: string;
  cont_role?: string | null;
  cont_tele?: string | null;
  cont_mail?: string | null;
};

export type PostAnalyzeClientState = {
  ai_client_name: string;
  matched_idno: number | null;
  matched_name: string | null;
  // AI 추출 담당자 목록 — analyze.data 대신 state에 직접 보관 (타이밍 이슈 방지)
  ai_contacts: AiContact[];
} | null;

export function useSalesLogDetailViewModel(logId: number) {
  const utils = trpc.useUtils();

  const { data: log, isLoading } = trpc.crm.sale.get.useQuery(
    { sale_idno: logId },
    { enabled: Number.isFinite(logId) }
  );

  const analyze = trpc.crm.sale.analyze.useMutation();
  const del = trpc.crm.sale.delete.useMutation();
  const update = trpc.crm.sale.update.useMutation();
  const findOrCreate = trpc.crm.client.findOrCreate.useMutation();
  const syncContacts = trpc.crm.client.syncContacts.useMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<SalesLogEditForm>({
    clie_name: "",
    clie_idno: undefined,
    cont_name: "",
    sale_loca: "",
    vist_date: "",
    orig_memo: "",
  });

  // AI 분석 후 고객사 확인 상태
  const [postAnalyzeClientState, setPostAnalyzeClientState] = useState<PostAnalyzeClientState>(null);

  const startEdit = () => {
    if (!log) return;
    setEditForm({
      clie_name: log.sale.clie_name ?? "",
      clie_idno: log.sale.clie_idno ?? undefined,
      cont_name: log.sale.cont_name ?? "",
      sale_loca: log.sale.sale_loca ?? "",
      vist_date: toLocalDatetimeInputValue(new Date(log.sale.vist_date)),
      orig_memo: log.sale.orig_memo,
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

  const bannerState: "idle" | "pending" | "success" | "error" = useMemo(() => {
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

  const resetAnalyze = () => analyze.reset();

  // AI 분석 완료 후 고객사 처리 분기
  const handleAnalyzeResult = (result: {
    ai_client_name?: string | null;
    matched_client_idno?: number | null;
    matched_client_name?: string | null;
    schedule_idno?: number | null;
    ai_contacts?: AiContact[] | null;
  }) => {
    const currentClieIdno = log?.sale.clie_idno;

    if (result.schedule_idno) {
      toast.success("AI 분석 완료. 일정이 자동 등록되었습니다.");
    } else {
      toast.success("AI 분석이 완료되었습니다.");
    }

    // 고객사 연결이 필요한 경우에만 다이얼로그 표시
    if (result.ai_client_name && !currentClieIdno) {
      setPostAnalyzeClientState({
        ai_client_name: result.ai_client_name,
        matched_idno: result.matched_client_idno ?? null,
        matched_name: result.matched_client_name ?? null,
        ai_contacts: result.ai_contacts ?? [],
      });
    }
  };

  const runAnalyze = async () => {
    try {
      const result = await analyze.mutateAsync({ sale_idno: logId });

      await utils.crm.sale.get.invalidate({ sale_idno: logId });
      await utils.crm.schedule.list.invalidate();
      await utils.crm.dashboard.stats.invalidate();

      handleAnalyzeResult(result);
    } catch {
      toast.error("AI 분석에 실패했습니다.");
    }
  };

  // AI 추출 담당자 목록을 고객사에 동기화
  const syncContactsToClient = async (clie_idno: number, contacts: AiContact[]) => {
    if (!contacts.length) return;
    try {
      await syncContacts.mutateAsync({ clie_idno, contacts });
    } catch {
      // 담당자 sync 실패는 조용히 처리 (고객사 연결 자체는 성공)
    }
  };

  // 고객사 확인 다이얼로그 — 확인 (매칭 고객사 연결 OR 신규 등록)
  const handlePostAnalyzeConfirm = async () => {
    if (!postAnalyzeClientState) return;
    const state = postAnalyzeClientState;
    setPostAnalyzeClientState(null);

    try {
      if (state.matched_idno) {
        // A-확인: 매칭 고객사에 연결
        await update.mutateAsync({
          sale_idno: logId,
          clie_idno: state.matched_idno,
          clie_name: state.matched_name ?? undefined,
        });
        await syncContactsToClient(state.matched_idno, state.ai_contacts);
        toast.success(`고객사 '${state.matched_name}'에 연결되었습니다.`);
      } else {
        // B-확인: 신규 고객사 등록 후 연결
        const client = await findOrCreate.mutateAsync({ name: state.ai_client_name });
        if (client) {
          await update.mutateAsync({
            sale_idno: logId,
            clie_idno: client.clie_idno,
            clie_name: client.clie_name,
          });
          await syncContactsToClient(client.clie_idno, state.ai_contacts);
          toast.success(`'${client.clie_name}'을(를) 신규 고객사로 등록하고 연결했습니다.`);
          await utils.crm.client.list.invalidate();
        }
      }
      await utils.crm.sale.get.invalidate({ sale_idno: logId });
    } catch {
      toast.error("고객사 연결에 실패했습니다.");
    }
  };

  // 고객사 확인 다이얼로그 — 거부 (매칭 거부 시 신규 등록 / 신규 제안 거부 시 건너뜀)
  const handlePostAnalyzeDeny = async () => {
    if (!postAnalyzeClientState) return;
    const state = postAnalyzeClientState;
    setPostAnalyzeClientState(null);

    try {
      if (state.matched_idno) {
        // A-거부: 매칭 아님 → AI가 추출한 이름으로 신규 등록 후 연결
        const client = await findOrCreate.mutateAsync({ name: state.ai_client_name });
        if (client) {
          await update.mutateAsync({
            sale_idno: logId,
            clie_idno: client.clie_idno,
            clie_name: client.clie_name,
          });
          await syncContactsToClient(client.clie_idno, state.ai_contacts);
          toast.success(`'${client.clie_name}'을(를) 신규 고객사로 등록하고 연결했습니다.`);
          await utils.crm.client.list.invalidate();
          await utils.crm.sale.get.invalidate({ sale_idno: logId });
        }
      } else {
        // B-거부: 고객사 등록 건너뜀
        toast.info("고객사 연결을 건너뛰었습니다.");
      }
    } catch {
      toast.error("고객사 처리 중 오류가 발생했습니다.");
    }
  };

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

  return {
    log,
    isLoading,

    analyze,
    del,
    update,

    isEditing,
    setIsEditing,

    editForm,
    setEditForm,

    startEdit,
    cancelEdit,
    save,

    bannerState,
    bannerMessage,
    resetAnalyze,

    runAnalyze,
    remove,

    postAnalyzeClientState,
    handlePostAnalyzeConfirm,
    handlePostAnalyzeDeny,
  };
}
