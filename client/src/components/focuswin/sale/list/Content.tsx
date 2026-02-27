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
        <Link key={log.sale_idno} href={`/sale-list/${log.sale_idno}`} className="block">
          <SaleListCard log={log} title={log.clie_name || "고객사 미지정"} subtitle={log.cont_name ? `· ${log.cont_name}` : undefined} description={log.aiex_summ || log.orig_memo} />
        </Link>
      ))}
    </div>
  );
}
