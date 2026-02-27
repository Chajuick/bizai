import SearchInput from "@/components/focuswin/common/search-input";
import { useClientsViewModel } from "@/hooks/focuswin/client/useClientsViewModel";

type Props = { vm: ReturnType<typeof useClientsViewModel> };

export default function ClientListHeadContent({ vm }: Props) {
  return (
    <SearchInput
      value={vm.search}
      debounceMs={200}
      onChange={vm.setSearch}
      onClear={() => vm.setSearch("")}
      placeholder="고객사명, 담당자로 검색…"
    />
  );
}
