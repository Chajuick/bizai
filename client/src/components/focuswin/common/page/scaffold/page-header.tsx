import React from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/focuswin/common/ui/button";
import { ArrowLeft } from "lucide-react";

type HeaderActionBase = {
  key?: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "success" | "danger";
  disabled?: boolean;
  ariaLabel?: string;
  danger?: boolean;
};

export type HeaderAction =
  | (HeaderActionBase & { onClick: () => void })
  | (HeaderActionBase & { href: string });

function SolidAction({
  action,
  mobileFull = false,
}: {
  action: HeaderAction;
  mobileFull?: boolean;
}) {
  const v = action.variant ?? "primary";

  const base = cn(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed",
    "rounded-2xl text-sm font-bold px-3 py-2 sm:px-4",
    mobileFull && "w-full"
  );

  const cls =
    v === "primary" || v === "success" || v === "danger"
      ? cn(base, "text-white")
      : v === "secondary"
      ? cn(base, "text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100")
      : cn(base, "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50");

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

function GhostAction({
  action,
  mobileFull = false,
}: {
  action: HeaderAction;
  mobileFull?: boolean;
}) {
  const title = action.ariaLabel ?? action.label;
  const dangerCls = action.danger ? "border-red-200 text-red-600 hover:bg-red-50" : "";

  const cls = cn(
    mobileFull
      ? "w-full h-11 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition flex items-center justify-center gap-2 px-3 text-sm font-bold"
      : "w-9 h-9 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition flex items-center justify-center",
    dangerCls,
    action.disabled && "pointer-events-none opacity-50"
  );

  const content = (
    <>
      {action.icon}
      {mobileFull ? <span>{action.label}</span> : null}
    </>
  );

  if ("href" in action) {
    return (
      <a href={action.href} aria-label={title} title={title} className={cls}>
        {content}
      </a>
    );
  }

  if (mobileFull) {
    return (
      <button
        type="button"
        onClick={action.onClick}
        disabled={action.disabled}
        aria-label={title}
        className={cls}
      >
        {content}
      </button>
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

function ActionButton({
  action,
  mobileFull = false,
}: {
  action: HeaderAction;
  mobileFull?: boolean;
}) {
  const v = action.variant ?? "primary";
  if (v === "ghost") return <GhostAction action={action} mobileFull={mobileFull} />;
  return <SolidAction action={action} mobileFull={mobileFull} />;
}

export default function PageHeader({
  kicker = "SECTION",
  title,
  description,
  onBack,
  primaryAction,
  actions = [],
  children,
}: {
  kicker?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  onBack?: () => void;
  primaryAction?: HeaderAction;
  actions?: HeaderAction[];
  children?: React.ReactNode;
}) {
  const allActions = [
    ...actions.map((a) => ({ ...a, variant: a.variant ?? "ghost" as const })),
    ...(primaryAction ? [primaryAction] : []),
  ];

  return (
    <div
      className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 pt-3 pb-4 border-b"
      style={{
        background: "rgba(255,255,255,0.86)",
        borderColor: "rgba(15,23,42,0.08)",
        backdropFilter: "blur(18px)",
      }}
    >
      {/* mobile */}
      <div className="sm:hidden">
        <div className="flex items-start gap-2">
          {onBack ? (
            <div className="shrink-0 -ml-2">
              <button
                onClick={onBack}
                className="p-2 rounded-xl hover:bg-slate-50 transition text-slate-700"
                aria-label="뒤로"
              >
                <ArrowLeft size={18} />
              </button>
            </div>
          ) : null}

          <div className="min-w-0 flex-1 pr-1">
            <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
              {kicker}
            </p>

            <h1 className="mt-0.5 text-[22px] leading-tight font-black text-slate-900 break-keep">
              {title}
            </h1>

            {description ? (
              <p className="mt-2 text-sm leading-6 text-slate-500 break-keep">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {allActions.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {allActions.map((a) => (
              <ActionButton
                key={a.key ?? a.label}
                action={a}
                mobileFull
              />
            ))}
          </div>
        ) : null}

        {children ? <div className="mt-3">{children}</div> : null}
      </div>

      {/* desktop */}
      <div className="hidden sm:block">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              {onBack ? (
                <div className="shrink-0 -ml-2">
                  <button
                    onClick={onBack}
                    className="p-2 rounded-xl hover:bg-slate-50 transition text-slate-700"
                    aria-label="뒤로"
                  >
                    <ArrowLeft size={18} />
                  </button>
                </div>
              ) : null}

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
              {primaryAction ? <ActionButton action={primaryAction} /> : null}
            </div>
          ) : null}
        </div>

        {children ? <div className="mt-3">{children}</div> : null}
      </div>
    </div>
  );
}