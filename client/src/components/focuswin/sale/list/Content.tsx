import { Link } from "wouter";
import { useSaleListViewModel } from "@/hooks/focuswin/sale/useSaleListViewModel";
import SaleListCard from "./ListCard";

type Props = {
  vm: ReturnType<typeof useSaleListViewModel>;
};

export default function SaleListContent({ vm }: Props) {
  return (
    <div className="space-y-2">
      {vm.logs?.map(log => (
        <Link key={log.id} href={`/sale-list/${log.id}`} className="block">
          <SaleListCard log={log} title={log.clientName || "고객사 미지정"} subtitle={log.contactPerson ? `· ${log.contactPerson}` : undefined} description={log.aiSummary || log.rawContent} />
        </Link>
      ))}
    </div>
  );
}
