import SearchInput from "@/components/focuswin/common/form/search-input";
import TabPills from "@/components/focuswin/common/ui/tab-pills";
import { useSaleListVM } from "@/hooks/focuswin/sale/useSaleListVM";

type Props = {
  vm: ReturnType<typeof useSaleListVM>;
  className?: string;
};

export default function SaleListHeader({ vm, className }: Props) {
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
        <TabPills tabs={vm.tabs} value={vm.filter} onChange={vm.setFilter} />
      </div>
    </div>
  );
}