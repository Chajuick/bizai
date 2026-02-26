// components/focuswin/common/choice-dialog.tsx
import * as React from "react";
import Modal from "./ui/modal";

type ChoiceAction = {
  label: React.ReactNode;
  onClick: () => Promise<void> | void;
  disabled?: boolean;

  tone?: "primary" | "secondary";
  style?: React.CSSProperties;

  pendingLabel?: React.ReactNode;
};

type ChoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  kicker?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;

  /** 비교/정보 블록 등 커스텀 섹션 */
  body?: React.ReactNode;

  /** 두 선택지 */
  primary: ChoiceAction;
  secondary: ChoiceAction;

  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  requireChoice?: boolean;
};

export default function ChoiceDialog({
  open,
  onOpenChange,
  kicker,
  title,
  description,
  body,
  primary,
  secondary,
  closeOnBackdrop = true,
  closeOnEsc = true,
  requireChoice = false,
}: ChoiceDialogProps) {
  const effectiveCloseOnBackdrop = requireChoice ? false : closeOnBackdrop;
  const effectiveCloseOnEsc = requireChoice ? false : closeOnEsc;
  const [pendingKey, setPendingKey] = React.useState<"primary" | "secondary" | null>(null);

  const run = async (key: "primary" | "secondary", action: ChoiceAction) => {
    if (pendingKey) return;
    try {
      setPendingKey(key);
      await action.onClick();
      onOpenChange(false);
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={o => {
        if (pendingKey) return;
        if (requireChoice && !o) return;
        onOpenChange(o);
      }}
      closeOnBackdrop={effectiveCloseOnBackdrop}
      closeOnEsc={effectiveCloseOnEsc}
      maxWidthClassName="max-w-sm"
    >
      <div className="space-y-4">
        <div>
          {kicker ? <p className="text-[11px] font-extrabold tracking-[0.16em] text-slate-400 uppercase mb-2">{kicker}</p> : null}

          <p className="text-base font-black text-slate-900 leading-snug">{title}</p>

          {description ? <div className="mt-2 text-sm text-slate-600">{description}</div> : null}
        </div>

        {body ? <div>{body}</div> : null}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => run("primary", primary)}
            disabled={primary.disabled || pendingKey !== null}
            className="w-full py-2.5 rounded-2xl text-sm font-bold text-white transition disabled:opacity-60"
            style={{
              background: "rgb(37,99,235)",
              boxShadow: "0 8px 20px rgba(37,99,235,0.20)",
              ...primary.style,
            }}
          >
            {pendingKey === "primary" ? (primary.pendingLabel ?? "처리 중…") : primary.label}
          </button>

          <button
            type="button"
            onClick={() => run("secondary", secondary)}
            disabled={secondary.disabled || pendingKey !== null}
            className="w-full py-2.5 rounded-2xl text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-700 disabled:opacity-60"
            style={secondary.style}
          >
            {pendingKey === "secondary" ? (secondary.pendingLabel ?? "처리 중…") : secondary.label}
          </button>
        </div>
      </div>
    </Modal>
  );
}
