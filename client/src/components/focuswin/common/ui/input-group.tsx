import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/components/focuswin/common/ui/button";
import { Input } from "@/components/focuswin/common/ui/input";
import { Textarea } from "@/components/focuswin/common/ui/textarea";

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        [
          "group/input-group relative flex w-full min-w-0 items-center overflow-hidden",
          // fowin shell
          "rounded-xl border border-border bg-background",
          "transition-[border-color,box-shadow,background-color] duration-150 ease-out",
          // height rules
          "h-11 has-[>textarea]:h-auto",
          // alignment variants (keep your behavior)
          "has-[>[data-align=inline-start]]:[&>input]:pl-2",
          "has-[>[data-align=inline-end]]:[&>input]:pr-2",
          "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3",
          "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3",

          // focus on any control inside
          "has-[[data-slot=input-group-control]:focus-visible]:border-primary/30 has-[[data-slot=input-group-control]:focus-visible]:ring-4 has-[[data-slot=input-group-control]:focus-visible]:ring-primary/20",

          // error
          "has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-4 has-[[data-slot][aria-invalid=true]]:ring-destructive/15",
        ].join(" "),
        className
      )}
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva(
  [
    "flex h-auto items-center justify-center gap-2 select-none",
    "text-muted-foreground text-sm font-semibold",
    // spacing
    "px-4",
    // icons
    "[&>svg:not([class*='size-'])]:size-4",
    // kbd
    "[&>kbd]:rounded-lg",
    "group-data-[disabled=true]/input-group:opacity-50",
  ].join(" "),
  {
    variants: {
      align: {
        "inline-start": "order-first",
        "inline-end": "order-last",
        "block-start":
          "order-first w-full justify-start pt-3 pb-2 px-4 border-b border-border/60",
        "block-end":
          "order-last w-full justify-start pt-2 pb-3 px-4 border-t border-border/60",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
);

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        e.currentTarget.parentElement?.querySelector("input")?.focus();
      }}
      {...props}
    />
  );
}

const inputGroupButtonVariants = cva("text-sm shadow-none flex gap-2 items-center", {
  variants: {
    size: {
      xs: "h-7 gap-1 px-2 rounded-lg [&>svg:not([class*='size-'])]:size-3.5 has-[>svg]:px-2",
      sm: "h-9 px-3 gap-1.5 rounded-xl has-[>svg]:px-3",
      "icon-xs": "size-7 rounded-lg p-0 has-[>svg]:p-0",
      "icon-sm": "size-9 rounded-xl p-0 has-[>svg]:p-0",
    },
  },
  defaultVariants: { size: "xs" },
});

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(
        // inside group: no floating, no press-scale jitter
        "rounded-lg shadow-none hover:shadow-none active:scale-100",
        inputGroupButtonVariants({ size }),
        className
      )}
      {...props}
    />
  );
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-sm font-semibold text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function InputGroupInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        [
          "flex-1",
          // group handles surface/border/ring
          "rounded-none border-0 bg-transparent shadow-none",
          "focus-visible:ring-0 focus-visible:border-transparent",
          // padding tweak to match
          "px-0",
        ].join(" "),
        className
      )}
      {...props}
    />
  );
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        [
          "flex-1 resize-none",
          "rounded-none border-0 bg-transparent shadow-none",
          "focus-visible:ring-0 focus-visible:border-transparent",
          "py-3 px-0",
        ].join(" "),
        className
      )}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};