import { Card } from "../../common/ui/card";

export default function SalesLogRawCard({ rawContent }: { rawContent: string }) {
  return (
    <Card>
      <p className="text-sm font-black text-slate-900 mb-2">원문</p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-600">
        {rawContent}
      </p>
    </Card>
  );
}