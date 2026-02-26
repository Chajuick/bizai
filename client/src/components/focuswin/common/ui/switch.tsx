import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        [
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
          "border border-border bg-muted/60",
          "transition-[background-color,border-color,box-shadow] duration-150 ease-out",
          "data-[state=checked]:bg-primary data-[state=checked]:border-primary/60",
          "outline-none focus-visible:shadow-[0_0_0_1px_rgba(37,99,235,0.18)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
        ].join(" "),
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          [
            "block size-5 rounded-full bg-white shadow-[0_1px_2px_rgba(15,23,42,0.18)]",
            "transition-transform duration-150 ease-out",
            "data-[state=unchecked]:translate-x-0.5 data-[state=checked]:translate-x-5",
          ].join(" ")
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };