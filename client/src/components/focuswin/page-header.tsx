import React from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/focuswin/button";

type HeaderActionBase = {
  key?: string;
  label: string;
  icon?: React.ReactNode;

  // ✅ 단순: 5개만 (필요한 것만)
  variant?: "primary" | "secondary" | "outline" | "ghost" | "success" | "danger";

  disabled?: boolean;
  ariaLabel?: string;

  // ✅ ghost에서만 “삭제 빨강” 같은 포인트 처리
  danger?: boolean;
};

export type HeaderAction =
  | (HeaderActionBase & { onClick: () => void })
  | (HeaderActionBase & { href: string });

function SolidAction({ action }: { action: HeaderAction }) {
  const v = action.variant ?? "primary";

  const base =
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap " +
    "transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed " +
    "rounded-2xl text-sm font-bold px-3 py-2 sm:px-4";

  const cls =
    v === "primary" || v === "success" || v === "danger"
      ? cn(base, "text-white")
      : v === "secondary"
      ? cn(
          base,
          "text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100"
        )
      : cn(
          base,
          "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"
        );

  const style =
    v === "primary"
      ? ({
          background: "rgb(37, 99, 235)",
          boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
        } as React.CSSProperties)
      : v === "success"
      ? ({
          background: "linear-gradient(135deg,#10b981,#059669)",
          boxShadow: "0 10px 26px rgba(16,185,129,0.20)",
        } as React.CSSProperties)
      : v === "danger"
      ? ({
          background: "linear-gradient(135deg,#ef4444,#dc2626)",
          boxShadow: "0 10px 26px rgba(239,68,68,0.22)",
        } as React.CSSProperties)
      : undefined;

  const content = (
    <>
      {action.icon}
      {action.label}
    </>
  );

  if ("href" in action) {
    return (
      <a
        href={action.href}
        aria-label={action.ariaLabel ?? action.label}
        className={cls}
        style={style}
        onClick={(e) => {
          if (action.disabled) e.preventDefault();
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      aria-label={action.ariaLabel ?? action.label}
      className={cls}
      style={style}
    >
      {content}
    </button>
  );
}

function GhostAction({ action }: { action: HeaderAction }) {
  const title = action.ariaLabel ?? action.label;
  const dangerCls = action.danger
    ? "border-red-200 text-red-600 hover:bg-red-50"
    : "";

  // 헤더에서 ghost href는 잘 안 쓰지만, 있어도 동작하게만 유지
  if ("href" in action) {
    return (
      <a
        href={action.href}
        aria-label={title}
        title={title}
        className={cn(
          "w-9 h-9 rounded-2xl border border-slate-200 text-slate-600",
          "hover:bg-slate-50 transition flex items-center justify-center",
          dangerCls,
          action.disabled && "pointer-events-none opacity-50"
        )}
      >
        {action.icon}
      </a>
    );
  }

  return (
    <IconButton
      title={title}
      onClick={action.onClick}
      disabled={action.disabled}
      stopPropagation={false}
      className={dangerCls}
    >
      {action.icon}
    </IconButton>
  );
}

function ActionButton({ action }: { action: HeaderAction }) {
  const v = action.variant ?? "primary";
  if (v === "ghost") return <GhostAction action={action} />;
  return <SolidAction action={action} />;
}

export default function PageHeader({
  kicker = "SECTION",
  title,
  description,
  left,
  primaryAction,
  actions = [],
  children,
}: {
  kicker?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  left?: React.ReactNode;
  primaryAction?: HeaderAction;
  actions?: HeaderAction[];
  children?: React.ReactNode;
}) {
  return (
    <div
      className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 pt-3 pb-4 border-b"
      style={{
        background: "rgba(255,255,255,0.86)",
        borderColor: "rgba(15,23,42,0.08)",
        backdropFilter: "blur(18px)",
      }}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            {left ? <div className="shrink-0 -ml-2">{left}</div> : null}

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
                {kicker}
              </p>

              <h1 className="text-base sm:text-lg font-black text-slate-900 min-w-0">
                {title}
              </h1>

              {description ? (
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              ) : null}
            </div>
          </div>
        </div>

        {primaryAction || actions.length > 0 ? (
          <div className="flex items-center gap-2 shrink-0">
            {actions.map((a) => (
              <ActionButton
                key={a.key ?? a.label}
                action={{ ...a, variant: a.variant ?? "ghost" }}
              />
            ))}
            {primaryAction ? (
              <ActionButton action={primaryAction} />
            ) : null}
          </div>
        ) : null}
      </div>

      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}