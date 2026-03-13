import * as React from "react";
import { Loader2, X } from "lucide-react";
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
  contentClassName = "bg-white sm:rounded-3xl",
  children,
}: FormDialogProps) {
  // #region Action style

  const actionStyle: React.CSSProperties =
    actionTone === "danger"
      ? {
          background: "rgb(239,68,68)",
          boxShadow: "0 10px 26px rgba(239,68,68,0.20)",
        }
      : {
          background: "rgb(37,99,235)",
          boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
        };

  // #endregion

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={[
          // #region Base
          "p-0 gap-0 overflow-hidden border-0 shadow-none",
          // #endregion

          // #region Mobile fullscreen
          "fixed inset-0 z-[120] h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 rounded-none",
          // #endregion

          // #region Desktop modal
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:z-[120] sm:h-auto sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:shadow-xl",
          // #endregion

          contentClassName,
        ].join(" ")}
      >
        <form onSubmit={onSubmit} className="relative h-full sm:h-auto">
          {/* #region Header */}
          <div className="fixed inset-x-0 top-0 z-[121] border-b border-slate-200/70 bg-white sm:static sm:z-auto">
            <div className="flex items-center justify-between gap-3 px-5 pt-[max(env(safe-area-inset-top),14px)] py-3 sm:px-6 sm:py-2 sm:pt-4">
              <DialogHeader className="min-w-0 flex-1 text-left">
                <DialogTitle className="text-lg font-black text-slate-900 sm:text-xl">{title}</DialogTitle>

                {subtitle ? <div className="mt-1.5">{subtitle}</div> : null}
              </DialogHeader>

              <button
                type="button"
                aria-label="닫기"
                onClick={() => onOpenChange(false)}
                className="
        inline-flex h-10 w-10 shrink-0 items-center justify-center
        rounded-full text-slate-500 transition
        hover:bg-slate-100 hover:text-slate-900
      "
              >
                <X size={20} />
              </button>
            </div>
          </div>
          {/* #endregion */}

          {/* #region Body */}
          <div
            className="
              h-[100dvh] overflow-y-auto px-4
              pt-[74px] pb-[92px]
              sm:h-auto sm:px-6 sm:pt-2 sm:pb-6
            "
          >
            <div className="space-y-4">{children}</div>
          </div>
          {/* #endregion */}

          {/* #region Footer */}
          <div className="fixed inset-x-0 bottom-0 z-[121] bg-white sm:static sm:z-auto">
            <div className="px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)] sm:px-6 sm:pt-4 sm:pb-6">
              <Button type="submit" disabled={!!isSubmitting} className="h-12 w-full rounded-2xl text-base font-bold text-white" style={actionStyle}>
                {isSubmitting ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                {actionLabel}
              </Button>
            </div>
          </div>
          {/* #endregion */}
        </form>
      </DialogContent>
    </Dialog>
  );
}
