// client/src/components/focuswin/deliveries/delete-delivery-dialog.tsx

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

export default function DeleteDeliveryDialog({
  confirm,
  setConfirm,
  onConfirm,
}: {
  confirm: null | { id: number; title: string };
  setConfirm: (v: null | { id: number; title: string }) => void;
  onConfirm: (id: number) => Promise<void>;
}) {
  return (
    <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-black">납품 건을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            <span className="font-semibold text-slate-900">{confirm?.title}</span> 항목을 삭제하면 복구할 수 없어요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-2xl">아니요</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-2xl"
            onClick={async () => {
              if (!confirm) return;
              await onConfirm(confirm.id);
              setConfirm(null);
            }}
            style={{ background: "rgb(239,68,68)" }}
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}