import React, { useState } from "react";

export default function LogoSlot({
  src,
  alt = "BizAI",
  size = 36,
  radius = 12,
  fallback = "B",
  className = "",
}: {
  src: string;
  alt?: string;
  size?: number;
  radius?: number;
  fallback?: string;
  className?: string;
}) {
  const [ok, setOk] = useState(true);

  return (
    <div
      className={[
        "shrink-0 overflow-hidden flex items-center justify-center",
        "bg-slate-100 border border-slate-200",
        className,
      ].join(" ")}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      {ok ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover block"
          onError={() => setOk(false)}
        />
      ) : (
        <span
          className="text-slate-900 font-black"
          style={{
            fontSize: Math.max(12, Math.floor(size * 0.42)),
            lineHeight: 1,
            transform: "translateY(1px)", // baseline 미세 보정
          }}
        >
          {fallback}
        </span>
      )}
    </div>
  );
}