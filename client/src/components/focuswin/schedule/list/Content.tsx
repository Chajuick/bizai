import ScheduleListCard from "./ListCard";
import { useScheduleListVM } from "@/hooks/focuswin/schedule/useScheduleListVM";

type Props = { vm: ReturnType<typeof useScheduleListVM> };

export default function ScheduleListContent({ vm }: Props) {
  return (
    <div className="space-y-2">
      {vm.displayList.map((p) => (
        <ScheduleListCard
          key={p.sche_idno}
          p={p}
          onCreateOrder={vm.openOrderForm}
          onEdit={vm.handleEdit}
          onCancelRequest={vm.requestCancel}
          onDeleteRequest={vm.requestDelete}
          onCompleteRequest={vm.requestComplete}  
        />
      ))}

      {/* 더보기 */}
      {vm.hasMore ? (
        <div className="pt-2">
          <button
            type="button"
            onClick={vm.loadMore}
            disabled={vm.isLoadingMore}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium
                       hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {vm.isLoadingMore ? "불러오는 중..." : "더보기"}
          </button>
        </div>
      ) : null}
    </div>
  );
}