import { PaginatedList } from "@/components/focuswin/common/page/list/paginated-list";
import { useScheduleListVM } from "@/hooks/focuswin/schedule/useScheduleListVM";
import ScheduleListCard from "./ListCard";

type Props = { vm: ReturnType<typeof useScheduleListVM> };

export default function ScheduleListContent({ vm }: Props) {
  return (
    <PaginatedList
      items={vm.displayList}
      renderItem={(p) => (
        <ScheduleListCard
          key={p.sche_idno}
          p={p}
          onCreateOrder={vm.openOrderForm}
          onEdit={vm.handleEdit}
          onCancelRequest={vm.requestCancel}
          onDeleteRequest={vm.requestDelete}
          onCompleteRequest={vm.requestComplete}
        />
      )}
      hasMore={vm.hasMore}
      isLoadingMore={vm.isLoadingMore}
      onLoadMore={vm.loadMore}
      mode="button"
    />
  );
}
