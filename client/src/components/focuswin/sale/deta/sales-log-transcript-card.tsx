import { Card } from "../../common/ui/card";

export default function SalesLogTranscriptCard({ transcribedText }: { transcribedText: string }) {
  return (
    <Card className="border-sky-100 bg-gradient-to-b from-sky-50/60 to-white">
      <p className="text-sm font-black text-slate-900 mb-2">음성 전사</p>
      <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
        {transcribedText}
      </p>
    </Card>
  );
}