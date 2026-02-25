import React from "react";

type Tone = "blue" | "violet" | "sky" | "slate";

const tones: Record<Tone, { bg: string; bd: string; fg: string }> = {
  violet: {
    bg: "rgba(139,92,246,0.10)",
    bd: "rgba(139,92,246,0.16)",
    fg: "rgba(109,40,217,0.92)",
  },
  sky: {
    bg: "rgba(14,165,233,0.10)",
    bd: "rgba(14,165,233,0.16)",
    fg: "rgba(3,105,161,0.92)",
  },
  blue: {
    bg: "rgba(37,99,235,0.10)",
    bd: "rgba(37,99,235,0.16)",
    fg: "rgba(29,78,216,0.92)",
  },
  slate: {
    bg: "rgba(100,116,139,0.10)",
    bd: "rgba(100,116,139,0.16)",
    fg: "rgba(51,65,85,0.92)",
  },
};

export default function Tag({
  label,
  icon,
  tone = "blue",
}: {
  label: string;
  icon?: React.ElementType;
  tone?: Tone;
}) {
  const s = tones[tone];
  const Icon = icon;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{
        background: s.bg,
        border: `1px solid ${s.bd}`,
        color: s.fg,
      }}
    >
      {Icon ? <Icon size={12} /> : null}
      {label}
    </span>
  );
}