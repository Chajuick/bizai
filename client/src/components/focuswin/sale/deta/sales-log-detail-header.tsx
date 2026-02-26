import { ArrowLeft, Check, Loader2, Pencil, Sparkles, Trash2, XCircle } from "lucide-react";
import PageHeader from "@/components/focuswin/common/page-header";
import Chip from "@/components/focuswin/common/ui/chip";

type Props = {
  title: string;
  visitedLabel: string;
  isProcessed: boolean;
  isEditing: boolean;

  onBack: () => void;

  onAnalyze: () => void;
  onEdit: () => void;
  onDeleteRequest: () => void;

  onSave: () => void;
  onCancelEdit: () => void;

  analyzePending: boolean;
  updatePending: boolean;
  deletePending: boolean;
};

export default function SalesLogDetailHeader({
  title,
  visitedLabel,
  isProcessed,
  isEditing,
  onBack,
  onAnalyze,
  onEdit,
  onDeleteRequest,
  onSave,
  onCancelEdit,
  analyzePending,
  updatePending,
  deletePending,
}: Props) {
  const primaryAction = isEditing
    ? {
        label: "저장",
        icon: updatePending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />,
        onClick: onSave,
        disabled: updatePending,
        variant: "primary" as const,
      }
    : !isProcessed
      ? {
          label: "AI 분석",
          icon: analyzePending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />,
          onClick: onAnalyze,
          disabled: analyzePending,
          variant: "primary" as const,
        }
      : undefined;

  const actions = isEditing
    ? [
        {
          label: "취소",
          icon: <XCircle size={16} />,
          onClick: onCancelEdit,
          variant: "outline" as const,
        },
      ]
    : [
        {
          label: "수정",
          icon: <Pencil size={16} />,
          onClick: onEdit,
          variant: "ghost" as const,
        },
        {
          label: "삭제",
          icon: deletePending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />,
          onClick: onDeleteRequest,
          disabled: deletePending,
          variant: "ghost" as const,
        },
      ];

  return (
    <PageHeader
      kicker="LOG DETAIL"
      title={
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate">{title}</span>
          {isProcessed ? <Chip tone="violet" label="AI 완료" /> : <Chip label="미분석" />}
        </div>
      }
      description={visitedLabel}
      left={
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-slate-50 transition text-slate-700"
          aria-label="뒤로"
        >
          <ArrowLeft size={18} />
        </button>
      }
      primaryAction={primaryAction}
      actions={actions}
    />
  );
}