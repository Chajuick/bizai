"use client";

import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";

export function useClientDetailViewModel() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const clientId = Number(id);

  const clientQuery = trpc.clients.get.useQuery({ id: clientId });
  const logsQuery = trpc.salesLogs.list.useQuery({ clientId, limit: 10 });
  const ordersQuery = trpc.orders.list.useQuery({ clientId });

  const totalOrderAmount =
    ordersQuery.data
      ?.filter((o: any) => o.status !== "canceled")
      .reduce((sum: number, o: any) => sum + Number(o.amount || 0), 0) ?? 0;

  return {
    clientId,
    navigate,

    client: clientQuery.data,
    isLoading: clientQuery.isLoading,

    logs: logsQuery.data,
    logsLoading: logsQuery.isLoading,

    orders: ordersQuery.data,
    ordersLoading: ordersQuery.isLoading,

    totalOrderAmount,
  };
}