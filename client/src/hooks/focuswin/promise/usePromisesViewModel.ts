// hooks/usePromisesViewModel.ts
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { PromiseRow, EnhancedPromise, PromiseStatus, PromiseTabKey } from "@/types/promise";

type DbPromiseStatus = Exclude<PromiseStatus, "overdue">;

function computeKstTodayMidnightMs(nowMs: number) {
  const kstNow = new Date(nowMs + 9 * 60 * 60 * 1000);
  return new Date(kstNow.toISOString().slice(0, 10) + "T00:00:00+09:00").getTime();
}

export function usePromisesViewModel() {
  const [activeTab, setActiveTab] = useState<PromiseTabKey>("all");
  const { data: promises, isLoading } = trpc.promises.list.useQuery(undefined);

  const list = useMemo((): EnhancedPromise[] => {
    const nowMs = Date.now();
    const kstTodayMidnightMs = computeKstTodayMidnightMs(nowMs);
    const rows = (promises ?? []) as PromiseRow[];

    return rows.map((p) => {
      const scheduledMs = new Date(p.scheduledAt).getTime();
      const overdue = p.status === "scheduled" && scheduledMs < kstTodayMidnightMs;
      const imminent =
        p.status === "scheduled" &&
        !overdue &&
        scheduledMs > nowMs &&
        scheduledMs - nowMs <= 12 * 60 * 60 * 1000;

      return { ...p, overdue, imminent };
    });
  }, [promises]);

  const displayList = useMemo((): EnhancedPromise[] => {
    if (activeTab === "imminent") return list.filter(p => p.imminent);
    if (activeTab === "overdue") return list.filter(p => p.overdue);

    if (activeTab === "scheduled") return list.filter(p => p.status === "scheduled" && !p.overdue && !p.imminent);
    if (activeTab === "completed" || activeTab === "canceled") return list.filter(p => p.status === activeTab);

    return [...list].sort((a, b) => {
      const rank = (p: EnhancedPromise) => (p.overdue ? 0 : p.imminent ? 1 : 2);
      return rank(a) - rank(b);
    });
  }, [list, activeTab]);

  const counts = useMemo(() => {
    const base = { all: list.length, imminent: 0, overdue: 0, scheduled: 0, completed: 0, canceled: 0 };
    for (const p of list) {
      if (p.imminent) base.imminent++;
      else if (p.overdue) base.overdue++;
      else base[p.status as DbPromiseStatus]++;
    }
    return base;
  }, [list]);

  const overdueInList = counts.overdue;
  const imminentInList = counts.imminent;

  return { activeTab, setActiveTab, isLoading, list, displayList, counts, overdueInList, imminentInList };
}

export type { PromiseTabKey as TabKey };