import SearchInput from "@/components/focuswin/common/form/search-input";
import { useClientListVM } from "@/hooks/focuswin/client/useClientListVM";

type Props = { vm: ReturnType<typeof useClientListVM> };

export default function ClientListHeadContent({ vm }: Props) {
  return (
    <SearchInput
      value={vm.search}
      debounceMs={200}
      onChange={vm.handleSearch}
      onClear={vm.handleClear}
      placeholder="거래처명, 담당자로 검색…"
    />
  );
}
