// components/focuswin/common/ui/textarea.tsx

import { useDialogComposition } from "@/components/ui/dialog";
import { useComposition } from "@/hooks/useComposition";
import { cn } from "@/lib/utils";
import * as React from "react";

type TextareaProps = React.ComponentProps<"textarea">;

function Textarea({ className, onKeyDown, onCompositionStart, onCompositionEnd, ...props }: TextareaProps) {
  const dialogComposition = useDialogComposition();

  const {
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    onKeyDown: handleKeyDown,
  } = useComposition<HTMLTextAreaElement>({
    onKeyDown: e => {
      const isComposing = (e.nativeEvent as any).isComposing || dialogComposition.justEndedComposing();

      // textarea는 Shift+Enter 줄바꿈 유지
      if (e.key === "Enter" && !e.shiftKey && isComposing) return;

      onKeyDown?.(e);
    },

    onCompositionStart: e => {
      dialogComposition.setComposing(true);
      onCompositionStart?.(e);
    },

    onCompositionEnd: e => {
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
          "w-full min-w-0 min-h-28 px-3 py-3",

          // surface
          "bg-transparent",
          "border border-border/70",

          // text
          "text-sm text-foreground",
          "placeholder:text-muted-foreground/60",

          // resize
          "resize-y",

          // hover
          "hover:border-foreground/30",

          // focus
          "outline-none",
          "focus:border-primary",

          // motion
          "transition-colors duration-150",

          // selection
          "selection:bg-primary selection:text-primary-foreground",

          // disabled
          "disabled:cursor-not-allowed disabled:opacity-50",

          // invalid
          "aria-invalid:border-destructive",
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
