import { useDialogComposition } from "@/components/ui/dialog";
import { useComposition } from "@/hooks/useComposition";
import { cn } from "@/lib/utils";
import * as React from "react";

function Input({
  className,
  type,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  ...props
}: React.ComponentProps<"input">) {
  const dialogComposition = useDialogComposition();

  const {
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    onKeyDown: handleKeyDown,
  } = useComposition<HTMLInputElement>({
    onKeyDown: (e) => {
      const isComposing =
        (e.nativeEvent as any).isComposing || dialogComposition.justEndedComposing();

      if (e.key === "Enter" && isComposing) return;
      onKeyDown?.(e);
    },
    onCompositionStart: (e) => {
      dialogComposition.setComposing(true);
      onCompositionStart?.(e);
    },
    onCompositionEnd: (e) => {
      dialogComposition.markCompositionEnd();
      setTimeout(() => dialogComposition.setComposing(false), 100);
      onCompositionEnd?.(e);
    },
  });

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        [
          // size / layout
          "h-11 w-full min-w-0 px-4",
          // shape
          "rounded-xl",
          // surface (fowin-like)
          "bg-background border border-border",
          // text
          "text-sm text-foreground placeholder:text-muted-foreground",
          // file input
          "file:inline-flex file:h-9 file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground",
          // motion
          "transition-[border-color,box-shadow,background-color] duration-150 ease-out",
          // focus
          "outline-none focus-visible:border-primary/30 focus-visible:border-primary/40 focus-visible:bg-background focus-visible:shadow-[0_0_0_1px_rgba(37,99,235,0.15)] focus-visible:ring-0",
          // selection
          "selection:bg-primary selection:text-primary-foreground",
          // disabled
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          // invalid
          "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15",
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

export { Input };