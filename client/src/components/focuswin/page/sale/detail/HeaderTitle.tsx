import Chip from "@/components/focuswin/common/ui/chip";

type Props = {
  title: string;
  isProcessed: boolean;
}

export function SaleDetailHeaderTitle({
  title, isProcessed,
}: Props) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="truncate">{title}</span>
      {isProcessed ? <Chip tone="violet" label="AI 완료" /> : <Chip label="미분석" />}
    </div>
  )
}