import { Link } from "wouter";
import { PaginatedList } from "@/components/focuswin/common/page/list/paginated-list";
import { useClientListVM } from "@/hooks/focuswin/client/useClientListVM";
import ClientsListCard from "./ListCard";

type Props = { vm: ReturnType<typeof useClientListVM> };

export default function ClientListContent({ vm }: Props) {
  return (
    <PaginatedList
      items={vm.items}
      renderItem={(client) => (
        <div key={client.clie_idno} className="relative">
          <Link href={`/clie-list/${client.clie_idno}`} className="block">
            <ClientsListCard client={client} onToggleFavorite={vm.toggleFavorite} />
          </Link>
        </div>
      )}
      hasMore={vm.hasMore}
      isLoadingMore={vm.isLoadingMore}
      onLoadMore={vm.loadMore}
      mode="button"
    />
  );
}
