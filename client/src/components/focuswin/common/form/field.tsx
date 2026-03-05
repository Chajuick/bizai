// components/focuswin/common/form/field.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/focuswin/common/ui/label";

export function Field({
  label,
  children,
  hint,
  error,
  required,
  right,
  className,
}: {
  label?: React.ReactNode;
  children: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <div className="flex items-end justify-between gap-3">
          <Label className="text-xs font-semibold text-slate-600">
            {label} {required ? <span className="text-red-500">*</span> : null}
          </Label>
          {right ? <div className="text-xs text-slate-400">{right}</div> : null}
        </div>
      ) : null}

      {children}

      {error ? (
        <p className="text-[11px] text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}