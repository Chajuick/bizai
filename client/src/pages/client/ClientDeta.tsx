import { Users } from "lucide-react";
import { Button } from "@/components/focuswin/common/ui/button";

import { useClientDetailViewModel } from "@/hooks/focuswin/client/detail/useClientDetailViewModel";

import ClientDetailHeader from "@/components/focuswin/client/deta/client-detail-header";
import ClientProfileCard from "@/components/focuswin/client/deta/client-profile-card";
import ClientKpiCards from "@/components/focuswin/client/deta/client-kpi-cards";
import ClientRecentLogs from "@/components/focuswin/client/deta/client-recent-logs";
import ClientOrders from "@/components/focuswin/client/deta/client-orders";
import PageShell from "@/components/focuswin/common/page-shell";
import SkeletonCardList from "@/components/focuswin/common/skeleton-card-list";

export default function ClieDeta() {
  const vm = useClientDetailViewModel();

  if (vm.isLoading) return <PageShell><SkeletonCardList count={5} variant="detailed" /></PageShell>;

  if (!vm.client) {
    return (
      <div className="p-6 text-center">
        <Users size={32} className="mx-auto mb-3" />
        <p>고객사를 찾을 수 없습니다</p>
        <Button onClick={() => vm.navigate("/clie-list")}>목록으로</Button>
      </div>
    );
  }

  return (
    <PageShell>
      <ClientDetailHeader
        name={vm.client.clie_name}
        onBack={() => vm.navigate("/clie-list")}
      />

      <ClientProfileCard client={vm.client} />

      <ClientKpiCards
        logsCount={vm.logs?.length ?? 0}
        totalOrderAmount={vm.totalOrderAmount}
      />

      <ClientRecentLogs
        logs={vm.logs}
        loading={vm.logsLoading}
        clientName={vm.client.clie_name}
      />

      <ClientOrders
        orders={vm.orders}
        loading={vm.ordersLoading}
      />
    </PageShell>
  );
}