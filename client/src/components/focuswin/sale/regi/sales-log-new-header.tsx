import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function SalesLogNewHeader({
  onBack,
  onSave,
  onSaveAI,
  isBusy,
  isSaving,
  isCheckingClient,
  isAnalyzing,
}: {
  onBack: () => void;
  onSave: () => void;
  onSaveAI: () => void;
  isBusy: boolean;
  isSaving: boolean;
  isCheckingClient: boolean;
  isAnalyzing: boolean;
}) {
  return (
    <div
      className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 border-b mb-4"
      style={{
        background: "rgba(255,255,255,0.86)",
        borderColor: "rgba(15,23,42,0.08)",
        backdropFilter: "blur(18px)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-slate-50 transition text-slate-700"
            aria-label="뒤로"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
              NEW LOG
            </p>
            <h1 className="text-base sm:text-lg font-black text-slate-900 truncate">
              영업일지 작성
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isBusy}
            onClick={onSave}
            className="px-3 py-2 rounded-2xl text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-60"
          >
            {isSaving || isCheckingClient ? <Loader2 size={16} className="animate-spin" /> : "저장"}
          </button>

          <button
            type="button"
            disabled={isBusy}
            onClick={onSaveAI}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-bold text-white transition disabled:opacity-60"
            style={{
              background: "var(--blueprint-accent)",
              boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
            }}
          >
            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            저장+AI
          </button>
        </div>
      </div>
    </div>
  );
}