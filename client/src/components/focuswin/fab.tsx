import React from "react";

export default function Fab({
  onClick,
  children,
  label,
  className = "",
  hideOnLg = true,
}: {
  onClick: () => void;
  children: React.ReactNode;
  label?: string; // 접근성(aria-label)
  className?: string;
  hideOnLg?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[
        "fixed bottom-20 right-5 w-14 h-14 rounded-full text-white",
        "flex items-center justify-center",
        "shadow-[0_12px_28px_rgba(37,99,235,0.30)]",
        hideOnLg ? "lg:hidden" : "",
        className,
      ].join(" ")}
      style={{ background: "rgb(37, 99, 235)" }}
    >
      {children}
    </button>
  );
}