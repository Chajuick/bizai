// client/src/hooks/focuswin/search/useGlobalSearch.ts

import { useState, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { formatKRW } from "@/lib/format";

export type SearchResultKind = "client" | "order" | "shipment" | "schedule" | "expense";

export type SearchResultItem = {
  kind: SearchResultKind;
  id: number;
  title: string;
  subtitle: string;
  meta: string;
  path: string;
};

const ORDER_STAT_LABEL: Record<string, string> = {
  proposal: "제안",
  negotiation: "협상",
  confirmed: "확정",
  canceled: "취소",
};

const SHIP_STAT_LABEL: Record<string, string> = {
  pending: "대기",
  delivered: "납품완료",
  invoiced: "청구완료",
  paid: "수금완료",
};

const SCHE_STAT_LABEL: Record<string, string> = {
  scheduled: "예정",
  done: "완료",
  canceled: "취소",
};

export function useGlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // #region Debounced query (300ms) — API 요청 최소화
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSetQuery = useCallback((v: string) => {
    setQuery(v);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(v.trim());
    }, 300);
  }, []);
  // #endregion

  // #region Global "/" shortcut — input/textarea 포커스 중엔 무시
  const openSearch = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    setDebouncedQuery("");
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      e.preventDefault();
      openSearch();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openSearch]);
  // #endregion

  const trimmed = debouncedQuery;

  const { data, isFetching } = trpc.crm.search.query.useQuery(
    { q: trimmed },
    { enabled: trimmed.length >= 1, staleTime: 10_000 }
  );

  // #region Result mapping
  type ClientItem = NonNullable<typeof data>["clients"][number];
  type OrderItem = NonNullable<typeof data>["orders"][number];
  type ShipmentItem = NonNullable<typeof data>["shipments"][number];
  type ScheduleItem = NonNullable<typeof data>["schedules"][number];
  type ExpenseItem = NonNullable<typeof data>["expenses"][number];

  const results: { label: string; kind: SearchResultKind; items: SearchResultItem[] }[] = [];

  if (data) {
    if (data.clients.length > 0) {
      results.push({
        label: "거래처",
        kind: "client",
        items: data.clients.map((c: ClientItem) => ({
          kind: "client",
          id: c.clie_idno,
          title: c.clie_name,
          subtitle: c.clie_type === "purchase" ? "매입처" : c.clie_type === "both" ? "겸용" : "매출처",
          meta: "",
          path: `/clie-list/${c.clie_idno}`,
        })),
      });
    }

    if (data.orders.length > 0) {
      results.push({
        label: "수주",
        kind: "order",
        items: data.orders.map((o: OrderItem) => ({
          kind: "order",
          id: o.orde_idno,
          title: o.prod_serv,
          subtitle: o.clie_name,
          meta: `${ORDER_STAT_LABEL[o.orde_stat] ?? o.orde_stat} · ${formatKRW(Number(o.orde_pric))}`,
          path: `/orde-list/${o.orde_idno}`,
        })),
      });
    }

    if (data.shipments.length > 0) {
      results.push({
        label: "납품",
        kind: "shipment",
        // 납품 상세 페이지 없음 → 납품 목록으로 이동
        items: data.shipments.map((s: ShipmentItem) => ({
          kind: "shipment",
          id: s.ship_idno,
          title: s.clie_name,
          subtitle: s.ship_date
            ? new Date(s.ship_date).toLocaleDateString("ko-KR")
            : "날짜 미입력",
          meta: `${SHIP_STAT_LABEL[s.ship_stat] ?? s.ship_stat} · ${formatKRW(Number(s.ship_pric))}`,
          path: `/ship-list/${s.ship_idno}`,
        })),
      });
    }

    if (data.schedules.length > 0) {
      results.push({
        label: "일정",
        kind: "schedule",
        items: data.schedules.map((s: ScheduleItem) => ({
          kind: "schedule",
          id: s.sche_idno,
          title: s.sche_name,
          subtitle: s.clie_name ?? "",
          meta: `${SCHE_STAT_LABEL[s.sche_stat] ?? s.sche_stat} · ${new Date(s.sche_date).toLocaleDateString("ko-KR")}`,
          path: `/sche-list/${s.sche_idno}`,
        })),
      });
    }

    if (data.expenses.length > 0) {
      results.push({
        label: "지출",
        kind: "expense",
        items: data.expenses.map((e: ExpenseItem) => ({
          kind: "expense",
          id: e.expe_idno,
          title: e.expe_name,
          subtitle: e.clie_name ?? "",
          meta: `${new Date(e.expe_date).toLocaleDateString("ko-KR")} · ${formatKRW(Number(e.expe_amnt))}`,
          path: `/expe-list/${e.expe_idno}`,
        })),
      });
    }
  }
  // #endregion

  const totalCount = results.reduce((s, g) => s + g.items.length, 0);
  // query는 입력 즉시 반영, debouncedQuery는 300ms 후 반영 — isEmpty는 debounced 기준
  const isEmpty = trimmed.length > 0 && !isFetching && totalCount === 0;

  return {
    open,
    openSearch,
    closeSearch,
    query,
    setQuery: handleSetQuery,
    results,
    isFetching,
    isEmpty,
    totalCount,
  };
}
