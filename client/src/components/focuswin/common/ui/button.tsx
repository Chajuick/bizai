import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * ✅ 통합 컨셉
 * - shadcn(Button) API: asChild, size, fullWidth, data-[state=open]/aria-expanded 대응 유지
 * - 기존 Toss-ish 버튼 API: tone(primary/neutral/success/danger) + variant(solid/soft/outline/ghost/link)
 * - 그라데이션/쉐도우(원하면): solid에만 inline style로 지원
 */

export type ButtonTone = "primary" | "neutral" | "success" | "danger";
export type ButtonVariant = "solid" | "soft" | "outline" | "ghost" | "link";

const SOLID_STYLE: Partial<
  Record<ButtonTone, React.CSSProperties>
> = {
  primary: {
    background: "rgb(37, 99, 235)",
    boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
  },
  success: {
    background: "linear-gradient(135deg,#10b981,#059669)",
    boxShadow: "0 10px 26px rgba(16,185,129,0.20)",
  },
  danger: {
    background: "linear-gradient(135deg,#ef4444,#dc2626)",
    boxShadow: "0 10px 26px rgba(239,68,68,0.22)",
  },
  // neutral solid은 굳이 inline 필요 없어서 생략(클래스로 처리)
};

const buttonVariants = cva(
  [
    // layout
    "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none",
    // typography
    "text-sm font-semibold",
    // shape (Toss-ish)
    "rounded-xl",
    // motion
    "transition-[transform,box-shadow,background-color,border-color,color] duration-150 ease-out",
    // icons
    "shrink-0 [&_svg]:shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
    // disabled
    "disabled:pointer-events-none disabled:opacity-50",

    // ✅ focus + open(찌그러짐 방지 핵심)
    [
      "outline-none",
      "focus-visible:border-primary/30",
      "focus-visible:bg-background",
      "focus-visible:shadow-[0_0_0_1px_rgba(37,99,235,0.15)]",
      "focus-visible:ring-0",

      // Radix open state
      "data-[state=open]:border-primary/20",
      "data-[state=open]:bg-primary/10",
      "data-[state=open]:shadow-[0_0_0_1px_rgba(37,99,235,0.12)]",

      // aria-expanded (combobox trigger)
      "aria-expanded:border-primary/20",
      "aria-expanded:bg-primary/10",
      "aria-expanded:shadow-[0_0_0_1px_rgba(37,99,235,0.12)]",
    ].join(" "),

    // invalid
    "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",

    // press (open일 땐 scale 금지)
    "active:scale-[0.98] data-[state=open]:active:scale-100 aria-expanded:active:scale-100",
  ].join(" "),
  {
    variants: {
      tone: {
        primary: "",
        neutral: "",
        success: "",
        danger: "",
      },
      variant: {
        solid: "",
        soft: "",
        outline: "",
        ghost: "",
        link: "",
      },
      size: {
        // ✅ 44px default
        md: "h-11 px-4 has-[>svg]:px-3",
        sm: "h-9 rounded-lg px-3 text-sm has-[>svg]:px-2.5",
        lg: "h-12 rounded-2xl px-6 text-base has-[>svg]:px-4",
        icon: "h-11 w-11 p-0",
        "icon-sm": "h-9 w-9 rounded-lg p-0",
        "icon-lg": "h-12 w-12 rounded-2xl p-0",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    compoundVariants: [
      // ─────────────────────────
      // SOLID
      // ─────────────────────────
      { tone: "primary", variant: "solid", className: "text-white hover:opacity-95" },
      { tone: "success", variant: "solid", className: "text-white hover:opacity-95" },
      { tone: "danger",  variant: "solid", className: "text-white hover:opacity-95" },
      {
        tone: "neutral",
        variant: "solid",
        className:
          "text-slate-700 bg-white border border-border shadow-sm hover:bg-accent hover:shadow-md",
      },

      // ─────────────────────────
      // SOFT
      // ─────────────────────────
      {
        tone: "primary",
        variant: "soft",
        className:
          "text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100/60 shadow-sm",
      },
      {
        tone: "neutral",
        variant: "soft",
        className:
          "text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 shadow-sm",
      },
      {
        tone: "success",
        variant: "soft",
        className:
          "text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100/60 shadow-sm",
      },
      {
        tone: "danger",
        variant: "soft",
        className:
          "text-red-700 bg-red-50 border border-red-100 hover:bg-red-100/60 shadow-sm",
      },

      // ─────────────────────────
      // OUTLINE
      // ─────────────────────────
      {
        tone: "primary",
        variant: "outline",
        className:
          "text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 shadow-sm",
      },
      {
        tone: "neutral",
        variant: "outline",
        className:
          "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm",
      },
      {
        tone: "success",
        variant: "outline",
        className:
          "text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 shadow-sm",
      },
      {
        tone: "danger",
        variant: "outline",
        className:
          "text-red-700 bg-white border border-red-200 hover:bg-red-50 shadow-sm",
      },

      // ─────────────────────────
      // GHOST
      // ─────────────────────────
      { tone: "primary", variant: "ghost", className: "text-blue-700 hover:bg-blue-50 shadow-none" },
      { tone: "neutral", variant: "ghost", className: "text-slate-600 hover:bg-slate-50 shadow-none" },
      { tone: "success", variant: "ghost", className: "text-emerald-700 hover:bg-emerald-50 shadow-none" },
      { tone: "danger",  variant: "ghost", className: "text-red-700 hover:bg-red-50 shadow-none" },

      // ─────────────────────────
      // LINK
      // ─────────────────────────
      { tone: "primary", variant: "link", className: "text-blue-700 underline-offset-4 hover:underline shadow-none bg-transparent border-0 px-0" },
      { tone: "neutral", variant: "link", className: "text-slate-700 underline-offset-4 hover:underline shadow-none bg-transparent border-0 px-0" },
      { tone: "success", variant: "link", className: "text-emerald-700 underline-offset-4 hover:underline shadow-none bg-transparent border-0 px-0" },
      { tone: "danger",  variant: "link", className: "text-red-700 underline-offset-4 hover:underline shadow-none bg-transparent border-0 px-0" },
    ],
    defaultVariants: {
      tone: "primary",
      variant: "solid",
      size: "md",
      fullWidth: false,
    },
  }
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /**
     * solid에만 inline 그라데이션/쉐도우를 켜고 싶을 때 true.
     * (기본 true로 두면 기존 버튼 감성 유지됨)
     */
    solidStyle?: boolean;
  };

function Button({
  className,
  tone,
  variant,
  size,
  fullWidth,
  asChild = false,
  solidStyle = true,
  style,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  const mergedStyle =
    variant === "solid" && solidStyle
      ? { ...(SOLID_STYLE[tone ?? "primary"] ?? {}), ...(style ?? {}) }
      : style;

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ tone, variant, size, fullWidth }), className)}
      style={mergedStyle}
      {...props}
    />
  );
}

/**
 * ✅ IconButton: 기존 IconButton 사용성 그대로 가져가되,
 * 내부적으로 통합 Button을 사용
 */
type IconButtonProps = Omit<ButtonProps, "children"> & {
  title: string;
  stopPropagation?: boolean;
  children: React.ReactNode;
};

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      title,
      stopPropagation = true,
      onClick,
      size = "icon",
      tone = "neutral",
      variant = "outline",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        type="button"
        aria-label={title}
        title={title}
        tone={tone}
        variant={variant}
        size={size}
        className={cn(className)}
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
IconButton.displayName = "IconButton";

export { Button, IconButton, buttonVariants };
export type { ButtonProps };