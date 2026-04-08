// client/src/components/focuswin/page/client/detail/PurchaseSection.tsx
// 매입 전용 섹션: 거래처 상세에서 clie_type='purchase' or 'both' 일 때 보여주는 지출 요약

import { useMemo } from "react";
import { Link } from "wouter";
import { ArrowRight, Receipt, CreditCard, Banknote, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKRW } from "@/lib/format";
import type { useClientDetailVM } from "@/hooks/focuswin/client/useClientDetailVM";

type VM = ReturnType<typeof useClientDetailVM>;

const PAYM_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  card:     { label: "카드",  icon: <CreditCard size={11} />,       color: "bg-violet-50 text-violet-700" },
  cash:     { label: "현금",  icon: <Banknote size={11} />,         color: "bg-emerald-50 text-emerald-700" },
  transfer: { label: "이체",  icon: <ArrowLeftRight size={11} />,   color: "bg-blue-50 text-blue-700" },
  other:    { label: "기타",  icon: <Receipt size={11} />,          color: "bg-slate-50 text-slate-500" },
};

export default function PurchaseSection({ vm }: { vm: VM }) {
  const { expenses, expensesLoading } = vm;

  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + Number(e.expe_amnt), 0);
    const byMethod: Record<string, number> = {};
    for (const e of expenses) {
      byMethod[e.paym_meth] = (byMethod[e.paym_meth] ?? 0) + Number(e.expe_amnt);
    }
    return { total, count: expenses.length, byMethod };
  }, [expenses]);

  const recent = useMemo(
    () => [...expenses].sort((a, b) => new Date(b.expe_date).getTime() - new Date(a.expe_date).getTime()).slice(0, 8),
    [expenses]
  );

  return (
    <div
      className="rounded-3xl border border-slate-100 bg-white p-4"
      style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
    >
      <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase mb-1">PURCHASES</p>
      <p className="text-sm font-black text-slate-900 mb-4">
        매입 지출{" "}
        <span className="text-slate-400 font-normal text-xs">{stats.count}건</span>
      </p>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <SummaryCell label="총 매입액" value={formatKRW(stats.total)} tone="rose" />
        <SummaryCell label="건수" value={`${stats.count}건`} tone="slate" />
      </div>

      {/* 결제수단별 분포 */}
      {stats.count > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {Object.entries(stats.byMethod).map(([meth, amt]) => {
            const cfg = PAYM_CONFIG[meth] ?? PAYM_CONFIG.other;
            return (
              <span key={meth} className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold", cfg.color)}>
                {cfg.icon}
                {cfg.label} {formatKRW(amt)}
              </span>
            );
          })}
        </div>
      )}

      {/* 최근 지출 목록 */}
      {expensesLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 bg-slate-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">매입 지출 내역이 없어요.</p>
      ) : (
        <div className="divide-y divide-slate-50">
          {recent.map((e) => {
            const cfg = PAYM_CONFIG[e.paym_meth] ?? PAYM_CONFIG.other;
            return (
              <div key={e.expe_idno} className="flex items-center gap-3 py-2.5">
                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", cfg.color)}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{e.expe_name}</p>
                  {e.ai_categ && (
                    <p className="text-[10px] text-slate-400">{e.ai_categ}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-900">{formatKRW(Number(e.expe_amnt))}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(e.expe_date).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }).replace(/\.\s?/g, ".").replace(/\.$/, "")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 지출 목록 바로가기 */}
      <Link
        href="/expe-list"
        className="flex items-center justify-end gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 transition pt-2"
      >
        지출 목록 전체 보기
        <ArrowRight size={12} />
      </Link>
    </div>
  );
}

function SummaryCell({ label, value, tone }: { label: string; value: string; tone: "rose" | "slate" }) {
  const colors = {
    rose:  "text-rose-600",
    slate: "text-slate-700",
  };
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[10px] font-semibold text-slate-400">{label}</p>
      <p className={cn("text-sm font-black mt-0.5 leading-none", colors[tone])}>{value}</p>
    </div>
  );
}
