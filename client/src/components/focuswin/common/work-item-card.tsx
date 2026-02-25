import * as React from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

type WorkItemCardRootProps = {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
};

function Root({
  children,
  className,
  interactive,
  onClick,
}: WorkItemCardRootProps) {
  const clickable = !!onClick || !!interactive;

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!clickable) return;
        // Space는 페이지 스크롤도 유발할 수 있어서 preventDefault
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        // ✅ clickable일 때만 group 부여 (hover 스타일 오해 방지)
        clickable && "group",
        // ✅ 토스톤: 더 얕은 그림자 + 은은한 border
        "rounded-3xl border bg-white p-4 transition",
        "border-slate-100 shadow-[0_6px_18px_rgba(15,23,42,0.04)]",
        // ✅ hover가 “느껴지도록” (과하지 않게)
        clickable &&
          "cursor-pointer hover:border-blue-200/70 hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)]",
        // ✅ focus는 은은하게 + offset
        clickable &&
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
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
  iconClassName?: string; // ✅ 아이콘에 붙일 클래스(선택)
};

function Icon({
  children,
  className,
  variant = "primary",
  iconClassName,
}: IconProps) {
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
          base: "bg-slate-50 border-slate-200 text-slate-600",
          hover: "group-hover:border-slate-300",
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
      {/* ✅ children은 그대로 렌더 (TS 안전) */}
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
            <div className="font-black text-slate-900 text-sm truncate">
              {title}
            </div>
          </div>
          {tags ? (
            <div className="flex items-center gap-1 flex-wrap">{tags}</div>
          ) : null}
        </div>
      </div>

      {/* ✅ 오른쪽 액션 영역 폭 고정 + 우측 정렬 */}
      {actions ? (
        <div className="shrink-0 sm:min-w-[88px] flex justify-end text-right">
          {actions}
        </div>
      ) : (
        <div className="shrink-0 sm:min-w-[88px]" />
      )}
    </div>
  );
}

function Body({ children, className }: SlotProps) {
  return <div className={cn("mt-2", className)}>{children}</div>;
}

type FooterProps = {
  left?: React.ReactNode; // 날짜/단계/메타
  right?: React.ReactNode; // 다음 단계 버튼 등
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
        tone === "muted" ? "text-slate-500" : "text-slate-700",
        className
      )}
    >
      {icon ? (
        // 아이콘은 기본 muted 톤 (ScheduleMeta는 text-current)
        <span className="text-slate-400">{icon}</span>
      ) : null}
      {label ? <span className="text-slate-400">{label}</span> : null}
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
      : "bg-slate-50 border-slate-100 text-slate-700";

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

/** ✅ 일정/날짜 표시용 (상태별 컬러 텍스트) */
type ScheduleMetaProps = {
  value: React.ReactNode;
  status?: "default" | "imminent" | "overdue";
  icon?: React.ReactNode;
  className?: string;
};

function ScheduleMeta({
  value,
  status = "default",
  icon,
  className,
}: ScheduleMetaProps) {
  const color =
    status === "overdue"
      ? "text-red-500"
      : status === "imminent"
      ? "text-orange-600"
      : "text-blue-600";

  return (
    <div
      className={cn(
        "text-xs font-semibold flex items-center gap-1",
        color,
        className
      )}
    >
      {/* ✅ 아이콘도 텍스트 컬러 따라가게 */}
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