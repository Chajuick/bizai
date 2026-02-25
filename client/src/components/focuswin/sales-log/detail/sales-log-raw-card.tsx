import FwCard from "@/components/focuswin/card";

export default function SalesLogRawCard({ rawContent }: { rawContent: string }) {
  return (
    <FwCard>
      <p className="text-sm font-black text-slate-900 mb-2">원문</p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-600">
        {rawContent}
      </p>
    </FwCard>
  );
}