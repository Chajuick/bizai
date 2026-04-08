// src/components/focuswin/form/select.tsx
//
// 토스 Underline 스타일 Select (Radix Select 기반)
//
// 스타일 컨셉 (Input과 통일)
// - Trigger: 상/좌/우 border 없음 + 하단 underline만
// - hover: underline 살짝 진해짐
// - focus/open: underline 포인트 컬러(primary) + 두께 증가
// - ring/glow 없음 (토스 느낌)
// - Content: 둥근 모서리 + 깔끔한 shadow, 아이템은 soft highlight
//
// NOTE
// - Trigger는 Radix 상태값 data-[state=open]를 활용해 “열림 상태”도 focus처럼 처리
// - placeholder 색은 data-[placeholder]로 처리 (Radix 관례 유지)

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// #region Root wrappers
function Select(props: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup(props: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue(props: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}
// #endregion

// #region Trigger
function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        [
          // #region Layout
          "flex w-fit min-w-0 items-center justify-between gap-2 whitespace-nowrap",
          // sizing (match Input underline 느낌)
          "data-[size=default]:h-11 data-[size=sm]:h-9",
          // 토스: 좌우 padding 과하지 않게. (필요하면 px-1~2로 조절)
          "px-0",
          // #endregion

          // #region Surface (Underline only)
          "bg-transparent",
          "border-0 border-b",
          "border-border/70",
          // hover underline
          "hover:border-foreground/30",
          // #endregion

          // #region Text
          "text-sm font-semibold text-foreground",
          "data-[placeholder]:text-muted-foreground/60",
          // value clamping
          "*:data-[slot=select-value]:line-clamp-1",
          "*:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2",
          // #endregion

          // #region Icons
          "[&_svg]:pointer-events-none [&_svg]:shrink-0",
          "[&_svg:not([class*='size-'])]:size-4",
          "[&_svg:not([class*='text-'])]:text-muted-foreground/70",
          // #endregion

          // #region Focus/Open
          // 토스: ring 없이 underline만 포인트
          "outline-none",
          // focus 상태
          "focus:border-b-1 focus:border-primary",
          // open 상태도 focus처럼
          "data-[state=open]:border-b-1 data-[state=open]:border-primary",
          // #endregion

          // #region Motion
          "transition-[border-color,border-width] duration-150 ease-out",
          // #endregion

          // #region Disabled
          "disabled:cursor-not-allowed disabled:opacity-50",
          // #endregion

          // #region Invalid
          // (필요시 aria-invalid를 Trigger에 붙여서 제어)
          "aria-invalid:border-destructive",
          "aria-invalid:focus:border-destructive",
          "aria-invalid:data-[state=open]:border-destructive",
          // #endregion
        ].join(" "),
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        {/* 토스 느낌: 아이콘은 존재감 낮게 */}
        <ChevronDownIcon className="size-4 opacity-60" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}
// #endregion

// #region Content
function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        align={align}
        className={cn(
          [
            // #region Surface
            "z-[200] overflow-hidden",
            "min-w-[8rem] max-h-(--radix-select-content-available-height)",
            "rounded-2xl border border-border/70",
            "bg-popover text-popover-foreground",
            // 토스 느낌: 그림자는 과하지 않게, 살짝 넓게
            "shadow-[0_18px_50px_rgba(15,23,42,0.10)]",
            // #endregion

            // #region Motion
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            // #endregion
          ].join(" "),
          position === "popper" &&
            "data-[side=bottom]:translate-y-2 data-[side=top]:-translate-y-2 data-[side=left]:-translate-x-2 data-[side=right]:translate-x-2",
          className
        )}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            // 토스: 내부 padding 살짝만
            "p-1.5",
            position === "popper" &&
              "w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}
// #endregion

// #region Label / Item / Separator / Scroll buttons
function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        // 토스: 라벨은 작고 차분하게
        "px-3 py-2 text-xs font-semibold text-muted-foreground/80",
        className
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        [
          // #region Layout
          "relative flex w-full select-none items-center gap-2",
          "rounded-xl px-3 py-2 text-sm",
          // 체크 아이콘 영역 확보
          "pr-9",
          // #endregion

          // #region Text
          "text-foreground",
          // #endregion

          // #region Hover/Highlight
          // 토스: 강조는 강한 accent보다 '은은한 배경' 느낌
          "outline-none",
          "data-[highlighted]:bg-muted/60 data-[highlighted]:text-foreground",
          // #endregion

          // #region Disabled
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          // #endregion

          // #region Icons
          "[&_svg]:pointer-events-none [&_svg]:shrink-0",
          "[&_svg:not([class*='size-'])]:size-4",
          "[&_svg:not([class*='text-'])]:text-muted-foreground/70",
          "*:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
          // #endregion
        ].join(" "),
        className
      )}
      {...props}
    >
      {/* 체크 아이콘 (선택됨 표시) */}
      <span className="absolute right-3 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        // 토스: 구분선은 아주 연하게
        "pointer-events-none -mx-1 my-1 h-px bg-border/50",
        className
      )}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-muted-foreground/80",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-muted-foreground/80",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}
// #endregion

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};