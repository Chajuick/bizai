"use client";

import { trpc } from "@/lib/trpc";
import { useLocation, useParams, Link } from "wouter";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  BookOpen,
  ShoppingCart,
  ChevronRight,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";

function getInitial(name: string) {
  const t = (name || "").trim();
  return t ? t[0] : "C";
}

function formatKRW(n: number) {
  const v = Number(n || 0);
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억원`;
  if (v >= 10_000) return `${(v / 10_000).toFixed(0)}만원`;
  return `${v.toLocaleString()}원`;
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const clientId = Number(id);

  const { data: client, isLoading } = trpc.clients.get.useQuery({ id: clientId });
  const { data: logs, isLoading: logsLoading } = trpc.salesLogs.list.useQuery({ clientId, limit: 10 });
  const { data: orders, isLoading: ordersLoading } = trpc.orders.list.useQuery({ clientId });

  const totalOrderAmount =
    orders?.filter((o: any) => o.status !== "canceled").reduce((sum: number, o: any) => sum + Number(o.amount || 0), 0) ??
    0;

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 max-w-2xl mx-auto">
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-slate-100 bg-white p-4 animate-pulse"
              style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
            >
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100" />
                <div className="flex-1">
                  <div className="h-3 w-44 bg-slate-100 rounded mb-2" />
                  <div className="h-3 w-2/3 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-4 lg:p-6 max-w-2xl mx-auto text-center py-16">
        <div className="mx-auto w-14 h-14 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <Users size={26} className="text-blue-600" />
        </div>
        <p className="mt-4 text-base font-black text-slate-900">고객사를 찾을 수 없어요</p>
        <p className="mt-1 text-sm text-slate-500">목록으로 돌아가서 다시 선택해보세요.</p>
        <Button className="mt-5 rounded-2xl" variant="outline" onClick={() => navigate("/clients")}>
          목록으로
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      {/* ✅ Toss-style sticky header */}
      <div
        className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 pt-3 pb-4 border-b mb-4"
        style={{
          background: "rgba(255,255,255,0.86)",
          borderColor: "rgba(15,23,42,0.08)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/clients")}
            className="w-10 h-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition flex items-center justify-center"
            aria-label="뒤로"
          >
            <ArrowLeft size={18} className="text-slate-700" />
          </button>

          <div className="min-w-0">
            <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
              CLIENT DETAIL
            </p>
            <h1 className="text-base sm:text-lg font-black text-slate-900 truncate">{client.name}</h1>
            <p className="mt-1 text-sm text-slate-500">연락처/기록/수주를 한 화면에서 확인해요.</p>
          </div>
        </div>
      </div>

      {/* ✅ Profile card */}
      <div
        className="rounded-3xl border border-slate-100 bg-white p-4 mb-4"
        style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <span className="text-lg font-black text-blue-600">{getInitial(client.name)}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-base font-black text-slate-900 truncate">{client.name}</p>

              {client.industry && (
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
                  style={{
                    background: "rgba(37,99,235,0.08)",
                    borderColor: "rgba(37,99,235,0.18)",
                    color: "rgb(37,99,235)",
                  }}
                >
                  {client.industry}
                </span>
              )}
            </div>

            <div className="mt-3 space-y-2 text-sm">
              {client.contactPerson && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Users size={14} className="text-slate-400" />
                  <span className="font-semibold text-slate-700">담당</span>
                  <span className="text-slate-600">{client.contactPerson}</span>
                </div>
              )}

              {client.contactPhone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={14} className="text-slate-400" />
                  <span className="font-semibold text-slate-700">연락처</span>
                  <span className="text-slate-600">{client.contactPhone}</span>
                </div>
              )}

              {client.contactEmail && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail size={14} className="text-slate-400" />
                  <span className="font-semibold text-slate-700">이메일</span>
                  <span className="text-slate-600 truncate">{client.contactEmail}</span>
                </div>
              )}

              {client.address && (
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin size={14} className="text-slate-400 mt-0.5" />
                  <span className="font-semibold text-slate-700 shrink-0">주소</span>
                  <span className="text-slate-600">{client.address}</span>
                </div>
              )}
            </div>

            {client.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-1">메모</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ KPI cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div
          className="rounded-3xl border border-slate-100 bg-white p-4"
          style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
        >
          <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">LOGS</p>
          <p className="mt-1 text-xl font-black text-slate-900">{logs?.length ?? 0}건</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">영업일지</p>
        </div>

        <div
          className="rounded-3xl border border-slate-100 bg-white p-4"
          style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
        >
          <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">ORDERS</p>
          <p className="mt-1 text-xl font-black text-slate-900">{formatKRW(totalOrderAmount)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">총 수주액</p>
        </div>
      </div>

      {/* ✅ Recent Logs */}
      <div
        className="rounded-3xl border border-slate-100 bg-white p-4 mb-4"
        style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
              RECENT LOGS
            </p>
            <p className="mt-1 text-sm font-black text-slate-900">최근 영업일지</p>
          </div>

          <Link
            href={`/sales-logs?search=${encodeURIComponent(client.name)}`}
            className="text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            전체 보기
          </Link>
        </div>

        {logsLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white p-3 animate-pulse">
                <div className="h-3 w-2/3 bg-slate-100 rounded mb-2" />
                <div className="h-3 w-1/3 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : (logs?.length ?? 0) === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <BookOpen size={20} className="text-blue-600" />
            </div>
            <p className="mt-3 text-sm font-black text-slate-900">아직 영업일지가 없어요</p>
            <p className="mt-1 text-xs text-slate-500">일지를 작성하면 여기에 최근 기록이 보여요.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs?.slice(0, 5).map((log: any) => (
              <Link key={log.id} href={`/sales-logs/${log.id}`}>
                <div className="group flex items-start gap-3 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition cursor-pointer">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <BookOpen size={14} className="text-blue-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                      {log.aiSummary || (log.rawContent ? String(log.rawContent).slice(0, 120) : "")}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {new Date(log.visitedAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-2xl bg-white border border-slate-100 flex items-center justify-center transition group-hover:bg-blue-50 group-hover:border-blue-100 shrink-0">
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ✅ Orders */}
      <div
        className="rounded-3xl border border-slate-100 bg-white p-4"
        style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">ORDERS</p>
            <p className="mt-1 text-sm font-black text-slate-900">수주</p>
          </div>

          <Link href="/orders" className="text-sm font-bold text-blue-600 hover:text-blue-700">
            수주 관리
          </Link>
        </div>

        {ordersLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white p-3 animate-pulse">
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
            {orders?.map((order: any) => (
              <div
                key={order.id}
                className="flex items-start gap-3 p-3 rounded-2xl border border-slate-100"
              >
                <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <ShoppingCart size={14} className="text-blue-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-slate-900">{order.productService}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-sm font-black text-slate-900">{formatKRW(Number(order.amount))}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}