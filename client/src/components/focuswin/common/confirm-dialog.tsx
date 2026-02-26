// components/focuswin/common/confirm-dialog.tsx
import * as React from "react";
import Modal from "./ui/modal";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: React.ReactNode;
  description?: React.ReactNode;

  cancelLabel?: React.ReactNode;
  confirmLabel?: React.ReactNode;

  confirmTone?: "primary" | "danger";
  confirmStyle?: React.CSSProperties;

  onConfirm: () => Promise<void> | void;

  /** confirm 중 로딩 처리 */
  pendingText?: React.ReactNode;

  /** 배경/ESC로 닫히게 할지 */
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
};

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel = "취소",
  confirmLabel = "확인",
  confirmTone = "primary",
  confirmStyle,
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
        if (pending) return; // 처리 중엔 닫힘 방지(선택)
        onOpenChange(o);
      }}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEsc={closeOnEsc}
      maxWidthClassName="max-w-sm"
    >
      <div className="space-y-4">
        <div>
          <p className="text-base font-black text-slate-900">{title}</p>
          {description ? (
            <div className="mt-2 text-sm text-slate-600">{description}</div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-2xl px-4 py-2 text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={cn(
              "rounded-2xl px-4 py-2 text-sm font-bold text-white disabled:opacity-70",
              pending && "opacity-80"
            )}
            style={{
              background: confirmTone === "danger" ? "rgb(239,68,68)" : "rgb(37,99,235)",
              ...confirmStyle,
            }}
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
          </button>
        </div>
      </div>
    </Modal>
  );
}