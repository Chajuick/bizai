import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toLocalDatetimeInputValue } from "@/lib/utils";
import { toast } from "sonner";

type EditForm = {
  clientName: string;
  contactPerson: string;
  location: string;
  visitedAt: string;
  rawContent: string;
};

export function useSalesLogDetailViewModel(logId: number) {
  const utils = trpc.useUtils();

  const { data: log, isLoading } = trpc.salesLogs.get.useQuery(
    { id: logId },
    { enabled: Number.isFinite(logId) }
  );

  const analyze = trpc.salesLogs.analyze.useMutation();
  const del = trpc.salesLogs.delete.useMutation();
  const update = trpc.salesLogs.update.useMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    clientName: "",
    contactPerson: "",
    location: "",
    visitedAt: "",
    rawContent: "",
  });

  const startEdit = () => {
    if (!log) return;
    setEditForm({
      clientName: log.clientName ?? "",
      contactPerson: log.contactPerson ?? "",
      location: log.location ?? "",
      visitedAt: toLocalDatetimeInputValue(new Date(log.visitedAt)),
      rawContent: log.rawContent,
    });
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const save = async () => {
    try {
      await update.mutateAsync({
        id: logId,
        clientName: editForm.clientName || undefined,
        contactPerson: editForm.contactPerson || undefined,
        location: editForm.location || undefined,
        visitedAt: editForm.visitedAt,
        rawContent: editForm.rawContent,
      });

      await utils.salesLogs.get.invalidate({ id: logId });
      await utils.salesLogs.list.invalidate();

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
    const d: any = analyze.data;
    if (!d) return undefined;
    return `일정 ${d.promisesCreated ?? 0}개가 자동 등록되었습니다.`;
  }, [analyze.data]);

  const resetAnalyze = () => analyze.reset();

  const runAnalyze = async () => {
    try {
      const result = await analyze.mutateAsync({ id: logId });
      toast.success(`AI 분석 완료! 일정 ${result.promisesCreated}개가 자동 등록되었습니다.`);

      await utils.salesLogs.get.invalidate({ id: logId });
      await utils.promises.list.invalidate();
      await utils.dashboard.stats.invalidate();
    } catch {
      toast.error("AI 분석에 실패했습니다.");
    }
  };

  const remove = async () => {
    try {
      await del.mutateAsync({ id: logId });
      await utils.salesLogs.list.invalidate();
      await utils.dashboard.stats.invalidate();
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
  };
}