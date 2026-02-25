import React from "react";

export type TabPill<T extends string> = {
  key: T;
  label: string;
  count?: number;
  disabled?: boolean;
};

export default function TabPills<T extends string>({
  tabs,
  value,
  onChange,
  className = "",
  itemClassName = "",
}: {
  tabs: TabPill<T>[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-1 ${className}`}>
      {tabs.map((tab) => {
        const active = value === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            disabled={tab.disabled}
            className={[
              "inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold transition shrink-0",
              "border",
              tab.disabled ? "opacity-50 cursor-not-allowed" : "",
              active
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
              itemClassName,
            ].join(" ")}
          >
            <span>{tab.label}</span>

            {typeof tab.count === "number" && (
              <span
                className={[
                  "text-[11px] font-extrabold px-2 py-0.5 rounded-full",
                  active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600",
                ].join(" ")}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}