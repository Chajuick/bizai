import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ConfirmState = null | {
  type: "delete" | "cancel";
  id: number;
  title: string;
};

export default function ConfirmActionDialog({
  confirm,
  setConfirm,
  onConfirm,
}: {
  confirm: ConfirmState;
  setConfirm: (next: ConfirmState) => void;
  onConfirm: (confirm: Exclude<ConfirmState, null>) => Promise<void> | void;
}) {
  return (
    <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-black">
            {confirm?.type === "delete" ? "일정을 삭제할까요?" : "일정을 취소 처리할까요?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            <span className="font-semibold text-slate-900">{confirm?.title}</span>
            {confirm?.type === "delete"
              ? " 을(를) 삭제하면 복구할 수 없어요."
              : " 을(를) 취소 상태로 변경합니다."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-2xl">아니요</AlertDialogCancel>

          <AlertDialogAction
            className="rounded-2xl"
            onClick={async () => {
              if (!confirm) return;
              await onConfirm(confirm);
              setConfirm(null);
            }}
            style={{
              background: confirm?.type === "delete" ? "rgb(239,68,68)" : "rgb(37,99,235)",
            }}
          >
            {confirm?.type === "delete" ? "삭제" : "취소 처리"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}