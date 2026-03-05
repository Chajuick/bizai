// client/src/components/focuswin/common/paginated-list.tsx

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

// #region Types

export type PaginatedListProps<T> = {
  // ─── 필수 ──────────────────────────────────────────────────────────────

  /** 렌더링할 아이템 배열 */
  items: T[];
  /**
   * 아이템 렌더 함수.
   * React key는 반환 엘리먼트에 직접 설정해야 한다.
   * @example renderItem={(p) => <Card key={p.id} data={p} />}
   */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** 다음 페이지 존재 여부 */
  hasMore: boolean;
  /** 추가 페이지 로딩 중 여부 */
  isLoadingMore: boolean;
  /** 다음 페이지 요청 콜백 */
  onLoadMore: () => void;

  // ─── Pagination mode ───────────────────────────────────────────────────

  /**
   * "button" : 더 보기 버튼 클릭 → loadMore (기본, 업무툴 권장)
   * "auto"   : sentinel 도달 → IntersectionObserver → loadMore
   * @default "button"
   */
  mode?: "button" | "auto";

  /**
   * auto mode: sentinel 미리 감지 거리
   * @default "200px"
   */
  rootMargin?: string;
  /** auto mode: 교차 비율 임계값 @default 0 */
  threshold?: number;

  /**
   * auto mode 에서도 더 보기 버튼을 fallback으로 함께 표시.
   * 업무툴 / 키보드 접근성 보조 용도.
   * @default false
   */
  showFallbackButton?: boolean;

  // ─── 슬롯 ─────────────────────────────────────────────────────────────

  /**
   * items가 비어 있을 때 표시.
   * PageScaffold 없이 standalone 사용 시에만 필요.
   * PageScaffold와 함께 쓸 때는 PageScaffold의 empty prop으로 처리.
   */
  emptySlot?: React.ReactNode;
  /**
   * isLoadingMore 일 때 커스텀 로딩 표시.
   * 미제공 시 기본 스피너 사용.
   */
  loadingMoreSlot?: React.ReactNode;
  /** load-more 영역 아래에 추가할 콘텐츠 */
  footerSlot?: React.ReactNode;

  // ─── 옵션 ─────────────────────────────────────────────────────────────

  /** 더 보기 버튼 텍스트 @default "더 보기" */
  loadMoreLabel?: string;
  /** 아이템 컨테이너 className */
  className?: string;
};

// #endregion

// #region Component

/**
 * 공용 페이지네이션 리스트 컨테이너
 *
 * - mode="button" : 더 보기 버튼 (기본값, 업무툴 권장)
 * - mode="auto"   : IntersectionObserver 자동 스크롤
 * - PageScaffold와 함께 사용 시 initial loading/empty는 PageScaffold가 담당
 *
 * @example
 * // button mode (Schedule)
 * <PaginatedList
 *   items={vm.displayList}
 *   renderItem={(p) => <ScheduleListCard key={p.sche_idno} p={p} ... />}
 *   hasMore={vm.hasMore}
 *   isLoadingMore={vm.isLoadingMore}
 *   onLoadMore={vm.loadMore}
 * />
 *
 * @example
 * // auto mode (피드형 리스트)
 * <PaginatedList
 *   items={vm.items}
 *   renderItem={(item) => <FeedCard key={item.id} data={item} />}
 *   hasMore={vm.hasMore}
 *   isLoadingMore={vm.isLoadingMore}
 *   onLoadMore={vm.loadMore}
 *   mode="auto"
 *   showFallbackButton    // 접근성 fallback
 * />
 */
export function PaginatedList<T>({
  items,
  renderItem,
  hasMore,
  isLoadingMore,
  onLoadMore,
  mode = "button",
  rootMargin,
  threshold,
  showFallbackButton = false,
  emptySlot,
  loadingMoreSlot,
  footerSlot,
  loadMoreLabel = "더 보기",
  className,
}: PaginatedListProps<T>) {
  // #region IntersectionObserver (auto mode only)

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoadingMore,
    rootMargin,
    threshold,
    enabled: mode === "auto",
  });

  // #endregion

  // #region Derived flags

  // 버튼 표시 조건:
  //   button mode: hasMore && !isLoadingMore
  //   auto mode  : showFallbackButton && hasMore && !isLoadingMore
  const showButton =
    hasMore && !isLoadingMore && (mode === "button" || showFallbackButton);

  // #endregion

  // #region Render

  // standalone 빈 상태 (PageScaffold 없이 쓸 때)
  if (items.length === 0 && emptySlot) {
    return <>{emptySlot}</>;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* ─── 아이템 목록 ─── */}
      {items.map((item, index) => renderItem(item, index))}

      {/* ─── auto mode sentinel (invisible trigger) ─── */}
      {mode === "auto" && (
        <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      )}

      {/* ─── 추가 로딩 스피너 ─── */}
      {isLoadingMore &&
        (loadingMoreSlot ?? (
          <div
            role="status"
            aria-live="polite"
            aria-label="추가 항목을 불러오는 중입니다"
            className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            불러오는 중...
          </div>
        ))}

      {/* ─── 더 보기 버튼 ─── */}
      {showButton && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            aria-disabled={isLoadingMore}
            className={cn(
              "w-full rounded-xl px-4 py-3",
              "border border-white/10 bg-white/5",
              "text-sm font-medium text-foreground",
              "transition hover:bg-white/10",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {loadMoreLabel}
          </button>
        </div>
      )}

      {/* ─── 커스텀 footer 슬롯 ─── */}
      {footerSlot}
    </div>
  );

  // #endregion
}

// #endregion
