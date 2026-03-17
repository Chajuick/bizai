// client/src/components/focuswin/page/expense/list/Content.tsx

import { Receipt, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKRW } from "@/lib/format";
import EntityActionMenu from "@/components/focuswin/common/actions/entity-action-menu";
import type { useExpenseListVM } from "@/hooks/focuswin/expense/useExpenseListVM";

// #region Types
type VM = ReturnType<typeof useExpenseListVM>;
type ExpenseItem = VM["items"][number];
// #endregion

// #region Label maps
const EXPENSE_TYPE_LABEL: Record<string, { label: string; cls: string }> = {
  receipt:  { label: "영수증", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  invoice:  { label: "명세서", cls: "bg-purple-100 text-purple-700 border-purple-200" },
  contract: { label: "계약서", cls: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  other:    { label: "기타",   cls: "bg-slate-100 text-slate-600 border-slate-200" },
};

const RECUR_TYPE_LABEL: Record<string, string> = {
  none: "", daily: "매일", weekly: "매주", monthly: "매월", yearly: "매년",
};

const PAYM_METH_LABEL: Record<string, string> = {
  card: "카드", cash: "현금", transfer: "계좌이체", other: "기타",
};
// #endregion

export default function ExpenseListContent({ vm }: { vm: VM }) {
  return (
    <div className="space-y-2">
      {vm.items.map((item) => (
        <ExpenseCard key={item.expe_idno} item={item} vm={vm} />
      ))}
    </div>
  );
}

function ExpenseCard({ item, vm }: { item: ExpenseItem; vm: VM }) {
  const typeBadge = EXPENSE_TYPE_LABEL[item.expe_type] ?? EXPENSE_TYPE_LABEL.other;
  const recurLabel = RECUR_TYPE_LABEL[item.recr_type] ?? "";
  const paymLabel = PAYM_METH_LABEL[item.paym_meth] ?? item.paym_meth;
  const dateStr = new Date(item.expe_date).toLocaleDateString("ko-KR");

  const actions = [
    {
      label: "수정",
      icon: <Pencil size={13} />,
      onClick: () => vm.openDetail(item.expe_idno),
    },
    {
      label: "삭제",
      icon: <Trash2 size={13} />,
      onClick: () => { /* handled via detail page */ vm.openDetail(item.expe_idno); },
      variant: "danger" as const,
      separator: true,
    },
  ];

  return (
    <div
      className="rounded-3xl border border-slate-100 bg-white p-4 transition-shadow hover:shadow-sm cursor-pointer"
      style={{ boxShadow: "0 4px 16px rgba(15,23,42,0.04)" }}
      onClick={() => vm.openDetail(item.expe_idno)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
          item.recr_type !== "none" ? "bg-orange-50" : "bg-slate-50",
        )}>
          {item.recr_type !== "none"
            ? <RefreshCw size={16} className="text-orange-500" />
            : <Receipt size={16} className="text-slate-500" />
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{item.expe_name}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {dateStr}
                {item.clie_name ? ` · ${item.clie_name}` : ""}
                {item.ai_categ ? ` · ${item.ai_categ}` : ""}
              </p>
            </div>
            <div className="flex items-start gap-1 shrink-0">
              <div className="text-right">
                <p className="text-sm font-black text-slate-900">
                  {formatKRW(Number(item.expe_amnt))}
                </p>
                <p className="text-xs text-slate-400">{paymLabel}</p>
              </div>
              <EntityActionMenu actions={actions} />
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              typeBadge.cls,
            )}>
              {typeBadge.label}
            </span>
            {recurLabel && (
              <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                <RefreshCw size={8} className="mr-1" />{recurLabel}
              </span>
            )}
            {item.ai_vendor && (
              <span className="text-[10px] text-slate-400">{item.ai_vendor}</span>
            )}
          </div>

          {item.expe_memo && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-1">{item.expe_memo}</p>
          )}
        </div>
      </div>
    </div>
  );
}
