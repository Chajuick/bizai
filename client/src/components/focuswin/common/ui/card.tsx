import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ✅ 기본 Card = 기존 FwCard 룩
 * - rounded-3xl
 * - border-slate-100
 * - white surface
 * - soft shadow
 * - p-4
 *
 * Header / Content / Footer 는 "선택 사항"이며
 * 기본적으로 Card가 padding을 들고 있기 때문에
 * 내부 slot들은 padding을 강제하지 않음.
 */

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-3xl border border-slate-100 bg-white",
        "shadow-[0_12px_32px_rgba(15,23,42,0.05)]",
        "p-4",
        "flex flex-col gap-4",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex items-start justify-between gap-3",
        // 필요 시: className에 "border-b pb-3" 같은 거 붙여서 구분선
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-base font-bold text-slate-900 leading-tight", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-slate-500", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("shrink-0 self-start", className)}
      {...props}
    />
  );
}

/**
 * CardContent: 기본 padding 없음 (Card가 p-4를 이미 가짐)
 * 기존 코드에서 CardContent에 "pt-6" 같은 거 쓰던 건 그대로 사용 가능
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("min-w-0", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center justify-between gap-3",
        // 필요 시: className에 "border-t pt-3" 같은 거 붙여서 구분선
        className
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};