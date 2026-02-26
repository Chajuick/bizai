import * as React from "react";
import { cn } from "@/lib/utils";

type AvatarProps = {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: number;
  radius?: number | "full";
  className?: string;
  fallbackClassName?: string;

  withFrame?: boolean;
};

export default function Avatar({
  src,
  alt = "avatar",
  fallback = "?",
  size = 40,
  radius = "full",
  className,
  fallbackClassName,
  withFrame = false,
}: AvatarProps) {
  const [ok, setOk] = React.useState(true);

  React.useEffect(() => {
    setOk(true);
  }, [src]);

  const borderRadius =
    radius === "full" ? 9999 : typeof radius === "number" ? radius : 9999;

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden flex items-center justify-center",
        withFrame
          ? "bg-slate-100 border border-slate-200 ring-1 ring-border"
          : "bg-transparent border-0 ring-0",
        className
      )}
      style={{ width: size, height: size, borderRadius }}
    >
      {src && ok ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover block"
          onError={() => setOk(false)}
        />
      ) : (
        <span
          className={cn(
            withFrame ? "text-slate-700" : "text-current",
            "font-bold select-none",
            fallbackClassName
          )}
          style={{
            fontSize: Math.max(12, Math.floor(size * 0.42)),
            lineHeight: 1,
            transform: "translateY(1px)",
          }}
        >
          {fallback}
        </span>
      )}
    </div>
  );
}