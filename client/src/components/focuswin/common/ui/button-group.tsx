import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const buttonGroupVariants = cva(
  [
    // container
    "inline-flex w-fit items-stretch overflow-hidden",
    // fowin-like shell
    "rounded-xl border border-border bg-background shadow-sm",
    // focus stacking
    "[&>*]:focus-visible:z-10 [&>*]:focus-visible:relative",
    // select width behavior
    "[&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit",
    "[&>input]:flex-1",
    // when nested groups exist, allow spacing
    "has-[>[data-slot=button-group]]:gap-2 has-[>[data-slot=button-group]]:bg-transparent has-[>[data-slot=button-group]]:border-0 has-[>[data-slot=button-group]]:shadow-none",
  ].join(" "),
  {
    variants: {
      orientation: {
        horizontal:
          "flex-row [&>*:not(:first-child)]:border-l [&>*:not(:first-child)]:border-border",
        vertical:
          "flex-col [&>*:not(:first-child)]:border-t [&>*:not(:first-child)]:border-border",
      },
      size: {
        default: "h-11",
        sm: "h-9 rounded-lg",
        lg: "h-12 rounded-2xl",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
      size: "default",
    },
  }
);

function ButtonGroup({
  className,
  orientation,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation, size }), className)}
      {...props}
    />
  );
}

/**
 * Text chunk inside group (e.g. label / prefix)
 * - matches Input-like surface
 */
function ButtonGroupText({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="button-group-text"
      className={cn(
        [
          "flex items-center gap-2 px-4",
          "text-sm font-semibold text-foreground",
          "bg-background",
          // remove inner rounding (group handles rounding)
          "rounded-none",
          // icons
          "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        ].join(" "),
        className
      )}
      {...props}
    />
  );
}

/**
 * Optional explicit separator component (rarely needed if borders handle it),
 * but kept for compatibility.
 */
function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        [
          "!m-0 self-stretch",
          "bg-border/60",
          "data-[orientation=vertical]:h-auto data-[orientation=horizontal]:w-auto",
        ].join(" "),
        className
      )}
      {...props}
    />
  );
}

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
};