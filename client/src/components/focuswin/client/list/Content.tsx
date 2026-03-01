import ClientsList from "./clients-list";
import { useClientsViewModel } from "@/hooks/focuswin/client/useClientsViewModel";

type Props = { vm: ReturnType<typeof useClientsViewModel> };

export default function ClientListContent({ vm }: Props) {
  return <ClientsList clients={vm.clients ?? []} onEdit={vm.openEdit} />;
}
