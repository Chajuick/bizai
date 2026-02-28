import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";


type Client = { clie_idno: number; clie_name: string };
type Suggestion = { client: Client; confidence: number };

type Props = {
  value: string;
  clientId?: number;
  onChange: (name: string, clientId?: number) => void;
  placeholder?: string;
  className?: string;
};

export default function ClientNameInput({
  value,
  clientId,
  onChange,
  placeholder = "(주)거래처명",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [debounced, setDebounced] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const utils = trpc.useUtils();
  const createMutation = trpc.crm.client.create.useMutation();

  // 서버 검색 (debounced)
  const { data: searchResultsData, isFetching } = trpc.crm.client.list.useQuery(
    { search: debounced || undefined, limit: debounced ? 50 : 20 },
    { enabled: open, staleTime: 10_000 }
  );
  const searchResults = searchResultsData?.items ?? [];

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

  const handleInputChange = (val: string) => {
    onChange(val, undefined);
    setSuggestion(null);
    setOpen(true);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebounced(val), 300);
  };

  const handleBlur = useCallback(() => {
    setTimeout(async () => {
      setOpen(false);
      if (clientId || !value.trim()) return;
      try {
        const match = await utils.crm.client.findBestMatch.fetch({ name: value });
        if (!match) return;
        // 입력값과 DB 이름이 완전히 같을 때만 자동 적용, 나머지는 항상 제안
        if (match.clie_name.toLowerCase() === value.toLowerCase()) {
          onChange(match.clie_name, match.clie_idno);
        } else {
          setSuggestion({ client: { clie_idno: match.clie_idno, clie_name: match.clie_name }, confidence: match.confidence });
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
      await utils.crm.client.list.invalidate();
      onChange(value, (result as any).clie_idno);
      toast.success(`'${value}' 고객사가 추가되었습니다.`);
    } catch {
      toast.error("고객사 추가에 실패했습니다.");
    }
    setSuggestion(null);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* 입력 필드 */}
      <div className="relative">
        <input
          type="text"
          value={value}
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
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-8 text-sm rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 ${className}`}
        />
        {isFetching ? (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
        ) : (
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        )}
      </div>

      {/* 드롭다운 */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-2xl shadow-[0_12px_32px_rgba(15,23,42,0.10)] overflow-hidden max-h-52 overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-slate-400">
              {isFetching ? "검색 중…" : value ? "일치하는 고객사 없음" : "등록된 고객사 없음"}
            </div>
          ) : (
            searchResults.map((c) => (
              <button
                key={c.clie_idno}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(c);
                }}
                className="w-full px-3 py-2.5 text-left text-sm text-slate-900 hover:bg-slate-50 flex items-center gap-2 transition"
              >
                {clientId === c.clie_idno ? (
                  <Check size={12} className="text-blue-600 shrink-0" />
                ) : (
                  <span className="w-3 shrink-0" />
                )}
                <span className="truncate">{c.clie_name}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* 유사 고객사 제안 */}
      {suggestion && (
        <div className="mt-2 px-3 py-2.5 rounded-2xl border border-amber-200 bg-amber-50">
          <p className="text-xs text-amber-800 font-semibold leading-snug">
            혹시{" "}
            <span className="font-black">'{suggestion.client.clie_name}'</span>
            을(를) 말씀하시는 건가요?
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition"
            >
              맞아요
            </button>
            <button
              type="button"
              onClick={handleDeny}
              disabled={createMutation.isPending}
              className="px-3 py-1 rounded-xl text-xs font-bold border border-amber-300 text-amber-700 hover:bg-amber-100 transition flex items-center gap-1"
            >
              {createMutation.isPending && <Loader2 size={10} className="animate-spin" />}
              아니에요, 새로 추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
