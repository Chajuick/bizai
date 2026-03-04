// client/src/hooks/useInfiniteScroll.ts

import { useEffect, useRef } from "react";

// #region Types

type Options = {
  /** 다음 페이지 로드 콜백 */
  onLoadMore: () => void;
  /** 더 가져올 데이터가 있는지 */
  hasMore: boolean;
  /** 현재 추가 로딩 중 여부 (중복 호출 방지) */
  isLoadingMore: boolean;
  /**
   * sentinel이 화면에 들어오기 전 미리 감지할 거리
   * @default "200px"
   */
  rootMargin?: string;
  /** 교차 비율 임계값 @default 0 */
  threshold?: number;
  /**
   * hook 활성화 여부.
   * mode="button"일 때 false로 전달해 observer를 아예 생성하지 않는다.
   * @default true
   */
  enabled?: boolean;
};

// #endregion

// #region Hook

/**
 * IntersectionObserver 기반 무한 스크롤 훅
 *
 * - sentinelRef를 리스트 끝에 달면 viewport 진입 시 onLoadMore 호출
 * - isLoadingMore=true 일 때는 observer를 만들지 않아 중복 호출 방지
 * - enabled=false 이면 완전 비활성 (button mode에서 불필요한 observer 차단)
 * - cleanup은 의존성 변경 / unmount 시 자동으로 observer.disconnect()
 *
 * ✅ 보완 포인트
 * - "연속 호출(폭주)" 방지: sentinel이 계속 intersect 상태일 때 1회만 호출
 *   (다음 호출은 isLoadingMore 전환 후 다시 관찰될 때 허용)
 * - callbackRef로 최신 onLoadMore 참조 유지 (의존성 폭발 방지)
 *
 * @example
 * const { sentinelRef } = useInfiniteScroll({
 *   onLoadMore: vm.loadMore,
 *   hasMore: vm.hasMore,
 *   isLoadingMore: vm.isLoadingMore,
 *   enabled: mode === "auto",
 * });
 * // 리스트 하단에 <div ref={sentinelRef} aria-hidden="true" />
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoadingMore,
  rootMargin = "200px",
  threshold = 0,
  enabled = true,
}: Options) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // callback ref: effect 의존성 변경 없이 항상 최신 콜백 참조
  const callbackRef = useRef(onLoadMore);
  useEffect(() => {
    callbackRef.current = onLoadMore;
  });

  /**
   * sentinel이 viewport 안에 "계속" 머무는 상황에서
   * 로딩이 빠르게 끝나면 연속 호출이 발생할 수 있어 1회 가드를 둔다.
   * - 로딩 가능한 상태(enabled/hasMore/isLoadingMore=false)로 전환될 때마다 1회 호출 허용
   */
  const firedRef = useRef(false);

  useEffect(() => {
    // 비활성 · 더 없음 · 로딩 중 → observer 생성하지 않음
    if (!enabled || !hasMore || isLoadingMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // ✅ 이 관찰 사이클에서는 1회만 호출 허용
    firedRef.current = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        // ✅ 폭주 방지: 같은 관찰 사이클에서 중복 호출 차단
        if (firedRef.current) return;
        firedRef.current = true;

        callbackRef.current();
      },
      { rootMargin, threshold },
    );

    observer.observe(sentinel);

    // cleanup: isLoadingMore 전환·탭 변경·unmount 시 자동 해제
    return () => observer.disconnect();
  }, [enabled, hasMore, isLoadingMore, rootMargin, threshold]);

  return { sentinelRef };
}

// #endregion