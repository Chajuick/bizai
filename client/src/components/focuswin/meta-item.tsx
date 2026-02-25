import React from "react";

type Tone = "blue" | "sky" | "amber" | "violet" | "slate";

const toneStyles: Record<
  Tone,
  { bg: string; bd: string; fg: string }
> = {
  violet: { bg: "bg-violet-50", bd: "border-violet-100", fg: "text-violet-700" },
  sky: { bg: "bg-sky-50", bd: "border-sky-100", fg: "text-sky-700" },
  amber: { bg: "bg-amber-50", bd: "border-amber-100", fg: "text-amber-700" },
  blue: { bg: "bg-blue-50", bd: "border-blue-100", fg: "text-blue-700" },
  slate: { bg: "bg-slate-50", bd: "border-slate-200", fg: "text-slate-700" },
};

export default function FwMetaItem({
  icon: Icon,
  label,
  value,
  tone = "blue",
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  tone?: Tone;
}) {
  const styles = toneStyles[tone];

  return (
    <div className="flex items-start gap-3">
      <div
        className={[
          "w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0",
          styles.bg,
          styles.bd,
        ].join(" ")}
      >
        <Icon size={16} className={styles.fg} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="text-sm font-bold text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}