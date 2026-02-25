import Chip, { type ChipTone } from "@/components/focuswin/common/chip";

type StatusInfo = { label: string; tone: ChipTone };

const statusMap: Record<string, StatusInfo> = {
  scheduled:   { label: "예정",   tone: "blue"    },
  completed:   { label: "완료",   tone: "emerald" },
  canceled:    { label: "취소",   tone: "slate"   },
  overdue:     { label: "지연",   tone: "red"     },
  imminent:    { label: "임박",   tone: "orange"  },
  proposal:    { label: "제안",   tone: "amber"   },
  negotiation: { label: "협상",   tone: "orange"  },
  confirmed:   { label: "확정",   tone: "emerald" },
  pending:     { label: "대기",   tone: "slate"   },
  delivered:   { label: "납품완료", tone: "blue"  },
  invoiced:    { label: "청구완료", tone: "sky"   },
  paid:        { label: "수금완료", tone: "emerald"},
  unbilled:    { label: "미청구", tone: "amber"   },
  billed:      { label: "청구완료", tone: "sky"   },
};

export default function StatusBadge({
  status,
  size = "sm",
}: {
  status: string;
  size?: "sm" | "md";
}) {
  if (!status) return null;
  const info = statusMap[status] ?? { label: status, tone: "slate" as ChipTone };
  return (
    <Chip
      label={info.label}
      tone={info.tone}
      size={size === "md" ? "sm" : "xs"}
    />
  );
}
