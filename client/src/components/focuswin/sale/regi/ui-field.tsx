import { Label } from "@/components/ui/label";

export default function UiField({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-slate-500 mt-1.5">{hint}</p>}
    </div>
  );
}