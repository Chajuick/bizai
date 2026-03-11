// components/focuswin/page/sale/form/client-name-field.tsx
//
// 거래처명 입력 + 자동완성 드롭다운 + 유사 거래처 제안(확정/추가)
//
// ✅ 토스 Underline 스타일 반영 포인트
// - Input: underline 기반(이미 Input 컴포넌트가 토스 스타일이면 className 최소만 추가)
// - 드롭다운: 하얀 카드 + 둥근 모서리 + 은은한 shadow + 아이템 하이라이트는 muted 톤
// - 아이콘/색: 과한 파랑 대신 muted, 선택 표시만 primary 사용
//
// ✅ IME(한글 조합) 관련
// - Input 컴포넌트 내부에서 이미 Enter/조합 처리를 하므로 여기서는 건드리지 않음
//
// ✅ UX 안정성
// - onBlur 시 setTimeout(150ms)으로 드롭다운 클릭 선택이 먼저 먹도록 유지
// - onMouseDown preventDefault로 blur보다 선택이 우선되도록 유지

import React, { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/handleApiError";

import { cn } from "@/lib/utils";
import { Input } from "@/components/focuswin/common/ui/input";
import { Field } from "@/components/focuswin/common/form/field";

// #region Types
type Client = { clie_idno: number; clie_name: string };
type Suggestion = { client: Client; confidence: number };

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

  // 바깥 클릭 감지(드롭다운 닫기)
  const containerRef = useRef<HTMLDivElement>(null);

  // debounce timer 관리
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // #endregion

  // #region TRPC
  const utils = trpc.useUtils();
  const createMutation = trpc.crm.client.create.useMutation();

  // 서버 검색 (debounced)
  const { data: searchResultsData, isFetching } = trpc.crm.client.list.useQuery(
    { search: debounced || undefined, limit: debounced ? 50 : 20 },
    { enabled: open, staleTime: 10_000 }
  );
  const searchResults = searchResultsData?.items ?? [];
  // #endregion

  // #region Effects
  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  // #endregion

  // #region Handlers
  const handleInputChange = (val: string) => {
    // 타이핑 시작 → 기존 clientId는 무효 (새로운 이름 입력)
    onChange(val, undefined);

    // 유사 제안은 입력 중에는 제거
    setSuggestion(null);

    // 입력 중에는 드롭다운을 열어 자동완성 목록을 노출
    setOpen(true);

    // debounce로 서버 검색량 줄이기
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebounced(val), debounceMs);
  };

  const handleBlur = useCallback(() => {
    // blur 직후 바로 닫으면 드롭다운 클릭이 씹힐 수 있어 약간 늦춤
    setTimeout(async () => {
      setOpen(false);

      // 이미 clientId가 확정되어 있거나, 공백이면 매칭 시도 불필요
      if (clientId || !value.trim()) return;

      try {
        const match = await utils.crm.client.findBestMatch.fetch({ name: value });
        if (!match) return;

        // 입력값과 DB 이름이 완전히 같을 때만 자동 적용, 나머지는 “제안”으로 처리
        if (match.clie_name.toLowerCase() === value.toLowerCase()) {
          onChange(match.clie_name, match.clie_idno);
        } else {
          setSuggestion({
            client: { clie_idno: match.clie_idno, clie_name: match.clie_name },
            confidence: match.confidence,
          });
        }
      } catch {
        // 매칭 실패 시 무시
      }
    }, 150);
  }, [clientId, value, utils, onChange]);

  const handleSelect = (client: Client) => {
    onChange(client.clie_name, client.clie_idno);
    setSuggestion(null);
    setOpen(false);
  };

  const handleConfirm = () => {
    if (!suggestion) return;
    onChange(suggestion.client.clie_name, suggestion.client.clie_idno);
    setSuggestion(null);
  };

  const handleDeny = async () => {
    try {
      const result = await createMutation.mutateAsync({ clie_name: value });

      // 목록 캐시 갱신
      await utils.crm.client.list.invalidate();

      // 생성된 거래처 id 반영
      onChange(value, (result as any).clie_idno);

      toast.success(`'${value}' 거래처가 추가되었습니다.`);
    } catch (e) {
      handleApiError(e);
    } finally {
      setSuggestion(null);
    }
  };
  // #endregion

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <div ref={containerRef} className="relative">
        {/* #region Input */}
        <div className="relative">
          <Input
            value={value}
            placeholder={placeholder}
            aria-invalid={!!error}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              // clientId가 이미 설정된 상태(수정 모달 등)에서는 포커스만으로 드롭다운을 열지 않음
              // 사용자가 직접 타이핑할 때(handleInputChange)만 열림
              if (!clientId) {
                setOpen(true);
                setDebounced(value);
              }
            }}
            onBlur={handleBlur}
            className={cn(
              [
                // 토스 underline Input이면 radius/배경은 굳이 안 건드림
                // 우측 아이콘 영역만 확보
                "pr-8",
              ].join(" "),
              className
            )}
          />

          {/* 우측 상태 아이콘 (검색 중/드롭다운 표시) */}
          {isFetching ? (
            <Loader2
              size={14}
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2",
                "text-muted-foreground/70 animate-spin"
              )}
            />
          ) : (
            <ChevronDown
              size={14}
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2",
                "text-muted-foreground/70 pointer-events-none"
              )}
            />
          )}
        </div>
        {/* #endregion */}

        {/* #region Dropdown */}
        {open && (
          <div
            className={cn(
              [
                // position
                "absolute z-50 w-full mt-2 overflow-hidden",
                // surface (토스식: 깔끔한 카드)
                "bg-popover border border-border/70 rounded-2xl",
                "shadow-[0_18px_50px_rgba(15,23,42,0.10)]",
                // scroll
                "max-h-56 overflow-y-auto",
              ].join(" ")
            )}
          >
            {searchResults.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-muted-foreground/80">
                {isFetching
                  ? "검색 중…"
                  : value
                  ? "일치하는 거래처 없음"
                  : "등록된 거래처 없음"}
              </div>
            ) : (
              <div className="p-1.5">
                {searchResults.map((c) => {
                  const selected = clientId === c.clie_idno;

                  return (
                    <button
                      key={c.clie_idno}
                      type="button"
                      onMouseDown={(e) => {
                        // blur보다 먼저 선택되도록
                        e.preventDefault();
                        handleSelect(c);
                      }}
                      className={cn(
                        [
                          "w-full text-left",
                          "flex items-center gap-2",
                          "rounded-xl px-3 py-2.5",
                          "text-sm",
                          // 토스식 하이라이트: muted 계열로 은은하게
                          "hover:bg-muted/60 transition-colors",
                          // 접근성/키보드 대응(버튼이므로 기본 포커스 스타일 최소화)
                          "outline-none focus-visible:bg-muted/70",
                        ].join(" ")
                      )}
                    >
                      {/* 선택 표시 */}
                      {selected ? (
                        <Check size={14} className="text-primary shrink-0" />
                      ) : (
                        <span className="w-[14px] shrink-0" />
                      )}

                      <span className="truncate text-foreground">{c.clie_name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* #endregion */}

        {/* #region Suggestion */}
        {suggestion && (
          <div
            className={cn(
              "mt-3 rounded-2xl",
              "border border-border/70 bg-muted/40",
              "px-3 py-2.5"
            )}
          >
            <p className="text-xs text-foreground/80 font-semibold leading-snug">
              혹시{" "}
              <span className="font-black text-foreground">
                '{suggestion.client.clie_name}'
              </span>
              을(를) 말씀하시는 건가요?
              {/* confidence를 노출하고 싶으면 아래 주석 해제 */}
              {/* <span className="ml-2 text-[11px] text-muted-foreground/80">
                (유사도 {Math.round(suggestion.confidence * 100)}%)
              </span> */}
            </p>

            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                className={cn(
                  [
                    "h-8 px-3 rounded-xl",
                    "text-xs font-bold",
                    // 토스식 primary 버튼: 과한 그림자 없이 색으로만
                    "bg-primary text-primary-foreground",
                    "hover:opacity-90 transition-opacity",
                  ].join(" ")
                )}
              >
                맞아요
              </button>

              <button
                type="button"
                onClick={handleDeny}
                disabled={createMutation.isPending}
                className={cn(
                  [
                    "h-8 px-3 rounded-xl",
                    "text-xs font-bold",
                    // 아웃라인 버튼: 은은한 border + hover muted
                    "border border-border/70 bg-transparent text-foreground/80",
                    "hover:bg-muted/60 transition-colors",
                    "inline-flex items-center gap-1.5",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                  ].join(" ")
                )}
              >
                {createMutation.isPending && (
                  <Loader2 size={12} className="animate-spin" />
                )}
                아니에요, 새로 추가
              </button>
            </div>
          </div>
        )}
        {/* #endregion */}
      </div>
    </Field>
  );
}
// #endregion