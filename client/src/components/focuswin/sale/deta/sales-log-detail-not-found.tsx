import { AlertCircle, List, Plus } from "lucide-react";

type Props = {
  onGoList: () => void;
  onCreateNew: () => void;
};

export default function SalesLogDetailNotFound({ onGoList, onCreateNew }: Props) {
  return (
    <div className="max-w-md mx-auto py-14">
      <div className="p-6 text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
          <AlertCircle size={20} />
        </div>

        <p className="text-base font-black text-slate-900">영업일지를 찾을 수 없어요</p>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          삭제되었거나 링크가 잘못되었을 수 있어요.
          <br />
          목록으로 돌아가 다시 확인해보세요.
        </p>

        <div className="mt-5 flex gap-2 justify-center">
          <button
            onClick={onGoList}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-white"
            style={{
              background: "linear-gradient(135deg, rgba(37,99,235,1), rgba(99,102,241,1))",
              boxShadow: "0 10px 24px rgba(37,99,235,0.18)",
            }}
          >
            <List size={16} />
            목록으로
          </button>

          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition"
          >
            <Plus size={16} />
            새로 작성
          </button>
        </div>
      </div>
    </div>
  );
}