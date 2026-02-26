import { Plus } from "lucide-react";
import PageHeader from "@/components/focuswin/common/page-header";
import TabPills from "@/components/focuswin/common/ui/tab-pills";
import StatCards from "@/components/focuswin/common/stat-cards";
import type { OrderStatus } from "@/types/order";

export default function OrdersHeader({
  activeTab,
  setActiveTab,
  stats,
  formatKRW,
  statusTabs,
  onCreate,
}: {
  activeTab: OrderStatus | "all";
  setActiveTab: (v: OrderStatus | "all") => void;
  stats: { total: number; confirmed: number };
  formatKRW: (n: number) => string;
  statusTabs: { key: OrderStatus | "all"; label: string }[];
  onCreate: () => void;
}) {
  return (
    <PageHeader
      kicker="ORDERS"
      title="수주 관리"
      description="파이프라인을 한눈에 보고, 상태를 빠르게 정리하세요."
      primaryAction={{
        label: "수주 등록",
        icon: <Plus size={16} />,
        onClick: onCreate,
      }}
    >
      <StatCards
        cards={[
          {
            kicker: "PIPELINE",
            label: "전체 수주",
            value: formatKRW(stats.total),
          },
          {
            kicker: "CONFIRMED",
            label: "확정 수주",
            value: formatKRW(stats.confirmed),
          },
        ]}
      />

      <div className="mt-3">
        <TabPills<OrderStatus | "all">
          tabs={statusTabs}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>
    </PageHeader>
  );
}
