import { Mic } from "lucide-react";
import UiCard from "../../common/info-card";
import VoiceRecorder from "@/components/VoiceRecorder";

export default function SalesLogNewVoiceCard({
  onTranscribed,
  onAudioUrl,
}: {
  onTranscribed: (text: string) => void;
  onAudioUrl: (url: string) => void;
}) {
  return (
    <UiCard title="음성 입력" desc="현장에서 말로 남기면 자동으로 텍스트로 붙여줘요." icon={Mic}>
      <VoiceRecorder onTranscribed={onTranscribed} onAudioUrl={onAudioUrl} />
    </UiCard>
  );
}