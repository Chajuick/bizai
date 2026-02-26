import SearchInput from "@/components/focuswin/common/search-input";
import TabPills from "@/components/focuswin/common/ui/tab-pills";
import { useSaleListViewModel } from "@/hooks/focuswin/sale/useSaleListViewModel";

type Props = {
  vm: ReturnType<typeof useSaleListViewModel>;
  className?: string;
};

export default function SaleListHeadContent({ vm, className }: Props) {
  return (
    <div className={className}>
      <SearchInput
        value={vm.search}
        debounceMs={250}
        onChange={vm.handleSearch}
        onClear={vm.handleClear}
        placeholder="고객사, 담당자, 내용으로 검색…"
      />

      <div className="mt-3">
        <TabPills tabs={vm.salesTabs} value={vm.filter} onChange={vm.setFilter} />
      </div>
    </div>
  );
}