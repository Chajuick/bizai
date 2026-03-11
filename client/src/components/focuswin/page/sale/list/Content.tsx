import { Link } from "wouter";
import { PaginatedList } from "@/components/focuswin/common/page/list/paginated-list";
import { useSaleListVM } from "@/hooks/focuswin/sale/useSaleListVM";
import SaleListCard from "./ListCard";

type Props = {
  vm: ReturnType<typeof useSaleListVM>;
};

export default function SaleListContent({ vm }: Props) {
  return (
    <PaginatedList
      items={vm.items}
      renderItem={(log) => (
        <Link key={log.sale_idno} href={`/sale-list/${log.sale_idno}`} className="block">
          <SaleListCard
            log={log}
            title={log.clie_name || "거래처 미지정"}
            subtitle={log.cont_name ? `· ${log.cont_name}` : undefined}
            description={log.aiex_summ || log.orig_memo}
          />
        </Link>
      )}
      hasMore={vm.hasMore}
      isLoadingMore={vm.isLoadingMore}
      onLoadMore={vm.loadMore}
      mode="button"
    />
  );
}
