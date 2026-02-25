import React, { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { usePromiseAlerts } from "@/hooks/usePromiseAlerts";
import { Link } from "wouter";
import {
  BookOpen,
  Calendar,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import StatusBadge from "@/components/StatusBadge";

function formatKRW(n: number) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만`;
  return n.toLocaleString();
}

function formatKRWFull(n: number) {
  return `${n.toLocaleString()}원`;
}

function ClickableCard({
  children,
  className = "",
  href,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  ariaLabel?: string;
}) {
  const base =
    "bp-card p-4 transition cursor-pointer hover:border-blue-500/30 hover:bg-slate-50 " +
    "focus-within:ring-2 focus-within:ring-blue-200 focus-within:ring-offset-2 focus-within:ring-offset-transparent";
  const content = (
    <div className={[base, className].join(" ")} aria-label={ariaLabel}>
      {children}
    </div>
  );
  return href ? (
    <Link href={href}>
      {/* Link 자체에 focus 들어오게 하려면 내부에 a를 쓰는게 베스트지만 wouter Link는 div 래핑도 많이 씀 */}
      {content}
    </Link>
  ) : (
    content
  );
}

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  href?: string;
}) {
  return (
    <ClickableCard href={href} ariaLabel={`${label} 보기`}>
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center"
          style={{
            background: `${color}14`,
            border: `1px solid ${color}24`,
          }}
        >
          <Icon size={18} style={{ color }} />
        </div>

        {/* ✅ 클릭 힌트: 작은 chevron + 라벨 */}
        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
          <span className="bp-section-header text-[9px]">{label}</span>
          {href && <ArrowRight size={12} className="opacity-70" />}
        </div>
      </div>

      <p className="text-2xl font-black text-[color:var(--blueprint-text)]">
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1 text-[color:var(--blueprint-text-dim)]">
          {sub}
        </p>
      )}
    </ClickableCard>
  );
}

function EmptyState({
  title,
  desc,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  desc: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm font-bold text-[color:var(--blueprint-text)]">
        {title}
      </p>
      <p className="mt-1 text-xs text-[color:var(--blueprint-text-dim)]">
        {desc}
      </p>

      <div className="mt-4 flex justify-center">
        <Link href={ctaHref}>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-white"
            style={{
              background: "var(--blueprint-accent)",
              boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
            }}
          >
            <Plus size={16} />
            {ctaLabel}
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: trend } = trpc.dashboard.revenueTrend.useQuery();

  const now = new Date();
  const monthLabel = `${now.getMonth() + 1}월`;

  // 브라우저 알림 (세션 당 1회)
  usePromiseAlerts(stats?.overdueCount ?? 0, stats?.imminentCount ?? 0);

  // 차트 해석 한 줄
  const chartInsight = useMemo(() => {
    if (!trend || trend.length < 2) return null;

    const last = trend[trend.length - 1]?.delivery ?? 0;
    const prev = trend[trend.length - 2]?.delivery ?? 0;

    if (prev <= 0 && last > 0) return `최근 한 달 납품 매출이 새로 잡혔어요.`;
    if (prev <= 0 && last <= 0) return null;

    const diff = last - prev;
    const pct = (diff / prev) * 100;
    const sign = diff >= 0 ? "+" : "";
    return `납품 지난달 대비 ${sign}${pct.toFixed(0)}% (${sign}${formatKRW(diff)}원)`;
  }, [trend]);

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="bp-section-header mb-1">DASHBOARD</p>
          <h1 className="text-xl font-black text-[color:var(--blueprint-text)]">
            {monthLabel} 영업 현황
          </h1>
        </div>

        <Link href="/sales-logs/new">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-white transition active:scale-[0.99]"
            style={{
              background: "var(--blueprint-accent)",
              boxShadow: "0 10px 26px rgba(37,99,235,0.22)",
            }}
          >
            <Plus size={16} />
            일지 작성
          </button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bp-card p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <KPICard
              icon={BookOpen}
              label="이번달 일지"
              value={stats?.logsThisMonth ?? 0}
              sub={`${monthLabel} 작성`}
              color="#2563eb"
              href="/sales-logs"
            />
            <KPICard
              icon={Calendar}
              label="예정 일정"
              value={stats?.upcomingPromisesCount ?? 0}
              sub={
                stats?.overdueCount
                  ? `지연 ${stats.overdueCount}건${stats.imminentCount ? ` · 임박 ${stats.imminentCount}건` : ""}`
                  : stats?.imminentCount
                  ? `임박 ${stats.imminentCount}건`
                  : "진행 예정"
              }
              color="#0ea5e9"
              href="/promises"
            />
            <KPICard
              icon={ShoppingCart}
              label="진행 수주"
              value={stats?.activeOrdersCount ?? 0}
              sub={`${formatKRW(stats?.activeOrdersTotal ?? 0)}원`}
              color="#f59e0b"
              href="/orders"
            />
            <KPICard
              icon={TrendingUp}
              label={`${monthLabel} 매출`}
              value={`${formatKRW(stats?.monthlyRevenue ?? 0)}원`}
              sub="수금 완료"
              color="#10b981"
              href="/deliveries"
            />
          </div>

          {/* Overdue Alert */}
          {(stats?.overdueCount ?? 0) > 0 && (
            <div
              className="mb-3 p-3 rounded-2xl flex items-center gap-3"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.16)",
              }}
            >
              <AlertTriangle size={16} style={{ color: "#ef4444" }} />
              <p className="text-sm" style={{ color: "#b91c1c" }}>
                <strong>{stats?.overdueCount}건</strong>의 일정이 지연되었습니다.
              </p>
              <Link
                href="/promises?tab=overdue"
                className="ml-auto text-xs font-semibold underline"
                style={{ color: "#b91c1c" }}
              >
                확인하기
              </Link>
            </div>
          )}

          {/* Imminent Alert */}
          {(stats?.imminentCount ?? 0) > 0 && (
            <div
              className="mb-6 p-3 rounded-2xl flex items-center gap-3"
              style={{
                background: "rgba(249,115,22,0.08)",
                border: "1px solid rgba(249,115,22,0.18)",
              }}
            >
              <AlertTriangle size={16} style={{ color: "#f97316" }} />
              <p className="text-sm" style={{ color: "#c2410c" }}>
                <strong>{stats?.imminentCount}건</strong>의 일정이 12시간 이내에 예정되어 있습니다.
              </p>
              <Link
                href="/promises"
                className="ml-auto text-xs font-semibold underline"
                style={{ color: "#c2410c" }}
              >
                확인하기
              </Link>
            </div>
          )}
          {/* 두 알림 모두 없을 때 mb-6 보정 */}
          {(stats?.overdueCount ?? 0) === 0 && (stats?.imminentCount ?? 0) === 0 && (
            <div className="mb-6" />
          )}

          {/* Revenue Chart */}
          <div className="bp-card p-4 mb-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="bp-section-header">REVENUE TREND (6개월)</p>
                {chartInsight && (
                  <p className="mt-1 text-xs text-slate-500">{chartInsight}</p>
                )}
              </div>
              <Link
                href="/deliveries"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                자세히
              </Link>
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trend ?? []} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="deliveryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "var(--blueprint-surface)",
                    border: "1px solid rgba(15,23,42,0.10)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
                  }}
                  formatter={(v: number, name: string) => [
                    formatKRWFull(v),
                    name === "order" ? "수주" : "납품",
                  ]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(name: string) => (
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      {name === "order" ? "수주" : "납품"}
                    </span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="order"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#orderGrad)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="delivery"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#deliveryGrad)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Two Column */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Logs */}
            <div className="bp-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="bp-section-header">RECENT LOGS</p>
                <Link
                  href="/sales-logs"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  전체 보기
                </Link>
              </div>

              {(stats?.recentLogs?.length ?? 0) === 0 ? (
                <EmptyState
                  title="아직 영업일지가 없어요"
                  desc="첫 기록을 남기면 AI가 자동으로 정리해줘요."
                  ctaLabel="첫 일지 작성"
                  ctaHref="/sales-logs/new"
                />
              ) : (
                <div className="space-y-2">
                  {stats?.recentLogs?.map((log) => (
                    <Link key={log.id} href={`/sales-logs/${log.id}`}>
                      <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer">
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ background: "var(--blueprint-accent)" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[color:var(--blueprint-text)] truncate">
                            {log.clientName || "고객사 미지정"}
                          </p>
                          <p className="text-xs truncate text-[color:var(--blueprint-text-dim)]">
                            {log.rawContent.slice(0, 60)}...
                          </p>
                        </div>
                        <p className="text-xs shrink-0 text-[color:var(--blueprint-text-dim)]">
                          {new Date(log.visitedAt).toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Promises */}
            <div className="bp-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="bp-section-header">UPCOMING PROMISES</p>
                <Link
                  href="/promises"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  전체 보기
                </Link>
              </div>

              {(stats?.upcomingPromises?.length ?? 0) === 0 ? (
                <EmptyState
                  title="예정된 일정이 없어요"
                  desc="다음 미팅을 등록해두면 놓치지 않아요."
                  ctaLabel="일정 등록"
                  ctaHref="/promises/new"
                />
              ) : (
                <div className="space-y-2">
                  {stats?.upcomingPromises?.map((p) => {
                    const ms = new Date(p.scheduledAt).getTime();
                    const nowMs = Date.now();
                    const isImminent = ms > nowMs && ms - nowMs <= 12 * 60 * 60 * 1000;
                    return (
                      <div
                        key={p.id}
                        className="flex items-start gap-3 p-3 rounded-2xl border transition"
                        style={
                          isImminent
                            ? { background: "rgba(249,115,22,0.06)", borderColor: "rgba(249,115,22,0.20)" }
                            : { background: "rgba(248,250,252,1)", borderColor: "rgba(226,232,240,1)" }
                        }
                      >
                        <Calendar
                          size={16}
                          className="mt-0.5 shrink-0"
                          style={{ color: isImminent ? "rgb(234,88,12)" : "rgb(14,165,233)" }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-semibold text-[color:var(--blueprint-text)] truncate">
                              {p.title}
                            </p>
                            {isImminent && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-bold border font-mono"
                                style={{
                                  background: "rgba(249,115,22,0.10)",
                                  color: "rgb(234,88,12)",
                                  borderColor: "rgba(249,115,22,0.22)",
                                }}
                              >
                                임박
                              </span>
                            )}
                          </div>
                          {p.clientName && (
                            <p className="text-xs text-[color:var(--blueprint-text-dim)]">
                              {p.clientName}
                            </p>
                          )}
                        </div>
                        <p
                          className="text-xs shrink-0 font-semibold"
                          style={{ color: isImminent ? "rgb(234,88,12)" : "rgb(100,116,139)" }}
                        >
                          {new Date(p.scheduledAt).toLocaleString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* FAB */}
      <Link href="/sales-logs/new">
        <button className="fab lg:hidden" aria-label="일지 작성">
          <Plus size={24} color="white" />
        </button>
      </Link>
    </div>
  );
}