"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useClientDetailViewModel } from "@/hooks/focuswin/clients/detail/useClientDetailViewModel";

import ClientDetailHeader from "@/components/focuswin/clients/detail/client-detail-header";
import ClientProfileCard from "@/components/focuswin/clients/detail/client-profile-card";
import ClientKpiCards from "@/components/focuswin/clients/detail/client-kpi-cards";
import ClientRecentLogs from "@/components/focuswin/clients/detail/client-recent-logs";
import ClientOrders from "@/components/focuswin/clients/detail/client-orders";
import PageShell from "@/components/focuswin/common/page-shell";

export default function ClientDetail() {
  const vm = useClientDetailViewModel();

  if (vm.isLoading) return <div className="p-6">Loading...</div>;

  if (!vm.client) {
    return (
      <div className="p-6 text-center">
        <Users size={32} className="mx-auto mb-3" />
        <p>고객사를 찾을 수 없습니다</p>
        <Button onClick={() => vm.navigate("/clients")}>목록으로</Button>
      </div>
    );
  }

  return (
    <PageShell>
      <ClientDetailHeader
        name={vm.client.name}
        onBack={() => vm.navigate("/clients")}
      />

      <ClientProfileCard client={vm.client} />

      <ClientKpiCards
        logsCount={vm.logs?.length ?? 0}
        totalOrderAmount={vm.totalOrderAmount}
      />

      <ClientRecentLogs
        logs={vm.logs}
        loading={vm.logsLoading}
        clientName={vm.client.name}
      />

      <ClientOrders
        orders={vm.orders}
        loading={vm.ordersLoading}
      />
    </PageShell>
  );
}