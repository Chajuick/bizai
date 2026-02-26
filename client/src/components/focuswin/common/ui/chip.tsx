import React from "react";
import { cn } from "@/lib/utils";

export type ChipTone =
  | "slate"
  | "blue"
  | "violet"
  | "sky"
  | "amber"
  | "orange"
  | "emerald"
  | "red";

export const chipToneMap: Record<ChipTone, string> = {
  slate:   "bg-slate-50   border-slate-200   text-slate-600",
  blue:    "bg-blue-50    border-blue-100    text-blue-700",
  violet:  "bg-violet-50  border-violet-100  text-violet-700",
  sky:     "bg-sky-50     border-sky-100     text-sky-700",
  amber:   "bg-amber-50   border-amber-100   text-amber-700",
  orange:  "bg-orange-50  border-orange-100  text-orange-700",
  emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
  red:     "bg-red-50     border-red-100     text-red-700",
};

export default function Chip({
  icon: Icon,
  tone = "slate",
  size = "sm",
  label = "",
  className,
}: {
  icon?: React.ElementType;
  tone?: ChipTone;
  size?: "xs" | "sm";
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold",
        chipToneMap[tone],
        size === "xs"
          ? "px-2 py-0.5 text-[11px] gap-1"
          : "px-2.5 py-0.5 text-xs gap-1.5",
        className
      )}
    >
      {Icon && <Icon size={12} />}
      {label}
    </span>
  );
}
