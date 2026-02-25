import React from "react";

type Variant = "default" | "primary" | "warning" | "danger";

const variantStyles: Record<Variant, { bd?: string }> = {
  default: {},
  primary: { bd: "rgba(37,99,235,0.18)" },
  warning: { bd: "rgba(249,115,22,0.22)" },
  danger: { bd: "rgba(239,68,68,0.20)" },
};

const iconToneStyles: Record<Variant, { background: string; borderColor: string; color: string }> = {
  default: {
    background: "rgba(37,99,235,0.08)",
    borderColor: "rgba(37,99,235,0.14)",
    color: "rgb(37,99,235)",
  },
  primary: {
    background: "rgba(37,99,235,0.08)",
    borderColor: "rgba(37,99,235,0.14)",
    color: "rgb(37,99,235)",
  },
  warning: {
    background: "rgba(249,115,22,0.08)",
    borderColor: "rgba(249,115,22,0.20)",
    color: "rgb(234,88,12)",
  },
  danger: {
    background: "rgba(239,68,68,0.08)",
    borderColor: "rgba(239,68,68,0.18)",
    color: "rgb(239,68,68)",
  },
};

export default function EntityCard({
  variant = "default",
  icon,
  iconTone = "primary",
  title,
  badges,
  subtitle,
  content,
  meta,
  right,
  onClick,
  className = "",
}: {
  variant?: Variant;
  icon: React.ReactNode;
  iconTone?: Variant;

  /** 제목(필수) */
  title: React.ReactNode;

  /** 제목 옆 배지/칩 영역 */
  badges?: React.ReactNode;

  /** 고객사/담당자 같은 한 줄 보조 텍스트 */
  subtitle?: React.ReactNode;

  /**
   * 본문(설명/요약 등). 기존 description보다 범용적으로.
   * 필요하면 JSX로 자유롭게 넣기.
   */
  content?: React.ReactNode;

  /** 날짜/시간 같은 하단 라인 */
  meta?: React.ReactNode;

  /** 우측 액션(더보기/chevron/버튼 등) */
  right?: React.ReactNode;

  /** 카드 클릭(링크는 바깥에서 감싸기 권장) */
  onClick?: () => void;

  /** 외부에서 spacing/hover 등 추가 커스텀 */
  className?: string;
}) {
  const bd = variantStyles[variant].bd;
  const iconStyle = iconToneStyles[iconTone] ?? iconToneStyles.primary;

  return (
    <div
      onClick={onClick}
      className={["rounded-3xl border border-slate-100 bg-white p-4 transition", onClick ? "cursor-pointer hover:shadow-[0_12px_32px_rgba(15,23,42,0.06)]" : "", className].join(" ")}
      style={bd ? { borderColor: bd } : undefined}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border" style={iconStyle}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-black text-slate-900">{title}</p>
            {badges}
          </div>

          {subtitle ? <p className="text-xs text-slate-500 mt-1">{subtitle}</p> : null}

          {content ? <div className="mt-2">{content}</div> : null}

          {meta ? <div className="mt-2">{meta}</div> : null}
        </div>

        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>
  );
}
