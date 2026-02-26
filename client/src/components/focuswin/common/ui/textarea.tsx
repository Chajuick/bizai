import { useDialogComposition } from "@/components/ui/dialog";
import { useComposition } from "@/hooks/useComposition";
import { cn } from "@/lib/utils";
import * as React from "react";

function Textarea({
  className,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  ...props
}: React.ComponentProps<"textarea">) {
  const dialogComposition = useDialogComposition();

  const {
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    onKeyDown: handleKeyDown,
  } = useComposition<HTMLTextAreaElement>({
    onKeyDown: (e) => {
      const isComposing =
        (e.nativeEvent as any).isComposing || dialogComposition.justEndedComposing();

      // textarea는 Shift+Enter는 줄바꿈 유지
      if (e.key === "Enter" && !e.shiftKey && isComposing) return;

      onKeyDown?.(e);
    },
    onCompositionStart: (e) => {
      dialogComposition.setComposing(true);
      onCompositionStart?.(e);
    },
    onCompositionEnd: (e) => {
      dialogComposition.markCompositionEnd();
      setTimeout(() => {
        dialogComposition.setComposing(false);
      }, 100);
      onCompositionEnd?.(e);
    },
  });

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        [
          // size / layout
          "w-full min-w-0 min-h-28 px-4 py-3",
          // shape
          "rounded-xl",
          // surface (fowin-like)
          "bg-background border border-border",
          // text
          "text-sm text-foreground placeholder:text-muted-foreground",
          // allow comfy resize (토스는 보통 세로만)
          "resize-y",
          // motion
          "transition-[border-color,box-shadow,background-color] duration-150 ease-out",
          // focus
          "outline-none focus-visible:border-primary/30 focus-visible:border-primary/40 focus-visible:bg-background focus-visible:shadow-[0_0_0_1px_rgba(37,99,235,0.15)] focus-visible:ring-0",
          // selection
          "selection:bg-primary selection:text-primary-foreground",
          // disabled
          "disabled:cursor-not-allowed disabled:opacity-50",
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

export { Textarea };