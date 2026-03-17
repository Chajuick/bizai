// client/src/components/focuswin/common/actions/entity-action-menu.tsx
// 카드 우측 ··· 드롭다운 액션 메뉴

import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// #region Types
export type EntityAction = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  separator?: boolean; // separator BEFORE this item
};
// #endregion

export default function EntityActionMenu({
  actions,
  triggerClassName,
}: {
  actions: EntityAction[];
  triggerClassName?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded-full",
            "text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors",
            "focus:outline-none shrink-0",
            triggerClassName,
          )}
          aria-label="메뉴"
        >
          <MoreHorizontal size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[130px]">
        {actions.map((action, i) => (
          <div key={i}>
            {action.separator && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              className={cn(
                "gap-2 font-semibold text-sm cursor-pointer",
                action.variant === "danger"
                  ? "text-red-500 focus:text-red-600 focus:bg-red-50"
                  : "text-slate-700",
              )}
            >
              {action.icon && (
                <span className="w-4 shrink-0">{action.icon}</span>
              )}
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
