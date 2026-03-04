// #region Imports
import * as React from "react";
import Modal from "./ui/modal";
import { Button } from "@/components/focuswin/common/ui/button";
// #endregion

// #region Types
type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: React.ReactNode;
  description?: React.ReactNode;

  cancelLabel?: React.ReactNode;
  confirmLabel?: React.ReactNode;

  confirmTone?: "primary" | "danger";

  onConfirm: () => Promise<void> | void;

  pendingText?: React.ReactNode;

  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
};
// #endregion

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel = "취소",
  confirmLabel = "확인",
  confirmTone = "primary",
  onConfirm,
  pendingText = "처리 중…",
  closeOnBackdrop = true,
  closeOnEsc = true,
}: ConfirmDialogProps) {

  const [pending, setPending] = React.useState(false);

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (pending) return;
        onOpenChange(o);
      }}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEsc={closeOnEsc}
      maxWidthClassName="max-w-md"
    >
      <div className="px-3 py-4 space-y-6">

        {/* Title */}
        <div className="space-y-3">
          <h2 className="text-[17px] font-semibold text-slate-900">
            {title}
          </h2>

          {/* Info Card */}
          {description && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-3">

              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {description}
              </div>

              {confirmTone === "danger" && (
                <div className="text-sm font-medium text-red-500">
                  ⚠ 삭제한 항목은 복구할 수 없습니다.
                </div>
              )}

            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 w-full">

          {/* Cancel */}
          <Button
            type="button"
            tone="neutral"
            variant="outline"
            fullWidth
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>

          {/* Confirm */}
          <Button
            type="button"
            tone={confirmTone === "danger" ? "danger" : "primary"}
            variant="solid"
            fullWidth
            autoFocus
            disabled={pending}
            onClick={async () => {

              if (pending) return;

              try {
                setPending(true);
                await onConfirm();
                onOpenChange(false);
              } finally {
                setPending(false);
              }

            }}
          >
            {pending ? pendingText : confirmLabel}
          </Button>

        </div>

      </div>
    </Modal>
  );
}