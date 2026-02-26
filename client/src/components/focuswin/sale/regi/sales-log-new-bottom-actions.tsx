import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/focuswin/common/ui/button";

export default function SalesLogNewBottomActions({
  isBusy,
  isSaving,
  isCheckingClient,
  isAnalyzing,
  onSave,
  onSaveAI,
}: {
  isBusy: boolean;
  isSaving: boolean;
  isCheckingClient: boolean;
  isAnalyzing: boolean;
  onSave: () => void;
  onSaveAI: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:hidden">
      <Button
        type="button"
        disabled={isBusy}
        variant="outline"
        className="rounded-2xl border-slate-200"
        onClick={onSave}
      >
        {isSaving || isCheckingClient ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
        저장만
      </Button>

      <Button
        type="button"
        disabled={isBusy}
        className="rounded-2xl text-white"
        style={{
          background: "var(--blueprint-accent)",
          boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
        }}
        onClick={onSaveAI}
      >
        {isAnalyzing ? (
          <>
            <Loader2 size={16} className="animate-spin mr-2" />
            분석 중…
          </>
        ) : (
          <>
            <Sparkles size={16} className="mr-2" />
            저장+AI
          </>
        )}
      </Button>
    </div>
  );
}