export default function UiCard({
  title,
  desc,
  icon: Icon,
  children,
}: {
  title: string;
  desc?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900">{title}</p>
          {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}