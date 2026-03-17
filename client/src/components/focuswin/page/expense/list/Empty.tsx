import { Receipt } from "lucide-react";
import { Button } from "@/components/focuswin/common/ui/button";

export default function ExpenseListEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-100 flex items-center justify-center">
        <Receipt size={28} className="text-orange-500" />
      </div>
      <div className="text-center">
        <p className="text-base font-black text-slate-900">지출 내역이 없어요</p>
        <p className="mt-1 text-sm text-slate-500">영수증이나 비용을 등록하면 여기에 표시됩니다.</p>
      </div>
      <Button size="sm" onClick={onAdd}>
        <Receipt size={14} className="mr-1.5" />
        지출 추가
      </Button>
    </div>
  );
}
