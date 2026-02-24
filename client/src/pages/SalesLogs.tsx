import { useMemo, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation, Link } from "wouter";
import { Plus, Search, BookOpen, Mic, Brain, ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type FilterKey = "all" | "thisWeek" | "ai" | "audio";

function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // make Monday start
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function Badge({
  icon: Icon,
  label,
  tone = "blue",
}: {
  icon: React.ElementType;
  label: string;
  tone?: "blue" | "violet" | "sky";
}) {
  const styles =
    tone === "violet"
      ? {
          bg: "rgba(139,92,246,0.10)",
          bd: "rgba(139,92,246,0.16)",
          fg: "rgba(109,40,217,0.92)",
        }
      : tone === "sky"
        ? {
            bg: "rgba(14,165,233,0.10)",
            bd: "rgba(14,165,233,0.16)",
            fg: "rgba(3,105,161,0.92)",
          }
        : {
            bg: "rgba(37,99,235,0.10)",
            bd: "rgba(37,99,235,0.16)",
            fg: "rgba(29,78,216,0.92)",
          };

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{
        background: styles.bg,
        border: `1px solid ${styles.bd}`,
        color: styles.fg,
      }}
    >
      <Icon size={12} />
      {label}
    </span>
  );
}

function TossChip({
  active,
  label,
  onClick,
  count,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold transition shrink-0",
        "border",
        active
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
      ].join(" ")}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span
          className={[
            "text-[11px] font-extrabold px-2 py-0.5 rounded-full",
            active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600",
          ].join(" ")}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function SalesLogs() {
  const [location, navigate] = useLocation();

  const getSearchFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("search") ?? "";
  };

  const [search, setSearch] = useState(getSearchFromURL);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    const urlSearch = getSearchFromURL();
    if (urlSearch !== search) setSearch(urlSearch);
    // eslint-disable-next-line
  }, [location]);

  const { data: logs, isLoading } = trpc.salesLogs.list.useQuery({
    search: search || undefined,
    limit: 50,
  });

  const now = new Date();
  const weekStart = useMemo(() => startOfWeekMonday(now), [now]);

  const counts = useMemo(() => {
    const arr = logs ?? [];
    const thisWeek = arr.filter((l) => new Date(l.visitedAt) >= weekStart).length;
    const ai = arr.filter((l) => !!l.isProcessed).length;
    const audio = arr.filter((l) => !!l.audioUrl).length;
    return { all: arr.length, thisWeek, ai, audio };
  }, [logs, weekStart]);

  const filteredLogs = useMemo(() => {
    const arr = logs ?? [];
    if (filter === "thisWeek") return arr.filter((l) => new Date(l.visitedAt) >= weekStart);
    if (filter === "ai") return arr.filter((l) => !!l.isProcessed);
    if (filter === "audio") return arr.filter((l) => !!l.audioUrl);
    return arr;
  }, [logs, filter, weekStart]);

  const hasData = (filteredLogs?.length ?? 0) > 0;

  const emptyTitle = useMemo(() => {
    if (search.trim()) return "검색 결과가 없어요";
    if (filter !== "all") return "조건에 맞는 일지가 없어요";
    return "아직 영업일지가 없어요";
  }, [search, filter]);

  const emptyDesc = useMemo(() => {
    if (search.trim()) return "검색어를 바꿔서 다시 시도해보세요.";
    if (filter !== "all") return "필터를 ‘전체’로 바꾸거나 새 일지를 작성해보세요.";
    return "첫 기록을 남기면 AI가 자동으로 요약/정리해줘요.";
  }, [search, filter]);

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* ✅ Toss-style sticky header */}
      <div
        className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 pt-3 pb-4 border-b"
        style={{
          background: "rgba(255,255,255,0.86)",
          borderColor: "rgba(15,23,42,0.08)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
              SALES LOGS
            </p>
            <h1 className="text-base sm:text-lg font-black text-slate-900">영업일지</h1>
            <p className="mt-1 text-sm text-slate-500">
              기록을 모아두면, 찾고 정리하기가 쉬워져요.
            </p>
          </div>

          <Link href="/sales-logs/new">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-white transition active:scale-[0.99]"
              style={{
                background: "rgb(37, 99, 235)",
                boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
              }}
            >
              <Plus size={16} />
              작성
            </button>
          </Link>
        </div>

        {/* ✅ Search */}
        <div className="mt-3 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          {!!search.trim() && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                navigate("/sales-logs", { replace: true });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center"
              aria-label="검색어 지우기"
            >
              <X size={14} className="text-slate-600" />
            </button>
          )}
          <Input
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);

              const q = value.trim();
              navigate(q ? `/sales-logs?search=${encodeURIComponent(q)}` : "/sales-logs", {
                replace: true,
              });
            }}
            placeholder="고객사, 담당자, 내용으로 검색…"
            className="pl-9 pr-10 py-3 text-sm rounded-2xl border border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-blue-200"
          />
        </div>

        {/* ✅ Chips */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          <TossChip active={filter === "all"} label="전체" count={counts.all} onClick={() => setFilter("all")} />
          <TossChip active={filter === "thisWeek"} label="이번주" count={counts.thisWeek} onClick={() => setFilter("thisWeek")} />
          <TossChip active={filter === "ai"} label="AI" count={counts.ai} onClick={() => setFilter("ai")} />
          <TossChip active={filter === "audio"} label="음성" count={counts.audio} onClick={() => setFilter("audio")} />
        </div>
      </div>

      {/* List */}
      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-3xl border border-slate-100 bg-white p-4 animate-pulse"
                style={{ boxShadow: "0 10px 26px rgba(15,23,42,0.04)" }}
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100" />
                  <div className="flex-1">
                    <div className="h-3 w-40 bg-slate-100 rounded mb-2" />
                    <div className="h-3 w-full bg-slate-100 rounded mb-2" />
                    <div className="h-3 w-2/3 bg-slate-100 rounded" />
                  </div>
                  <div className="h-3 w-14 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : !hasData ? (
          <div className="text-center py-14">
            <div className="mx-auto w-14 h-14 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <BookOpen size={26} className="text-blue-600" />
            </div>

            <p className="mt-4 text-base font-black text-slate-900">{emptyTitle}</p>
            <p className="mt-1 text-sm text-slate-500">{emptyDesc}</p>

            <div className="mt-5 flex justify-center gap-2">
              <Link href="/sales-logs/new">
                <button
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
                  style={{ background: "rgb(37, 99, 235)" }}
                >
                  <Plus size={16} />
                  일지 작성하기
                </button>
              </Link>

              {(search.trim() || filter !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                    navigate("/sales-logs", { replace: true });
                  }}
                  className="px-5 py-2.5 rounded-2xl text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 transition"
                >
                  초기화
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs?.map((log) => (
              <Link key={log.id} href={`/sales-logs/${log.id}`}>
                <div
                  className={[
                    "group rounded-3xl border border-slate-100 bg-white p-4 transition cursor-pointer",
                    "hover:shadow-[0_16px_40px_rgba(15,23,42,0.06)] hover:border-blue-100",
                    "focus-within:ring-2 focus-within:ring-blue-200",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen size={16} className="text-blue-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-slate-900 text-sm truncate">
                          {log.clientName || "고객사 미지정"}
                        </p>

                        {log.contactPerson && (
                          <span className="text-xs font-semibold text-slate-500">
                            · {log.contactPerson}
                          </span>
                        )}

                        <div className="flex items-center gap-1">
                          {log.audioUrl && <Badge icon={Mic} label="음성" tone="sky" />}
                          {log.isProcessed && <Badge icon={Brain} label="AI" tone="violet" />}
                        </div>
                      </div>

                      <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                        {log.aiSummary || log.rawContent}
                      </p>

                      {log.location && (
                        <p className="mt-2 text-xs text-slate-500">📍 {log.location}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="text-xs font-semibold text-slate-400">
                        {new Date(log.visitedAt).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>

                      <div className="w-8 h-8 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center transition group-hover:bg-blue-50 group-hover:border-blue-100">
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link href="/sales-logs/new">
        <button
          className="fixed bottom-20 right-5 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-[0_12px_28px_rgba(37,99,235,0.30)] lg:hidden"
          style={{ background: "rgb(37, 99, 235)" }}
          aria-label="일지 작성"
        >
          <Plus size={24} />
        </button>
      </Link>
    </div>
  );
}