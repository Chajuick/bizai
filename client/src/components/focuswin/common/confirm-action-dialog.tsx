import React from "react";
import ConfirmDialog from "@/components/focuswin/common/confirm-dialog";
import type { ConfirmState } from "@/types";

export type { ConfirmState };

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
        cancelLabel="아니요"
        confirmLabel="확인"
        confirmTone="primary"
        onConfirm={() => {}}
      />
    );
  }

  const confirmType = confirm.type;
  const confirmTitle = confirm.title?.trim() || "이 일정";

  const title =
    confirmType === "delete"
      ? `${confirmTitle}을(를) 삭제할까요?`
      : confirmType === "cancel"
        ? `${confirmTitle}을(를) 취소 처리할까요?`
        : `${confirmTitle}을(를) 완료 처리할까요?`;

  const confirmLabel =
    confirmType === "delete" ? "삭제" : confirmType === "cancel" ? "취소 처리" : "완료";

  const confirmTone =
    confirmType === "delete" ? "danger" : "primary";

  const description =
    confirmType === "delete"
      ? "삭제하면 복구할 수 없어요."
      : confirmType === "cancel"
        ? "취소 상태로 변경한 뒤에는 수정할 수 없어요."
        : "완료 상태로 변경한 뒤에는 수정할 수 없어요.";

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(o) => !o && setConfirm(null)}
      title={title}
      description={description}
      cancelLabel="아니요"
      confirmLabel={confirmLabel}
      confirmTone={confirmTone}
      onConfirm={async () => {
        await onConfirm(confirm);
        setConfirm(null);
      }}
    />
  );
}