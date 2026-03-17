import { cn } from "@/lib/utils";

export default function PageShell({
  children,
  className,
  outerClassName,
  size = "md",
}: {
  children: React.ReactNode;
  className?: string;
  outerClassName?: string;
  size?: "sm" | "md" | "lg" | "full";
}) {
  const maxW =
    size === "sm"
      ? "lg:max-w-2xl"
      : size === "lg"
      ? "lg:max-w-5xl"
      : size === "full"
      ? "lg:max-w-none"
      : "lg:max-w-3xl";

  return (
    <div
      className={cn(
        "mx-auto w-full px-0 lg:px-6 py-0 lg:py-2",
        "h-full min-h-0",
        maxW,
        outerClassName
      )}
    >
      <div
        className={cn(
          "bg-white p-4 lg:p-6",
          "rounded-none shadow-none",
          "lg:rounded-2xl lg:shadow-[0_6px_24px_rgba(0,0,0,0.04)]",
          "h-full min-h-0",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}