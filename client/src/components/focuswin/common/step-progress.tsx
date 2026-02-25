"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ProgressTone = "primary" | "warning" | "danger" | "slate";

export type StepLineStep<K extends string = string> = {
  key: K;
  label: React.ReactNode;
};

/** 부모 주입용 (선택) */
export type StepStyle = {
  text: string; // e.g. "text-sky-400"
  ring?: string; // e.g. "ring-sky-100"
  line?: string; // e.g. "bg-sky-100"
  labelCurrent?: string; // e.g. "text-sky-600"
  labelDone?: string; // e.g. "text-slate-600"
};

type StepLineProps<K extends string = string> = {
  steps: readonly StepLineStep<K>[];
  current: K;
  className?: string;
  showLabels?: boolean;

  /** ✅ 기본값: 한 색(하늘/파랑) 그라데이션 */
  scheme?: "monoSky" | "tone";

  /** tone 모드 fallback */
  tone?: ProgressTone;

  /** ✅ 단계별 스타일 주입 (없으면 scheme 기본값 사용) */
  stepStyles?: Partial<Record<K, StepStyle>>;

  /** ✅ 현재 dot hover 시 퍼짐 */
  hoverPulse?: boolean;

  /** ✅ 점 크기(옵션) */
  size?: "sm" | "md";
};

function toneFallback(tone: ProgressTone) {
  if (tone === "danger")
    return {
      text: "text-red-500",
      ring: "ring-red-200",
      line: "bg-red-200",
      labelCurrent: "text-red-700",
      labelDone: "text-slate-600",
    };
  if (tone === "warning")
    return {
      text: "text-orange-500",
      ring: "ring-orange-200",
      line: "bg-orange-200",
      labelCurrent: "text-orange-700",
      labelDone: "text-slate-600",
    };
  if (tone === "slate")
    return {
      text: "text-slate-500",
      ring: "ring-slate-200",
      line: "bg-slate-200",
      labelCurrent: "text-slate-700",
      labelDone: "text-slate-500",
    };
  return {
    text: "text-blue-600",
    ring: "ring-blue-200",
    line: "bg-blue-200",
    labelCurrent: "text-blue-700",
    labelDone: "text-slate-600",
  };
}

/** ✅ 단일 색(하늘/파랑) 그라데이션 기본값 */
function monoSkyByIndex(i: number) {
  const arr = [
    // 대기(가장 연함)
    {
      text: "text-sky-200",
      ring: "ring-sky-100",
      line: "bg-sky-100",
      labelCurrent: "text-sky-500",
      labelDone: "text-slate-600",
    },
    // 납품
    {
      text: "text-sky-300",
      ring: "ring-sky-100",
      line: "bg-sky-100",
      labelCurrent: "text-sky-600",
      labelDone: "text-slate-600",
    },
    // 청구
    {
      text: "text-sky-400",
      ring: "ring-sky-100",
      line: "bg-sky-100",
      labelCurrent: "text-sky-700",
      labelDone: "text-slate-600",
    },
    // 수금(가장 진함)
    {
      text: "text-sky-500",
      ring: "ring-sky-200",
      line: "bg-sky-200",
      labelCurrent: "text-sky-700",
      labelDone: "text-slate-600",
    },
  ] as const;

  return arr[i % arr.length];
}

function StepLine<K extends string = string>({
  steps,
  current,
  className,
  showLabels = true,
  scheme = "monoSky",
  tone = "primary",
  stepStyles,
  hoverPulse = true,
  size = "md",
}: StepLineProps<K>) {
  const idx = Math.max(0, steps.findIndex((s) => s.key === current));
  const tf = toneFallback(tone);

  const dotSize = size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3";
  const ringSize = size === "sm" ? "ring-3" : "ring-4";
  const connectorW = size === "sm" ? "w-5" : "w-6";

  const getStyle = (key: K, i: number) => {
    const injected = stepStyles?.[key];
    const base = scheme === "tone" ? tf : monoSkyByIndex(i);

    return {
      text: injected?.text ?? base.text,
      ring: injected?.ring ?? base.ring,
      line: injected?.line ?? base.line,
      labelCurrent: injected?.labelCurrent ?? base.labelCurrent,
      labelDone: injected?.labelDone ?? base.labelDone,
    };
  };

  return (
    <div className={cn("flex items-center gap-0", className)}>
      {steps.map((s, i) => {
        const done = i < idx;
        const isCurrent = i === idx;

        const st = getStyle(s.key, i);

        return (
          <React.Fragment key={String(s.key)}>
            <div className="flex flex-col items-center gap-1">
              {/* Dot */}
              <span
                className={cn(
                  "relative rounded-full flex-shrink-0 transition-all duration-200",
                  dotSize,
                  // color source
                  done || isCurrent ? st.text : "text-slate-200",
                  // actual fill
                  "bg-current",
                  // current emphasis
                  isCurrent && cn(ringSize, st.ring)
                )}
              >
                {/* ✅ hover pulse (current only) */}
                {isCurrent && hoverPulse ? (
                  <span
                    className={cn(
                      "absolute inset-0 rounded-full bg-current opacity-15 scale-150",
                      "group-hover:animate-ping motion-reduce:hidden"
                    )}
                  />
                ) : null}
              </span>

              {/* Label */}
              {showLabels ? (
                <span
                  className={cn(
                    "text-[10px] font-bold whitespace-nowrap transition-colors",
                    done ? st.labelDone : isCurrent ? st.labelCurrent : "text-slate-300"
                  )}
                >
                  {s.label}
                </span>
              ) : null}
            </div>

            {/* Connector line */}
            {i !== steps.length - 1 ? (
              <span
                className={cn(
                  "h-0.5 flex-shrink-0 mb-3 transition-colors duration-200 rounded-full",
                  connectorW,
                  i < idx ? st.line : "bg-slate-200"
                )}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

type NextStageActionProps = {
  label: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  variant?: "primary" | "slate";
  icon?: React.ReactNode;
  stopPropagation?: boolean;
};

function NextStageAction({
  label,
  onClick,
  disabled,
  className,
  variant = "primary",
  icon,
  stopPropagation = true,
}: NextStageActionProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        onClick?.(e);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 disabled:opacity-50 active:scale-[0.97]",
        isPrimary
          ? "text-white"
          : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        className
      )}
      style={
        isPrimary
          ? {
              background: "rgb(37, 99, 235)",
              boxShadow: "0 4px 14px rgba(37,99,235,0.22)",
            }
          : undefined
      }
    >
      {icon}
      {label}
    </button>
  );
}

type StepLineWithActionProps<K extends string = string> = {
  steps: readonly StepLineStep<K>[];
  current: K;
  className?: string;
  showLabels?: boolean;
  leftMeta?: React.ReactNode;

  scheme?: "monoSky" | "tone";
  tone?: ProgressTone;

  stepStyles?: Partial<Record<K, StepStyle>>;
  hoverPulse?: boolean;
  size?: "sm" | "md";

  action?: {
    label: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    variant?: "primary" | "slate";
    icon?: React.ReactNode;
    stopPropagation?: boolean;
  } | null;
};

function StepLineWithAction<K extends string = string>({
  steps,
  current,
  className,
  showLabels = true,
  leftMeta,

  scheme = "monoSky",
  tone = "primary",
  stepStyles,
  hoverPulse = true,
  size = "md",

  action,
}: StepLineWithActionProps<K>) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {leftMeta ? <div className="mb-4">{leftMeta}</div> : null}
        <StepLine
          steps={steps}
          current={current}
          showLabels={showLabels}
          scheme={scheme}
          tone={tone}
          stepStyles={stepStyles}
          hoverPulse={hoverPulse}
          size={size}
        />
      </div>

      {action ? (
        <div className="shrink-0 pb-0.5">
          <NextStageAction
            label={action.label}
            onClick={action.onClick}
            disabled={action.disabled}
            variant={action.variant}
            icon={action.icon}
            stopPropagation={action.stopPropagation ?? true}
          />
        </div>
      ) : null}
    </div>
  );
}

export const StepProgress = Object.assign(StepLine, {
  Line: StepLine,
  Action: NextStageAction,
  Combo: StepLineWithAction,
});