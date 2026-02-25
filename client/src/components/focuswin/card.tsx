import React from "react";
import { cn } from "@/lib/utils";

export default function FwCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-100 bg-white p-4",
        "shadow-[0_12px_32px_rgba(15,23,42,0.05)]",
        className
      )}
    >
      {children}
    </div>
  );
}