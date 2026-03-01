export default function SalesLogDetailLoading() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-slate-100 bg-white p-4 animate-pulse"
          style={{ boxShadow: "0 12px 32px rgba(15,23,42,0.05)" }}
        >
          <div className="h-4 w-40 bg-slate-100 rounded mb-3" />
          <div className="h-3 w-full bg-slate-100 rounded mb-2" />
          <div className="h-3 w-2/3 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
}