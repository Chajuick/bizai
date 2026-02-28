import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toLocalDatetimeInputValue } from "@/lib/utils";
import { toast } from "sonner";
import type { SalesLogEditForm } from "@/types/salesLog";

export function useSalesLogDetailViewModel(logId: number) {
  const utils = trpc.useUtils();

  const { data: log, isLoading } = trpc.crm.sale.get.useQuery(
    { sale_idno: logId },
    { enabled: Number.isFinite(logId) }
  );

  const analyze = trpc.crm.sale.analyze.useMutation();
  const del = trpc.crm.sale.delete.useMutation();
  const update = trpc.crm.sale.update.useMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<SalesLogEditForm>({
    clie_name: "",
    cont_name: "",
    sale_loca: "",
    vist_date: "",
    orig_memo: "",
  });

  const startEdit = () => {
    if (!log) return;
    setEditForm({
      clie_name: log.sale.clie_name ?? "",
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
        clie_name: editForm.clie_name || undefined,
        cont_name: editForm.cont_name || undefined,
        sale_loca: editForm.sale_loca || undefined,
        vist_date: editForm.vist_date,
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
    return "AI 분석이 요청되었습니다.";
  }, [analyze.data]);

  const resetAnalyze = () => analyze.reset();

  const runAnalyze = async () => {
    try {
      await analyze.mutateAsync({ sale_idno: logId });
      toast.success("AI 분석이 요청되었습니다.");

      await utils.crm.sale.get.invalidate({ sale_idno: logId });
      await utils.crm.schedule.list.invalidate();
      await utils.crm.dashboard.stats.invalidate();
    } catch {
      toast.error("AI 분석에 실패했습니다.");
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
  };
}
