// #region Imports
import React from "react";
import ConfirmDialog from "@/components/focuswin/common/overlays/confirm-dialog";
import type { ConfirmIntent, ConfirmState } from "@/types";
// #endregion

export type { ConfirmState };

// #region Helpers
function getTitle(intent: ConfirmIntent, targetTitle: string) {
  if (intent === "delete") return `${targetTitle}을(를) 삭제할까요?`;
  if (intent === "cancel") return `${targetTitle}을(를) 취소 처리할까요?`;
  return `${targetTitle}을(를) 완료 처리할까요?`;
}

function getConfirmLabel(intent: ConfirmIntent) {
  if (intent === "delete") return "삭제";
  if (intent === "cancel") return "취소 처리";
  return "완료";
}

function getTone(intent: ConfirmIntent) {
  return intent === "delete" ? "danger" : "primary";
}
// #endregion

// #region Component
export default function ConfirmActionDialog({
  confirm,
  setConfirm,
  onConfirm,
}: {
  confirm: ConfirmState;
  setConfirm: (next: ConfirmState) => void;
  onConfirm: (confirm: Exclude<ConfirmState, null>) => Promise<void> | void;
}) {
  const open = !!confirm;

  if (!confirm) {
    return (
      <ConfirmDialog
        open={false}
        onOpenChange={() => {}}
        title=""
        description=""
        onConfirm={() => {}}
      />
    );
  }

  const intent = confirm.intent;
  const target = confirm.target;

  const title = getTitle(intent, target.title);
  const confirmLabel = getConfirmLabel(intent);
  const confirmTone = getTone(intent);

  // ⭐ metas → UI 변환
  const metaUI = (
    <div className="grid grid-cols-[72px_1fr] gap-y-2 text-sm">
      {target.metas.map((m) => (
        <React.Fragment key={m.label}>
          <span className="text-slate-500">{m.label}</span>
          <span
            className={
              m.tone === "danger"
                ? "font-semibold text-red-600"
                : m.tone === "primary"
                ? "font-semibold text-blue-600"
                : "font-semibold text-slate-900"
            }
          >
            {m.value}
          </span>
        </React.Fragment>
      ))}
    </div>
  );

  const description = target.metas.length
    ? metaUI
    : confirm.description ?? "처리하면 되돌릴 수 없어요.";

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(o) => !o && setConfirm(null)}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      confirmTone={confirmTone}
      onConfirm={async () => {
        await onConfirm(confirm);
        setConfirm(null);
      }}
    />
  );
}
// #endregion