import { Plus } from "lucide-react";
import PageHeader from "@/components/focuswin/common/page-header";
import SearchInput from "@/components/focuswin/common/search-input";
import TabPills from "@/components/focuswin/common/ui/tab-pills";

export default function ClientsHeader({
  search,
  setSearch,
  onClear,
  filteredCount,
  onCreate,
}: {
  search: string;
  setSearch: (v: string) => void;
  onClear: () => void;
  filteredCount: number;
  onCreate: () => void;
}) {
  return (
    <PageHeader
      kicker="CLIENTS"
      title="고객사 관리"
      description="고객사/담당자 정보를 빠르게 찾아요."
      primaryAction={{
        label: "고객사 추가",
        icon: <Plus size={16} />,
        onClick: onCreate,
      }}
    >
      <SearchInput
        value={search}
        debounceMs={200}
        onChange={setSearch}
        onClear={onClear}
        placeholder="고객사명, 담당자로 검색…"
      />

      <div className="mt-3">
        <TabPills
          tabs={[{ key: "all", label: "전체", count: filteredCount }]}
          value="all"
          onChange={() => {}}
        />
      </div>
    </PageHeader>
  );
}
