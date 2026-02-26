// components/focuswin/common/base-modal.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  children: React.ReactNode;

  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;

  maxWidthClassName?: string;   // e.g. "max-w-sm"
  panelClassName?: string;
  zIndexClassName?: string;     // e.g. "z-50"
};

export default function Modal({
  open,
  onOpenChange,
  children,
  closeOnBackdrop = true,
  closeOnEsc = true,
  maxWidthClassName = "max-w-sm",
  panelClassName,
  zIndexClassName = "z-50",
}: ModalProps) {
  React.useEffect(() => {
    if (!open || !closeOnEsc) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeOnEsc, onOpenChange]);

  if (!open) return null;

  return (
    <div className={cn("fixed inset-0 flex items-center justify-center px-4", zIndexClassName)}>
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          if (closeOnBackdrop) onOpenChange(false);
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full bg-white rounded-3xl shadow-[0_24px_64px_rgba(15,23,42,0.18)] p-5",
          maxWidthClassName,
          panelClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}