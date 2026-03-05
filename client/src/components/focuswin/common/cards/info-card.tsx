import * as React from "react";
import { Card, CardHeader, CardContent } from "@/components/focuswin/common/ui/card";
import { cn } from "@/lib/utils";

type InfoCardProps = {
  title: string;
  desc?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;

  iconClassName?: string;
};

export default function InfoCard({ title, desc, icon: Icon, children, className, iconClassName }: InfoCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex gap-3">
          <div className={cn("w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100", "flex items-center justify-center text-blue-700 shrink-0", iconClassName)}>
            <Icon size={18} />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900">{title}</p>
            {desc ? <p className="text-xs text-slate-500 mt-0.5">{desc}</p> : null}
          </div>
        </div>
      </CardHeader>

      <CardContent>{children}</CardContent>
    </Card>
  );
}
