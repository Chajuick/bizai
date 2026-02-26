import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        [
          "peer size-5 shrink-0 rounded-[6px] border border-border bg-background",
          "transition-[border-color,background-color,box-shadow] duration-150 ease-out",
          "hover:border-border/80",
          // checked
          "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
          // focus (fowin-like: subtle)
          "outline-none focus-visible:shadow-[0_0_0_1px_rgba(37,99,235,0.18)]",
          // disabled
          "disabled:cursor-not-allowed disabled:opacity-50",
          // invalid
          "aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_1px_rgba(239,68,68,0.18)]",
        ].join(" "),
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-primary-foreground"
      >
        <Check className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };