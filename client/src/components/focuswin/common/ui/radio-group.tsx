import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        [
          "relative aspect-square size-5 shrink-0 rounded-full",
          "border border-border bg-white",
          "transition-[border-color,box-shadow] duration-150 ease-out",
          "hover:border-border/80",
          // focus (fowin-like)
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
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex items-center justify-center"
      >
        {/* fowin-like dot */}
        <span className="size-2.5 rounded-full bg-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };