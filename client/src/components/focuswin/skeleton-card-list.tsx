import React from "react";

type Variant = "simple" | "detailed";

export default function SkeletonCardList({
  count = 4,
  variant = "simple",
  className = "",
}: {
  count?: number;
  variant?: Variant;
  className?: string;
}) {
  return (
    <div className={["space-y-2", className].join(" ")}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={[
            "rounded-3xl border border-slate-100 bg-white p-4 animate-pulse",
            variant === "simple" ? "h-20" : "",
          ].join(" ")}
          style={
            variant === "detailed"
              ? { boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }
              : undefined
          }
        >
          {variant === "simple" ? null : (
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100" />
              <div className="flex-1">
                <div className="h-3 w-40 bg-slate-100 rounded mb-2" />
                <div className="h-3 w-full bg-slate-100 rounded mb-2" />
                <div className="h-3 w-2/3 bg-slate-100 rounded" />
              </div>
              <div className="h-3 w-14 bg-slate-100 rounded" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}