import * as React from "react";
import { Chrome } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthProviderButtonProps = {
  href: string;
  label?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * OAuth Provider Button
 * - Uses <a> for navigation (OAuth redirect), styled like a button.
 * - Avoids nesting <a> inside <button> and avoids preventDefault hacks.
 */
export default function AuthProviderButton({
  href,
  label = "Google로 계속하기",
  disabled,
  className,
}: AuthProviderButtonProps) {
  return (
    <a
      href={disabled ? undefined : href}
      aria-disabled={disabled ? "true" : undefined}
      className={cn(
        "w-full h-12 rounded-2xl border border-slate-200 bg-white",
        "flex items-center justify-center gap-2",
        "text-sm font-semibold text-slate-800",
        "shadow-[0_6px_18px_rgba(15,23,42,0.04)]",
        "hover:bg-slate-50 active:scale-[0.99] transition",
        "focus:outline-none focus-visible:[box-shadow:var(--fowin-ring)]",
        disabled && "opacity-60 pointer-events-none",
        className
      )}
    >
      <Chrome size={16} className="text-slate-600" />
      {label}
    </a>
  );
}