import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/focuswin/common/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: React.ReactNode;
  subtitle?: React.ReactNode;

  /** form submit */
  onSubmit: (e: React.FormEvent) => void;

  /** action button */
  actionLabel?: React.ReactNode;
  actionTone?: "primary" | "danger";
  isSubmitting?: boolean;

  /** customize */
  contentClassName?: string;

  children: React.ReactNode;
};

export default function FormDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  onSubmit,
  actionLabel = "저장",
  actionTone = "primary",
  isSubmitting,
  contentClassName = "rounded-3xl border border-slate-100 bg-white",
  children,
}: FormDialogProps) {
  const actionStyle: React.CSSProperties =
    actionTone === "danger"
      ? { background: "rgb(239,68,68)", boxShadow: "0 10px 26px rgba(239,68,68,0.20)" }
      : { background: "rgb(37,99,235)", boxShadow: "0 10px 26px rgba(37,99,235,0.20)" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle className="text-slate-900 font-black">{title}</DialogTitle>
          {subtitle ? <div className="mt-2">{subtitle}</div> : null}
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {children}

          <Button
            type="submit"
            disabled={!!isSubmitting}
            className="w-full rounded-2xl text-white font-bold"
            style={actionStyle}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            {actionLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}