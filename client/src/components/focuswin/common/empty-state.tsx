import React from "react";
import { Link } from "wouter";

type Action =
  | {
      label: string;
      icon?: React.ReactNode;
      onClick: () => void;
      variant?: "primary" | "secondary";
    }
  | {
      label: string;
      icon?: React.ReactNode;
      href: string;
      variant?: "primary" | "secondary";
    };

function ActionButton({ action }: { action: Action }) {
  const isPrimary = (action.variant ?? "primary") === "primary";

  const className = [
    "inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition",
    isPrimary
      ? "text-white"
      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  ].join(" ");

  const style = isPrimary ? { background: "rgb(37, 99, 235)" } : undefined;

  const content = (
    <button
      type="button"
      onClick={"onClick" in action ? action.onClick : undefined}
      className={className}
      style={style}
    >
      {action.icon}
      {action.label}
    </button>
  );

  if ("href" in action) return <Link href={action.href}>{content}</Link>;
  return content;
}

export default function EmptyState({
  icon,
  title,
  description,
  actions,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actions?: Action[];
  className?: string;
}) {
  return (
    <div className={["text-center py-14", className].join(" ")}>
      <div className="mx-auto w-14 h-14 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center">
        {icon}
      </div>

      <p className="mt-4 text-base font-black text-slate-900">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      ) : null}

      {actions?.length ? (
        <div className="mt-5 flex justify-center gap-2 flex-wrap">
          {actions.map((a, idx) => (
            <ActionButton key={idx} action={a} />
          ))}
        </div>
      ) : null}
    </div>
  );
}