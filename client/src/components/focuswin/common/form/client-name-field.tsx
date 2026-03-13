// components/focuswin/page/sale/form/client-name-field.tsx
//
// 거래처명 입력 + 자동완성 드롭다운 + 유사 거래처 제안 + 거래처 미리보기
//
// ============================================================================
// UX 개선 포인트
// ----------------------------------------------------------------------------
// 1) 거래처 선택 전
//    - 입력/검색/선택 자체에 집중
//    - 검색 결과와 "새 거래처 추가" 액션을 명확히 분리
//
// 2) 거래처 선택 후
//    - 큰 상세 카드 대신 "요약 바" 우선 노출
//    - 필요할 때만 최근 거래 이력 / 예정 일정 펼쳐보기
//
// 3) 유사 거래처 제안
//    - onBlur 시 과한 카드 대신 가벼운 인라인 제안 형태
//
// 4) 상태 아이콘
//    - 검색 중: Spinner
//    - 선택 완료: Check
//    - 기본: ChevronDown
//
// 5) IME / 클릭 안정성
//    - blur 지연 처리 유지
//    - onMouseDown preventDefault 유지
// ============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Check, ChevronDown, Loader2, Plus, Building2, CalendarDays, User2, History, Clock3 } from "lucide-react";
import { toast } from "sonner";

import { handleApiError } from "@/lib/handleApiError";
import { cn } from "@/lib/utils";

import { Input } from "@/components/focuswin/common/ui/input";
import { Field } from "@/components/focuswin/common/form/field";

// #region Types
type Client = {
  clie_idno: number;
  clie_name: string;
};

type Suggestion = {
  client: Client;
  confidence: number;
};

type ClientNameFieldProps = {
  // Field UI
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;

  // Input
  value: string;
  clientId?: number;
  onChange: (name: string, clientId?: number) => void;
  placeholder?: string;

  // Behavior
  debounceMs?: number;
};
// #endregion

// #region Utils
function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR");
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR");
}
// #endregion

// #region Component
export default function ClientNameField({
  label = "거래처",
  hint,
  error,
  required,
  className,

  value,
  clientId,
  onChange,
  placeholder = "(주)거래처명",

  debounceMs = 300,
}: ClientNameFieldProps) {
  // #region State / Refs
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [debounced, setDebounced] = useState("");
  const [previewExpanded, setPreviewExpanded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // #endregion

  // #region TRPC
  const utils = trpc.useUtils();

  const createMutation = trpc.crm.client.create.useMutation();

  const { data: searchResultsData, isFetching } = trpc.crm.client.list.useQuery(
    {
      search: debounced || undefined,
      limit: debounced ? 50 : 20,
    },
    {
      enabled: open,
      staleTime: 10_000,
    }
  );

  const searchResults = searchResultsData?.items ?? [];

  const { data: clientPreview, isFetching: isPreviewFetching } = trpc.crm.client.preview.useQuery(
    { clie_idno: clientId! },
    {
      enabled: !!clientId,
      staleTime: 10_000,
    }
  );
  // #endregion

  // #region Derived
  const trimmedValue = value.trim();

  const normalizedValue = useMemo(() => trimmedValue.toLowerCase(), [trimmedValue]);

  const hasExactMatch = useMemo(() => {
    if (!normalizedValue) return false;
    return searchResults.some(c => c.clie_name.trim().toLowerCase() === normalizedValue);
  }, [searchResults, normalizedValue]);

  const showCreateAction = !!trimmedValue && !hasExactMatch;

  const statusIcon = useMemo(() => {
    if (isFetching) {
      return <Loader2 size={14} className="absolute right-0 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground/70" />;
    }

    if (clientId && !open) {
      return <Check size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-primary" />;
    }

    return <ChevronDown size={14} className={cn("absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none transition-transform", open && "rotate-180")} />;
  }, [isFetching, clientId, open]);
  // #endregion

  // #region Effects
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(blurTimerRef.current);
      clearTimeout(debounceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // 거래처가 바뀌면 상세 펼침은 기본적으로 닫아둠
    setPreviewExpanded(false);
  }, [clientId]);
  // #endregion

  // #region Handlers - Input
  const handleInputChange = (val: string) => {
    // 사용자가 직접 타이핑 시작하면 기존 선택 clientId는 해제
    onChange(val, undefined);

    // 입력을 다시 시작했으므로 기존 제안/상세 상태 정리
    setSuggestion(null);
    setPreviewExpanded(false);

    // 자동완성 드롭다운 오픈
    setOpen(true);

    // debounce 검색
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebounced(val);
    }, debounceMs);
  };

  const handleFocus = () => {
    // 이미 확정된 상태라도 포커스 시 목록을 열 수 있게 하되,
    // 사용자 경험상 값이 있으면 그 값 기준으로 한번 검색
    setOpen(true);
    setDebounced(value);
  };

  const handleBlur = useCallback(() => {
    clearTimeout(blurTimerRef.current);

    blurTimerRef.current = setTimeout(async () => {
      setOpen(false);

      // 이미 거래처가 확정되었거나, 공백이면 유사 매칭 불필요
      if (clientId || !value.trim()) return;

      try {
        const match = await utils.crm.client.findBestMatch.fetch({ name: value });
        if (!match) return;

        // 완전 일치면 자동 연결
        if (match.clie_name.trim().toLowerCase() === value.trim().toLowerCase()) {
          onChange(match.clie_name, match.clie_idno);
          return;
        }

        // 완전 일치가 아니면 가벼운 제안만 노출
        setSuggestion({
          client: {
            clie_idno: match.clie_idno,
            clie_name: match.clie_name,
          },
          confidence: match.confidence,
        });
      } catch {
        // 보조 UX이므로 실패 시 조용히 무시
      }
    }, 150);
  }, [clientId, value, utils, onChange]);
  // #endregion

  // #region Handlers - Selection / Suggestion
  const handleSelect = (client: Client) => {
    onChange(client.clie_name, client.clie_idno);
    setSuggestion(null);
    setOpen(false);
  };

  const handleConfirmSuggestion = () => {
    if (!suggestion) return;

    onChange(suggestion.client.clie_name, suggestion.client.clie_idno);
    setSuggestion(null);
    setOpen(false);
  };

  const handleRejectSuggestion = async () => {
    try {
      const result = await createMutation.mutateAsync({ clie_name: value });

      await utils.crm.client.list.invalidate();

      onChange(value, (result as any).clie_idno);
      toast.success(`'${value}' 거래처가 추가되었습니다.`);
    } catch (e) {
      handleApiError(e);
    } finally {
      setSuggestion(null);
    }
  };
  // #endregion

  // #region Handlers - Create
  const handleCreateDirect = async () => {
    if (!trimmedValue) return;

    try {
      const result = await createMutation.mutateAsync({ clie_name: trimmedValue });

      await utils.crm.client.list.invalidate();

      onChange(trimmedValue, (result as any).clie_idno);
      setSuggestion(null);
      setOpen(false);

      toast.success(`'${trimmedValue}' 거래처가 추가되었습니다.`);
    } catch (e) {
      handleApiError(e);
    }
  };
  // #endregion

  // #region Render Helpers
  const renderEmptyState = () => {
    if (!trimmedValue && !isFetching) {
      return <div className="px-3 py-3 text-xs text-muted-foreground/80">등록된 거래처를 검색해 선택해 주세요.</div>;
    }

    if (isFetching) {
      return <div className="px-3 py-3 text-xs text-muted-foreground/80">검색 중…</div>;
    }

    return (
      <div className="p-3">
        <div className="rounded-2xl border border-border/70 bg-muted/25 p-3">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 shrink-0 rounded-lg bg-background p-1.5 text-muted-foreground">
              <Building2 size={14} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground leading-snug">
                <span className="break-all">'{trimmedValue}'</span> 거래처가 없습니다.
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">새 거래처로 등록하면 이후 검색과 연결이 쉬워져요.</p>
            </div>
          </div>

          <button
            type="button"
            onMouseDown={e => {
              e.preventDefault();
              handleCreateDirect();
            }}
            disabled={createMutation.isPending}
            className="
              mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5
              rounded-xl border border-border/70 bg-background
              px-3 text-xs font-semibold text-foreground
              transition-colors hover:bg-muted/60
              disabled:opacity-60
            "
          >
            {createMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}새 거래처 등록
          </button>
        </div>
      </div>
    );
  };

  const renderSearchResults = () => {
    return (
      <div className="p-1.5">
        {/* 검색 결과 */}
        <div className="px-2 pb-1 pt-1">
          <p className="text-[11px] font-semibold text-muted-foreground">검색 결과</p>
        </div>

        {searchResults.map(c => {
          const selected = clientId === c.clie_idno;

          return (
            <button
              key={c.clie_idno}
              type="button"
              onMouseDown={e => {
                e.preventDefault();
                handleSelect(c);
              }}
              className="
                flex w-full items-center gap-2 rounded-xl px-3 py-2.5
                text-left text-sm transition-colors hover:bg-muted/60
              "
            >
              {selected ? <Check size={14} className="shrink-0 text-primary" /> : <Building2 size={14} className="shrink-0 text-muted-foreground/70" />}

              <span className="truncate text-foreground">{c.clie_name}</span>
            </button>
          );
        })}

        {/* 새 거래처 추가 액션 */}
        {showCreateAction && (
          <>
            <div className="my-1 border-t border-border/60" />

            <div className="px-2 pb-1 pt-1">
              <p className="text-[11px] font-semibold text-muted-foreground">직접 추가</p>
            </div>

            <button
              type="button"
              onMouseDown={e => {
                e.preventDefault();
                handleCreateDirect();
              }}
              disabled={createMutation.isPending}
              className="
                flex w-full items-center gap-2 rounded-xl px-3 py-2.5
                text-left text-sm font-medium text-foreground
                transition-colors hover:bg-muted/60
                disabled:opacity-60
              "
            >
              {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} className="shrink-0 text-muted-foreground" />}

              <span className="truncate">
                '<span className="font-semibold">{trimmedValue}</span>' 새 거래처 추가
              </span>
            </button>
          </>
        )}
      </div>
    );
  };
  // #endregion

  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      <div ref={containerRef} className="relative">
        {/* #region Input */}
        <div className="relative">
          <Input
            value={value}
            placeholder={placeholder}
            aria-invalid={!!error}
            onChange={e => handleInputChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn("pr-8", className)}
          />

          {statusIcon}
        </div>
        {/* #endregion */}

        {/* #region Dropdown */}
        {open && (
          <div className={cn("absolute z-15 mt-2 w-full overflow-hidden", "max-h-72 overflow-y-auto", "rounded-2xl border border-border/70 bg-popover", "shadow-[0_18px_50px_rgba(15,23,42,0.10)]")}>
            {searchResults.length === 0 ? renderEmptyState() : renderSearchResults()}
          </div>
        )}
        {/* #endregion */}

        {/* #region Selected Client Summary */}
        {clientId && !open && clientPreview && (
          <div
            className="
    mt-3 overflow-hidden rounded-2xl
    border border-border/50 bg-white
    shadow-[0_1px_2px_rgba(15,23,42,0.03)]
  "
          >
            {/* 요약 바 */}
            <button
              type="button"
              onClick={() => setPreviewExpanded(v => !v)}
              className="
    group flex w-full items-start justify-between gap-3
    px-4 py-3 text-left
    transition-colors hover:bg-muted/20
  "
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/8 text-primary">
                    <History size={14} />
                  </div>

                  <p className="text-[13px] font-semibold text-foreground">최근 거래 이력</p>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {clientPreview.main_contact?.cont_name && (
                    <span
                      className="
            inline-flex items-center gap-1 rounded-full
            bg-muted/55 px-2.5 py-1
            text-[11px] font-medium text-muted-foreground
          "
                    >
                      <User2 size={11} />
                      {clientPreview.main_contact.cont_name}
                      {clientPreview.main_contact.cont_role ? ` · ${clientPreview.main_contact.cont_role}` : ""}
                    </span>
                  )}

                  <span
                    className="
          inline-flex items-center gap-1 rounded-full
          bg-muted/55 px-2.5 py-1
          text-[11px] font-medium text-muted-foreground
        "
                  >
                    <CalendarDays size={11} />
                    최근 방문 {formatDate(clientPreview.last_vist_date)}
                  </span>

                  <span
                    className="
          inline-flex items-center gap-1 rounded-full
          bg-primary/8 px-2.5 py-1
          text-[11px] font-semibold text-primary
        "
                  >
                    <Clock3 size={11} />
                    예정 일정 {clientPreview.open_schedule_count}건
                  </span>
                </div>
              </div>

              <div
                className="
      mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center
      rounded-full text-muted-foreground
      transition-colors group-hover:bg-muted/60
    "
              >
                <ChevronDown size={14} className={cn("transition-transform", previewExpanded && "rotate-180")} />
              </div>
            </button>

            {/* 상세 펼침 */}
            {previewExpanded && (
              <div className="border-t border-border/40 bg-muted/15 px-4 py-3">
                {isPreviewFetching ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 size={12} className="animate-spin" />
                    불러오는 중…
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clientPreview.recent_sales?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold tracking-tight text-muted-foreground">최근 영업일지</p>

                        <ul className="mt-2 space-y-2">
                          {clientPreview.recent_sales.slice(0, 2).map(s => (
                            <li
                              key={s.sale_idno}
                              className="
                    rounded-2xl bg-background px-3 py-3
                    shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]
                  "
                            >
                              <p className="text-[11px] font-medium text-muted-foreground">{formatDate(s.vist_date)}</p>

                              <p className="mt-1 line-clamp-3 text-[13px] leading-5 text-foreground/88">{s.aiex_summ || s.orig_memo || "내용 없음"}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {clientPreview.upcoming_schedules?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold tracking-tight text-muted-foreground">예정 일정</p>

                        <ul className="mt-2 space-y-2">
                          {clientPreview.upcoming_schedules.slice(0, 3).map(s => (
                            <li
                              key={s.sche_idno}
                              className="
                    rounded-2xl bg-background px-3 py-3
                    shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]
                  "
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-[13px] font-semibold text-foreground">{s.sche_name}</p>
                                  <p className="mt-1 text-[11px] text-muted-foreground">{formatDateTime(s.sche_date)}</p>
                                </div>

                                <span
                                  className="
                        shrink-0 rounded-full bg-primary/8
                        px-2 py-1 text-[10px] font-semibold text-primary
                      "
                                >
                                  예정
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {!clientPreview.recent_sales?.length && !clientPreview.upcoming_schedules?.length && (
                      <div className="rounded-2xl bg-background px-3 py-3 text-xs text-muted-foreground shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]">표시할 최근 이력이 없습니다.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* #endregion */}

        {/* #region Suggestion */}
        {suggestion && !clientId && (
          <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-snug text-amber-900">
                혹시 <span className="font-semibold">'{suggestion.client.clie_name}'</span>
                을(를) 말씀하시는 건가요?
              </p>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleConfirmSuggestion}
                  className="
                    inline-flex h-7 items-center rounded-lg
                    bg-foreground px-2.5 text-xs font-medium text-background
                    transition-opacity hover:opacity-90
                  "
                >
                  선택
                </button>

                <button
                  type="button"
                  onClick={handleRejectSuggestion}
                  disabled={createMutation.isPending}
                  className="
                    inline-flex h-7 items-center rounded-lg
                    border border-amber-300 bg-white px-2.5
                    text-xs font-medium text-amber-900
                    transition-colors hover:bg-amber-100
                    disabled:opacity-60
                  "
                >
                  {createMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : "새로 추가"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* #endregion */}
      </div>
    </Field>
  );
}
// #endregion
