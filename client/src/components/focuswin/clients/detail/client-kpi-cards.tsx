"use client";

function formatKRW(n: number) {
  const v = Number(n || 0);
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억원`;
  if (v >= 10_000) return `${(v / 10_000).toFixed(0)}만원`;
  return `${v.toLocaleString()}원`;
}

export default function ClientKpiCards({
  logsCount,
  totalOrderAmount,
}: {
  logsCount: number;
  totalOrderAmount: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <Card title="LOGS" value={`${logsCount}건`} sub="영업일지" />
      <Card
        title="ORDERS"
        value={formatKRW(totalOrderAmount)}
        sub="총 수주액"
      />
    </div>
  );
}

function Card({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      className="rounded-3xl border border-slate-100 bg-white p-4"
      style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
    >
      <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
        {title}
      </p>
      <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{sub}</p>
    </div>
  );
}