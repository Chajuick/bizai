import { Plus } from "lucide-react";
import PageHeader from "@/components/focuswin/common/page-header";
import TabPills from "@/components/focuswin/common/ui/tab-pills";
import StatCards from "@/components/focuswin/common/stat-cards";
import type { DeliveryStatus } from "@/types/delivery";
import { deliveryTabs } from "@/types/delivery";

export default function DeliveriesHeader({
  activeTab,
  setActiveTab,
  onCreate,
  isLoading,
  hasData,
  stats,
  formatKRW,
}: {
  activeTab: DeliveryStatus | "all";
  setActiveTab: (v: DeliveryStatus | "all") => void;
  onCreate: () => void;
  isLoading: boolean;
  hasData: boolean;
  stats: { paid: number; pending: number };
  formatKRW: (n: number) => string;
}) {
  return (
    <PageHeader
      kicker="DELIVERIES"
      title="납품/매출"
      description="납품 상태를 한 번에 관리해요."
      primaryAction={{
        label: "납품 등록",
        icon: <Plus size={16} />,
        onClick: onCreate,
      }}
    >
      {!isLoading && hasData && (
        <StatCards
          cards={[
            {
              kicker: "PAID",
              label: "수금 완료",
              value: formatKRW(stats.paid),
            },
            {
              kicker: "PENDING",
              label: "미수금",
              value: formatKRW(stats.pending),
            },
          ]}
        />
      )}

      <div className="mt-3">
        <TabPills<DeliveryStatus | "all">
          tabs={deliveryTabs}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>
    </PageHeader>
  );
}
