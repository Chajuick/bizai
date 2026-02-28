import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";

export function useClientDetailViewModel() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const clientId = Number(id);

  const clientQuery = trpc.crm.client.get.useQuery({ clie_idno: clientId });
  const logsQuery = trpc.crm.sale.list.useQuery({ clie_idno: clientId });
  const ordersQuery = trpc.crm.order.list.useQuery(undefined);

  const orders = ordersQuery.data?.items ?? [];

  const totalOrderAmount =
    orders
      .filter((o) => o.clie_idno === clientId && o.stat_code !== "canceled")
      .reduce((sum, o) => sum + Number(o.orde_pric || 0), 0) ?? 0;

  return {
    clientId,
    navigate,

    client: clientQuery.data,
    isLoading: clientQuery.isLoading,

    logs: logsQuery.data?.items ?? [],
    logsLoading: logsQuery.isLoading,

    orders: orders.filter((o) => o.clie_idno === clientId),
    ordersLoading: ordersQuery.isLoading,

    totalOrderAmount,
  };
}
