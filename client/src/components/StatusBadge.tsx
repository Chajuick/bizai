const statusMap: Record<string, { label: string; cls: string }> = {
  scheduled:   { label: "예정", cls: "badge-scheduled" },
  completed:   { label: "완료", cls: "badge-completed" },
  canceled:    { label: "취소", cls: "badge-canceled" },
  overdue:     { label: "지연", cls: "badge-overdue" },
  proposal:    { label: "제안", cls: "badge-proposal" },
  negotiation: { label: "협상", cls: "badge-negotiation" },
  confirmed:   { label: "확정", cls: "badge-confirmed" },
  pending:     { label: "대기", cls: "badge-pending" },
  delivered:   { label: "납품완료", cls: "badge-delivered" },
  invoiced:    { label: "청구완료", cls: "badge-billed" },
  paid:        { label: "수금완료", cls: "badge-paid" },
  unbilled:    { label: "미청구", cls: "badge-unbilled" },
  billed:      { label: "청구완료", cls: "badge-billed" },
};

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const info = statusMap[status] ?? { label: status, cls: "badge-pending" };
  const sizeClass = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span className={`inline-flex items-center rounded font-medium font-mono ${sizeClass} ${info.cls}`}>
      {info.label}
    </span>
  );
}
