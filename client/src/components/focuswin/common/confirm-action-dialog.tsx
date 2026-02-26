import React from "react";
import ConfirmDialog from "@/components/focuswin/common/confirm-dialog";
import type { ConfirmState } from "@/types/promise";

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

  const isDelete = confirm?.type === "delete";
  const title = isDelete ? "일정을 삭제할까요?" : "일정을 취소 처리할까요?";
  const description = (
    <>
      <span className="font-semibold text-slate-900">{confirm?.title}</span>
      {isDelete ? " 을(를) 삭제하면 복구할 수 없어요." : " 을(를) 취소 상태로 변경합니다."}
    </>
  );

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(o) => !o && setConfirm(null)}
      title={title}
      description={description}
      cancelLabel="아니요"
      confirmLabel={isDelete ? "삭제" : "취소 처리"}
      confirmTone={isDelete ? "danger" : "primary"}
      onConfirm={async () => {
        if (!confirm) return;
        await onConfirm(confirm);
        setConfirm(null);
      }}
    />
  );
}