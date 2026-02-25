import { Building2 } from "lucide-react";

export default function PreSaveClientModal({
  typedName,
  matchedName,
  onConfirm,
  onDeny,
}: {
  typedName: string;
  matchedName: string;
  onConfirm: () => void;
  onDeny: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-[0_24px_64px_rgba(15,23,42,0.18)] p-5">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 mb-4">
          <Building2 size={22} />
        </div>
        <p className="text-[11px] font-extrabold tracking-[0.16em] text-slate-400 uppercase mb-1">
          고객사 확인
        </p>
        <p className="text-base font-black text-slate-900 leading-snug mb-3">
          혹시 고객사에 등록된
          <br />
          <span className="text-blue-700">'{matchedName}'</span>을(를) 말씀하시는 건가요?
        </p>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 mb-4 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-16 shrink-0">입력한 이름</span>
            <span className="font-semibold text-slate-700">{typedName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 w-16 shrink-0">등록된 고객사</span>
            <span className="font-black text-blue-700">{matchedName}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full py-2.5 rounded-2xl text-sm font-bold text-white transition"
            style={{
              background: "var(--blueprint-accent)",
              boxShadow: "0 8px 20px rgba(37,99,235,0.20)",
            }}
          >
            맞아요, '{matchedName}'으로 연결
          </button>

          <button
            onClick={onDeny}
            className="w-full py-2.5 rounded-2xl text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-700"
          >
            아니에요, '{typedName}'으로 신규 등록
          </button>
        </div>
      </div>
    </div>
  );
}