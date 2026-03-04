import { useClientListVM } from "@/hooks/focuswin/client/useClientListVM";
import ClientsListCard from "./ListCard";
import { Link } from "wouter";

type Props = { vm: ReturnType<typeof useClientListVM> };

export default function ClientListContent({ vm }: Props) {
  const clients = vm.items;

  return (
    <div className="space-y-2">
      {clients.map(client => (
        <Link key={client.clie_idno} href={`/clie-list/${client.clie_idno}`} className="block">
          <ClientsListCard client={client} />
        </Link>
      ))}
    </div>
  );
}
