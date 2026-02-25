import { Plus, ShoppingCart } from "lucide-react";

export default function OrdersEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-14">
      <div className="mx-auto w-14 h-14 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center">
        <ShoppingCart size={26} className="text-blue-600" />
      </div>
      <p className="mt-4 text-base font-black text-slate-900">수주가 없습니다</p>
      <p className="mt-1 text-sm text-slate-500">
        일정에서 수주를 생성하거나, “수주 등록”으로 직접 추가할 수 있어요.
      </p>
      <div className="mt-5 flex justify-center">
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
          style={{ background: "rgb(37, 99, 235)" }}
        >
          <Plus size={16} />
          수주 등록하기
        </button>
      </div>
    </div>
  );
}