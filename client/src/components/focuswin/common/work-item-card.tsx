import * as React from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

type WorkItemCardRootProps = {
  children: React.ReactNode;
  className?: string;

  /**
   * 스타일만 인터랙티브하게(hover/group 등) 만들고 싶을 때
   * - onClick이 없어도 hover 느낌/그룹 hover를 쓰고 싶으면 true
   */
  interactive?: boolean;

  /**
   * 카드 전체 클릭(버튼처럼 동작)
   * - 내부에 버튼/링크가 있으면 그쪽에서 e.stopPropagation() 권장
   */
  onClick?: () => void;
};

function Root({ children, className, interactive, onClick }: WorkItemCardRootProps) {
  const clickable = !!onClick; // ✅ 실제 버튼 역할은 onClick 있을 때만
  const isInteractive = clickable || !!interactive;

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!clickable) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        isInteractive && "group",
        // ✅ 토큰 기반: 배경/보더/텍스트
        "rounded-3xl border bg-card text-card-foreground p-4 transition",
        // border 색을 토큰으로 (없으면 border-border로 fallback)
        "border-[color:var(--fowin-border,theme(colors.border))]",

        // ✅ 기본 카드 shadow (토큰)
        "[box-shadow:var(--fowin-shadow-card)]",

        // ✅ hover (토큰) - 인터랙티브한 카드만
        isInteractive &&
          "cursor-pointer hover:border-[color:var(--fowin-border-hover)] hover:[box-shadow:var(--fowin-shadow-card-hover)] hover:-translate-y-[1px]",

        // ✅ focus (토큰): 카드 기본 그림자 + 링을 동시에
        clickable &&
          "focus-visible:outline-none focus-visible:[box-shadow:var(--fowin-shadow-card),var(--fowin-ring)]",

        className
      )}
    >
      <div className="flex items-start gap-3">{children}</div>
    </div>
  );
}

type SlotProps = {
  children: React.ReactNode;
  className?: string;
};

type IconProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "warning" | "danger" | "slate";
  iconClassName?: string;
};

function Icon({ children, className, variant = "primary", iconClassName }: IconProps) {
  const v =
    variant === "danger"
      ? {
          base: "bg-red-50 border-red-200 text-red-600",
          hover: "group-hover:border-red-300",
        }
      : variant === "warning"
      ? {
          base: "bg-orange-50 border-orange-200 text-orange-600",
          hover: "group-hover:border-orange-300",
        }
      : variant === "slate"
      ? {
          base: "bg-muted border-border text-muted-foreground",
          hover: "group-hover:border-slate-300 dark:group-hover:border-slate-600",
        }
      : {
          base: "bg-blue-50 border-blue-200 text-blue-600",
          hover: "group-hover:border-blue-300",
        };

  return (
    <div
      className={cn(
        "w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 mt-0.5 transition",
        v.base,
        v.hover,
        className
      )}
    >
      <span className={cn("text-current", iconClassName)}>{children}</span>
    </div>
  );
}

type HeaderProps = {
  title: React.ReactNode;
  tags?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

function Header({ title, tags, actions, className }: HeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="min-w-0">
            <div className="font-black text-foreground text-sm truncate">{title}</div>
          </div>
          {tags ? <div className="flex items-center gap-1 flex-wrap">{tags}</div> : null}
        </div>
      </div>

      {actions ? (
        <div className="shrink-0 sm:min-w-[88px] flex justify-end text-right">{actions}</div>
      ) : (
        <div className="shrink-0 sm:min-w-[88px]" />
      )}
    </div>
  );
}

function Body({ children, className }: SlotProps) {
  return <div className={cn("my-2", className)}>{children}</div>;
}

type FooterProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
};

function Footer({ left, right, className }: FooterProps) {
  if (!left && !right) return null;

  return (
    <div className={cn("mt-1 flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">{left}</div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}

type MetaProps = {
  icon?: React.ReactNode;
  label?: React.ReactNode;
  value: React.ReactNode;
  tone?: "muted" | "default";
  className?: string;
};

function Meta({ icon, label, value, tone = "muted", className }: MetaProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs",
        tone === "muted" ? "text-muted-foreground" : "text-foreground/80",
        className
      )}
    >
      {icon ? <span className="text-muted-foreground/70">{icon}</span> : null}
      {label ? <span className="text-muted-foreground/70">{label}</span> : null}
      <span className="truncate">{value}</span>
    </div>
  );
}

type StagePillProps = {
  children: React.ReactNode;
  variant?: "blue" | "slate" | "emerald" | "red";
  className?: string;
};

function StagePill({ children, variant = "slate", className }: StagePillProps) {
  const v =
    variant === "blue"
      ? "bg-blue-50 border-blue-100 text-blue-700"
      : variant === "emerald"
      ? "bg-emerald-50 border-emerald-100 text-emerald-700"
      : variant === "red"
      ? "bg-red-50 border-red-100 text-red-700"
      : "bg-muted border-border text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-black",
        v,
        className
      )}
    >
      {children}
    </span>
  );
}

type ScheduleMetaProps = {
  value: React.ReactNode;
  status?: "default" | "imminent" | "overdue";
  icon?: React.ReactNode;
  className?: string;
};

function ScheduleMeta({ value, status = "default", icon, className }: ScheduleMetaProps) {
  const color =
    status === "overdue"
      ? "text-red-500"
      : status === "imminent"
      ? "text-orange-600"
      : "text-blue-600";

  return (
    <div className={cn("text-xs font-semibold flex items-center gap-1", color, className)}>
      {icon ?? <Clock size={12} className="text-current" />}
      {value}
    </div>
  );
}

export const WorkItemCard = Object.assign(Root, {
  Icon,
  Header,
  Body,
  Footer,
  Meta,
  StagePill,
  ScheduleMeta,
});