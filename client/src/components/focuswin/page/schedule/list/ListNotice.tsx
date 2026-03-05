import React from "react";
import { Info } from "lucide-react";

export default function ListNotice({
  children,
  icon = true,
  tone = "muted",
  className = "",
}: {
  children: React.ReactNode;
  icon?: boolean;
  tone?: "muted" | "primary" | "warning";
  className?: string;
}) {
  const styles =
    tone === "primary"
      ? {
          bg: "rgba(37,99,235,0.06)",
          bd: "rgba(37,99,235,0.12)",
          fg: "rgb(37,99,235)",
        }
      : tone === "warning"
      ? {
          bg: "rgba(249,115,22,0.08)",
          bd: "rgba(249,115,22,0.16)",
          fg: "rgb(234,88,12)",
        }
      : {
          bg: "rgba(15,23,42,0.04)",
          bd: "rgba(15,23,42,0.06)",
          fg: "rgb(100,116,139)",
        };

  return (
    <div
      className={[
        "flex items-start gap-2 px-3 py-2 rounded-2xl border text-xs font-semibold",
        className,
      ].join(" ")}
      style={{
        background: styles.bg,
        borderColor: styles.bd,
        color: styles.fg,
      }}
    >
      {icon ? <Info size={14} className="mt-[1px] shrink-0" /> : null}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}