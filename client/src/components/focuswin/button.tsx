import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "neutral" | "success" | "danger";
type Variant = "solid" | "soft" | "outline" | "ghost";

type Theme = {
  cls: string;              // className (tailwind)
  style?: React.CSSProperties; // inline style (gradient/shadow)
};

// ✅ 테마 정의는 여기서만!
const THEME: Record<Tone, Record<Variant, Theme>> = {
  primary: {
    solid: {
      cls: "text-white",
      style: {
        background: "rgb(37, 99, 235)",
        boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
      },
    },
    soft: {
      cls: "text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100/60",
    },
    outline: {
      cls: "text-blue-700 bg-white border border-blue-200 hover:bg-blue-50",
    },
    ghost: {
      cls: "text-blue-700 hover:bg-blue-50",
    },
  },
  neutral: {
    solid: {
      cls: "text-slate-700 bg-slate-900/0 border border-slate-200 hover:bg-slate-50",
    },
    soft: {
      cls: "text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100",
    },
    outline: {
      cls: "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50",
    },
    ghost: {
      cls: "text-slate-600 hover:bg-slate-50",
    },
  },
  success: {
    solid: {
      cls: "text-white",
      style: {
        background: "linear-gradient(135deg,#10b981,#059669)",
        boxShadow: "0 10px 26px rgba(16,185,129,0.20)",
      },
    },
    soft: {
      cls: "text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100/60",
    },
    outline: {
      cls: "text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50",
    },
    ghost: {
      cls: "text-emerald-700 hover:bg-emerald-50",
    },
  },
  danger: {
    solid: {
      cls: "text-white",
      style: {
        background: "linear-gradient(135deg,#ef4444,#dc2626)",
        boxShadow: "0 10px 26px rgba(239,68,68,0.22)",
      },
    },
    soft: {
      cls: "text-red-700 bg-red-50 border border-red-100 hover:bg-red-100/60",
    },
    outline: {
      cls: "text-red-700 bg-white border border-red-200 hover:bg-red-50",
    },
    ghost: {
      cls: "text-red-700 hover:bg-red-50",
    },
  },
};

function getTheme(tone: Tone, variant: Variant) {
  return THEME[tone][variant];
}

/* =========================
   Button (텍스트/아이콘+텍스트)
========================= */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone;
  variant?: Variant; // solid | soft | outline | ghost
  size?: "sm" | "md";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ tone = "primary", variant = "solid", size = "md", className, children, ...props }, ref) => {
    const t = getTheme(tone, variant);

    const base =
      "inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed";

    const pad =
      size === "sm"
        ? "px-3 py-2 rounded-2xl text-sm"
        : "px-4 py-2 rounded-2xl text-sm";

    return (
      <button
        ref={ref}
        className={cn(base, pad, t.cls, className)}
        style={t.style}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

/* =========================
   IconButton (아이콘 전용)
========================= */

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  title: string;
  tone?: Tone;
  variant?: Exclude<Variant, "solid">; // 아이콘 버튼은 보통 solid 안 씀
  stopPropagation?: boolean;
  size?: "sm" | "md";
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      title,
      tone = "neutral",
      variant = "outline",
      size = "md",
      stopPropagation = true,
      className,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const t = getTheme(tone, variant);

    const base =
      "inline-flex items-center justify-center transition disabled:opacity-50";

    const dim =
      size === "sm"
        ? "w-9 h-9 rounded-2xl"
        : "w-10 h-10 rounded-2xl";

    const ghostBorder = variant === "ghost" ? "border border-transparent" : "";

    return (
      <button
        ref={ref}
        type="button"
        title={title}
        aria-label={title}
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          onClick?.(e);
        }}
        className={cn(base, dim, ghostBorder, t.cls, className)}
        style={t.style}
        {...props}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";