import { trpc } from "@/lib/trpc";
import { useLocation, useParams, Link } from "wouter";
import { ArrowLeft, Building2, Phone, Mail, MapPin, BookOpen, ShoppingCart, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const clientId = Number(id);

  const { data: client, isLoading } = trpc.clients.get.useQuery({ id: clientId });
  const { data: logs } = trpc.salesLogs.list.useQuery({ clientId: clientId, limit: 10 });
  const { data: orders } = trpc.orders.list.useQuery({ clientId: clientId });

  const formatKRW = (n: number) => {
    if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
    if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만원`;
    return `${n.toLocaleString()}원`;
  };

  if (isLoading) return (
    <div className="p-4 max-w-2xl mx-auto space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="bp-card p-4 h-20 animate-pulse" />)}
    </div>
  );

  if (!client) return (
    <div className="p-4 max-w-2xl mx-auto text-center py-16">
      <p style={{ color: 'var(--blueprint-text-muted)' }}>고객사를 찾을 수 없습니다.</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate("/clients")}>목록으로</Button>
    </div>
  );

  const totalOrderAmount = orders?.filter(o => o.status !== "canceled").reduce((sum, o) => sum + Number(o.amount), 0) ?? 0;

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/clients")} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--blueprint-text-muted)' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="bp-section-header mb-0.5">CLIENT DETAIL</p>
          <h1 className="text-xl font-black text-white">{client.name}</h1>
        </div>
      </div>

      {/* Info Card */}
      <div className="bp-card p-4 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-black text-white"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e4d8c)' }}>
            {client.name[0]}
          </div>
          <div>
            <p className="font-bold text-white">{client.name}</p>
            {client.industry && (
              <span className="text-xs px-2 py-0.5 rounded font-mono"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                {client.industry}
              </span>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {client.contactPerson && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 size={14} style={{ color: '#60a5fa' }} />
              <span style={{ color: 'var(--blueprint-text-muted)' }}>{client.contactPerson}</span>
            </div>
          )}
          {client.contactPhone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} style={{ color: '#22d3ee' }} />
              <span style={{ color: 'var(--blueprint-text-muted)' }}>{client.contactPhone}</span>
            </div>
          )}
          {client.contactEmail && (
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} style={{ color: '#a78bfa' }} />
              <span style={{ color: 'var(--blueprint-text-muted)' }}>{client.contactEmail}</span>
            </div>
          )}
          {client.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} style={{ color: '#fbbf24' }} />
              <span style={{ color: 'var(--blueprint-text-muted)' }}>{client.address}</span>
            </div>
          )}
        </div>
        {client.notes && (
          <div className="mt-3 pt-3 border-t text-sm" style={{ borderColor: 'var(--blueprint-border)', color: 'var(--blueprint-text-muted)' }}>
            {client.notes}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bp-card p-3">
          <p className="text-xs font-mono mb-1" style={{ color: 'var(--blueprint-text-dim)' }}>// 영업일지</p>
          <p className="text-xl font-black text-white">{logs?.length ?? 0}건</p>
        </div>
        <div className="bp-card p-3">
          <p className="text-xs font-mono mb-1" style={{ color: 'var(--blueprint-text-dim)' }}>// 총 수주액</p>
          <p className="text-xl font-black" style={{ color: '#fbbf24' }}>{formatKRW(totalOrderAmount)}</p>
        </div>
      </div>

      {/* Recent Logs */}
      {(logs?.length ?? 0) > 0 && (
        <div className="bp-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="bp-section-header">RECENT LOGS</p>
            <Link href="/sales-logs" className="text-xs" style={{ color: 'var(--blueprint-accent-bright)' }}>전체</Link>
          </div>
          <div className="space-y-2">
            {logs?.slice(0, 5).map((log) => (
              <Link key={log.id} href={`/sales-logs/${log.id}`}>
                <div className="flex items-start gap-2 p-2 rounded hover:bg-white/5 transition-colors cursor-pointer">
                  <BookOpen size={14} className="mt-0.5 shrink-0" style={{ color: '#60a5fa' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{log.aiSummary || log.rawContent.slice(0, 60)}</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--blueprint-text-dim)' }}>
                      {new Date(log.visitedAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <ChevronRight size={12} style={{ color: '#60a5fa' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Orders */}
      {(orders?.length ?? 0) > 0 && (
        <div className="bp-card p-4">
          <p className="bp-section-header mb-3">ORDERS</p>
          <div className="space-y-2">
            {orders?.map((order) => (
              <div key={order.id} className="flex items-center gap-3 p-2 rounded" style={{ background: 'rgba(59,130,246,0.05)' }}>
                <ShoppingCart size={14} style={{ color: '#fbbf24' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{order.productService}</p>
                  <p className="text-xs font-bold" style={{ color: '#fbbf24' }}>{formatKRW(Number(order.amount))}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
