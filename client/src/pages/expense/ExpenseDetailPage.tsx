// client/src/pages/expense/ExpenseDetailPage.tsx

import { Check, List, Loader2, Pencil, Receipt, Trash2, XCircle } from "lucide-react";
import { useExpenseDetailVM } from "@/hooks/focuswin/expense/useExpenseDetailVM";
import PageScaffold from "@/components/focuswin/common/page/scaffold/page-scaffold";
import ExpenseMetaCard from "@/components/focuswin/page/expense/detail/MetaCard";
import ExpenseEditFormCard from "@/components/focuswin/page/expense/detail/EditFormCard";
import ConfirmActionDialog from "@/components/focuswin/common/overlays/confirm-action-dialog";
import { Card } from "@/components/focuswin/common/ui/card";
import type { PageInvalidState } from "@/components/focuswin/common/page/scaffold/page-scaffold";

export default function ExpenseDetailPage() {
  const vm = useExpenseDetailVM();

  const invalidState: PageInvalidState | null = !vm.isLoading && !vm.expense
    ? {
        replacePage: true,
        icon: <Receipt size={24} />,
        title: "지출",
        actions: [{ label: "목록으로", icon: <List size={16} />, onClick: vm.goList }],
      }
    : null;

  const primaryAction = vm.isEditing
    ? {
        label: "저장",
        icon: vm.isSaving
          ? <Loader2 size={16} className="animate-spin" />
          : <Check size={16} />,
        onClick: vm.submit,
        disabled: vm.isSaving,
        variant: "primary" as const,
      }
    : undefined;

  const actions = vm.isEditing
    ? [
        {
          label: "취소",
          icon: <XCircle size={16} />,
          onClick: vm.cancelEdit,
          variant: "outline" as const,
        },
      ]
    : [
        {
          label: "수정",
          icon: <Pencil size={16} />,
          onClick: vm.startEdit,
          variant: "ghost" as const,
        },
        {
          label: "삭제",
          icon: <Trash2 size={16} />,
          onClick: vm.requestDelete,
          variant: "ghost" as const,
        },
      ];

  return (
    <>
      <ConfirmActionDialog
        confirm={vm.confirm}
        setConfirm={vm.setConfirm}
        onConfirm={vm.handleConfirm}
      />

      <PageScaffold
        kicker="EXPENSE"
        title={vm.expense?.expe_name ?? "지출 상세"}
        description={vm.expense
          ? new Date(String(vm.expense.expe_date)).toLocaleDateString("ko-KR", {
              year: "numeric", month: "long", day: "numeric",
            })
          : ""}
        status={vm.status}
        onBack={vm.goList}
        primaryAction={primaryAction}
        actions={actions}
        invalidState={invalidState}
      >
        {vm.expense && (
          <div className="space-y-4">
            {vm.isEditing ? (
              <ExpenseEditFormCard form={vm.form} setForm={vm.setForm} />
            ) : (
              <>
                <ExpenseMetaCard
                  expe_date={String(vm.expense.expe_date)}
                  expe_amnt={vm.expense.expe_amnt}
                  expe_type={vm.expense.expe_type}
                  paym_meth={vm.expense.paym_meth}
                  recr_type={vm.expense.recr_type}
                  ai_categ={vm.expense.ai_categ}
                  ai_vendor={vm.expense.ai_vendor}
                  clie_name={vm.expense.clie_name}
                />
                {vm.expense.expe_memo && (
                  <Card>
                    <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-widest">메모</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {vm.expense.expe_memo}
                    </p>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </PageScaffold>
    </>
  );
}
