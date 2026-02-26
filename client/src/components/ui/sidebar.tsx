import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none",
        "data-[disabled]:opacity-50 data-[disabled]:pointer-events-none",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative grow overflow-hidden rounded-full",
          // fowin-like neutral track
          "bg-muted/70",
          "data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full",
          "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2"
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute",
            // brand range
            "bg-primary",
            "data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          )}
        />
      </SliderPrimitive.Track>

      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className={cn(
            [
              "block size-5 shrink-0 rounded-full",
              // surface
              "bg-white border border-border",
              "shadow-[0_2px_10px_rgba(15,23,42,0.12)]",
              // motion
              "transition-[transform,box-shadow,border-color] duration-150 ease-out",
              // hover (subtle lift)
              "hover:shadow-[0_4px_16px_rgba(15,23,42,0.14)]",
              // focus (no thick ring)
              "outline-none focus-visible:shadow-[0_0_0_1px_rgba(37,99,235,0.22),0_2px_10px_rgba(15,23,42,0.12)]",
              // active
              "active:scale-[0.98]",
            ].join(" ")
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };