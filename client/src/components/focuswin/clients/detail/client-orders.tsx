import { Link } from "wouter";
import { ShoppingCart } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { WorkItemCard } from "@/components/focuswin/common/work-item-card";
import type { OrderRow } from "@/types/order";

import { formatKRW } from "@/lib/format";

export default function ClientOrders({
  orders,
  loading,
}: {
  orders?: OrderRow[];
  loading: boolean;
}) {
  return (
    <div
      className="rounded-3xl border border-slate-100 bg-white p-4"
      style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
            ORDERS
          </p>
          <p className="mt-1 text-sm font-black text-slate-900">수주</p>
        </div>

        <Link href="/orders" className="text-sm font-bold text-blue-600 hover:text-blue-700">
          수주 관리
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-100 bg-white p-3 animate-pulse"
            >
              <div className="h-3 w-1/2 bg-slate-100 rounded mb-2" />
              <div className="h-3 w-1/3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : (orders?.length ?? 0) === 0 ? (
        <div className="text-center py-8">
          <div className="mx-auto w-12 h-12 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <ShoppingCart size={20} className="text-blue-600" />
          </div>
          <p className="mt-3 text-sm font-black text-slate-900">수주가 없어요</p>
          <p className="mt-1 text-xs text-slate-500">수주가 등록되면 이곳에서 확인할 수 있어요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders?.map((order) => (
            <WorkItemCard key={order.id} className="p-3">
              <WorkItemCard.Icon
                className="w-9 h-9"
                variant={order.status === "canceled" ? "slate" : "primary"}
              >
                <ShoppingCart size={14} />
              </WorkItemCard.Icon>

              <div className="min-w-0 flex-1">
                <WorkItemCard.Header
                  title={order.productService}
                  tags={<StatusBadge status={order.status} />}
                />
                <WorkItemCard.Body>
                  <p className="text-sm font-black text-slate-900">
                    {formatKRW(Number(order.amount))}
                  </p>
                </WorkItemCard.Body>
              </div>
            </WorkItemCard>
          ))}
        </div>
      )}
    </div>
  );
}
