import { Building2 } from "lucide-react";
import ChoiceDialog from "@/components/focuswin/common/choice-dialog";

export default function SaleRegiPreSaveClientDialog({
  open,
  typedName,
  matchedName,
  onConfirm,
  onDeny,
}: {
  open: boolean;
  typedName: string | undefined;
  matchedName: string | undefined;
  onConfirm: () => Promise<void> | void;
  onDeny: () => Promise<void> | void;
}) {
  if (!open) return null;

  const typed = typedName?.trim() || "(미입력)";
  const matched = matchedName?.trim() || "(미확인)";

  return (
    <ChoiceDialog
      open
      onOpenChange={() => {}}
      requireChoice
      kicker="고객사 확인"
      title={
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <Building2 size={22} />
          </div>

          <div className="min-w-0">
            <p className="text-base font-black text-slate-900 leading-snug">
              혹시 고객사에 등록된{" "}
              <span
                className="text-blue-700 inline-block max-w-[18rem] align-bottom truncate"
                title={matched}
              >
                ‘{matched}’
              </span>
              을(를) 말씀하시는 건가요?
            </p>
          </div>
        </div>
      }
      body={
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-slate-400 w-20 shrink-0">입력한 이름</span>
            <span className="min-w-0 flex-1 font-semibold text-slate-700 truncate" title={typed}>
              {typed}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-slate-400 w-20 shrink-0">등록된 고객사</span>
            <span className="min-w-0 flex-1 font-black text-blue-700 truncate" title={matched}>
              {matched}
            </span>
          </div>
        </div>
      }
      primary={{
        label: (
          <div className="flex flex-col items-center leading-tight gap-1">
            <span>맞아요, 연결할게요</span>
            <span className="text-[11px] opacity-90 truncate max-w-full px-2" title={matched}>
              연결: {matched}
            </span>
          </div>
        ),
        onClick: onConfirm,
      }}
      secondary={{
        label: (
          <div className="flex flex-col items-center leading-tight gap-1">
            <span>아니에요, 새로 등록할게요</span>
            <span className="text-[11px] text-slate-500 truncate max-w-full px-2" title={typed}>
              신규: {typed}
            </span>
          </div>
        ),
        onClick: onDeny,
      }}
    />
  );
}