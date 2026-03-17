// client/src/components/focuswin/page/expense/detail/MetaCard.tsx

import { Building2, RefreshCw, Tag, CreditCard, CalendarDays, FileText } from "lucide-react";
import { Card } from "@/components/focuswin/common/ui/card";
import MetaItem from "@/components/focuswin/common/ui/meta-item";
import { formatKRW } from "@/lib/format";

const EXPENSE_TYPE_LABEL: Record<string, string> = {
  receipt: "영수증", invoice: "명세서", contract: "계약서", other: "기타",
};
const PAYM_METH_LABEL: Record<string, string> = {
  card: "카드", cash: "현금", transfer: "계좌이체", other: "기타",
};
const RECUR_LABEL: Record<string, string> = {
  none: "일회성", daily: "매일", weekly: "매주", monthly: "매월", yearly: "매년",
};

type Props = {
  expe_date: string;
  expe_amnt: string | number;
  expe_type: string;
  paym_meth: string;
  recr_type: string;
  ai_categ?: string | null;
  ai_vendor?: string | null;
  clie_name?: string | null;
};

export default function ExpenseMetaCard({
  expe_date, expe_amnt, expe_type, paym_meth, recr_type,
  ai_categ, ai_vendor, clie_name,
}: Props) {
  const dateStr = new Date(expe_date).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <Card>
      <div className="grid grid-cols-2 gap-4">
        <MetaItem icon={CalendarDays} label="지출 일시" value={dateStr} tone="slate" />
        <MetaItem icon={CreditCard} label="금액" value={formatKRW(Number(expe_amnt))} tone="amber" />
        <MetaItem icon={FileText} label="증빙 유형" value={EXPENSE_TYPE_LABEL[expe_type] ?? expe_type} tone="blue" />
        <MetaItem icon={CreditCard} label="결제 방법" value={PAYM_METH_LABEL[paym_meth] ?? paym_meth} tone="slate" />
        {recr_type !== "none" && (
          <MetaItem icon={RefreshCw} label="반복 주기" value={RECUR_LABEL[recr_type] ?? recr_type} tone="sky" />
        )}
        {ai_categ && (
          <MetaItem icon={Tag} label="카테고리" value={ai_categ} tone="violet" />
        )}
        {ai_vendor && (
          <MetaItem icon={Building2} label="판매처" value={ai_vendor} tone="slate" />
        )}
        {clie_name && (
          <MetaItem icon={Building2} label="거래처" value={clie_name} tone="blue" />
        )}
      </div>
    </Card>
  );
}
