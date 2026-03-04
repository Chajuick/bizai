// src/components/focuswin/client/detail/ClientDetailModals.tsx

import ConfirmActionDialog from "@/components/focuswin/common/confirm-action-dialog";
import type { useClientDetailVM } from "@/hooks/focuswin/client/useClientDetailVM";

type Props = ReturnType<typeof useClientDetailVM>["modalProps"];

export function ClientDetailModals({ confirm, setConfirm, onConfirm }: Props) {
  return (
    <ConfirmActionDialog
      confirm={confirm}
      setConfirm={setConfirm}
      onConfirm={onConfirm}
    />
  );
}
