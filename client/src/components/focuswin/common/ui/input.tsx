// src/components/focuswin/form/input.tsx
// (경로는 예시) — 기존 Input을 “토스 Underline” 스타일로 리디자인
//
// 핵심 스타일 컨셉
// - 테두리(상/좌/우) 없음, 하단 underline만 사용
// - hover: underline이 살짝 진해짐
// - focus: underline이 포인트 컬러(primary) + 두께 증가
// - ring/glow 없음 (토스 느낌)
// - 배경은 거의 투명/밝은 톤 (페이지 배경을 살림)
//
// IME(한글 조합) Enter 오동작 방지 로직은 그대로 유지

import { useDialogComposition } from "@/components/ui/dialog";
import { useComposition } from "@/hooks/useComposition";
import { cn } from "@/lib/utils";
import * as React from "react";

// #region Types
type InputProps = React.ComponentProps<"input">;
// #endregion

// #region Component
function Input({
  className,
  type,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  ...props
}: InputProps) {
  // 다이얼로그 내부에서 IME 조합 이벤트가 꼬이는 케이스 대응용
  const dialogComposition = useDialogComposition();

  // IME(한글/일본어/중국어) 조합 중 Enter 처리 꼬임 방지
  const {
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    onKeyDown: handleKeyDown,
  } = useComposition<HTMLInputElement>({
    onKeyDown: e => {
      // nativeEvent.isComposing: 브라우저 IME 조합 중 여부
      // dialogComposition.justEndedComposing(): 조합 종료 직후 Enter가 튀는 케이스 방지
      const isComposing =
        (e.nativeEvent as any).isComposing || dialogComposition.justEndedComposing();

      // 조합 중 Enter는 “확정” 용도로 쓰이기 때문에
      // 여기서 onKeyDown을 흘려보내면 form submit / search 등이 오동작할 수 있음
      if (e.key === "Enter" && isComposing) return;

      onKeyDown?.(e);
    },

    onCompositionStart: e => {
      // 다이얼로그 컨텍스트에 “조합 시작”을 기록
      dialogComposition.setComposing(true);
      onCompositionStart?.(e);
    },

    onCompositionEnd: e => {
      // “조합 종료” 순간을 표시 (직후 Enter 튐 방지에 사용)
      dialogComposition.markCompositionEnd();

      // 일부 환경에서 compositionend 직후 isComposing false 전환 타이밍이 늦어서
      // 짧게 버퍼를 둠
      setTimeout(() => dialogComposition.setComposing(false), 100);

      onCompositionEnd?.(e);
    },
  });

  return (
    <input
      // type은 기본 props로도 들어올 수 있으니 명시 유지
      type={type}
      data-slot="input"
      className={cn(
        [
          // #region Layout
          // 토스 느낌: 좌우 padding 과하지 않게 (필요하면 px-1~2로 조절)
          "h-11 w-full min-w-0 px-0",
          // #endregion

          // #region Surface
          // 배경을 거의 살리고(투명 느낌), 밑줄만 존재
          "bg-transparent",
          // 상/좌/우 테두리 제거 + 하단 underline만 사용
          "border-0 border-b",
          // 기본 underline 컬러 (연한 회색)
          "border-border/70",
          // #endregion

          // #region Text
          "text-sm text-foreground",
          "placeholder:text-muted-foreground/60",
          // #endregion

          // #region Hover
          // hover 시 underline이 살짝 진해지는 정도
          "hover:border-foreground/30",
          // #endregion

          // #region Focus
          // 토스: ring 없이 underline만 포인트
          "outline-none",
          // focus 시 밑줄 두께 + primary 컬러
          "focus:border-b-2 focus:border-primary",
          // focus 시 살짝만 텍스트 선명해지는 느낌(선택)
          "focus:placeholder:text-muted-foreground/50",
          // #endregion

          // #region Motion
          // underline 두께 변경까지 자연스럽게
          "transition-[border-color,border-width] duration-150 ease-out",
          // #endregion

          // #region Selection
          "selection:bg-primary selection:text-primary-foreground",
          // #endregion

          // #region Disabled
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          // #endregion

          // #region Invalid
          // invalid는 underline을 destructive로
          "aria-invalid:border-destructive",
          // focus+invalid일 때도 destructive 유지(원하면 primary 대신 destructive로 고정)
          "aria-invalid:focus:border-destructive",
          // #endregion
        ].join(" "),
        className
      )}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}
// #endregion

export { Input };