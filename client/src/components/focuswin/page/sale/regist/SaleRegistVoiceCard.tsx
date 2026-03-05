import { Mic } from "lucide-react";
import UiCard from "@/components/focuswin/common/cards/info-card";
import VoiceRecorder from "@/components/focuswin/app/media/voice-recorder";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function SaleRegistVoiceCard({
  onTranscribed,
  onUploadedFileId,
}: {
  onTranscribed: (text: string) => void;
  onUploadedFileId: (fileId: number) => void;
}) {
  return (
    <UiCard title="음성 입력" desc="음성 녹음 또는 파일 첨부로 텍스트를 추출합니다." icon={Mic}>
      <VoiceRecorder
        onTranscribed={onTranscribed}
        onUploadedFileId={onUploadedFileId}
        maxBytes={MAX_FILE_SIZE}
      />

      <div className="pt-2">
        <p className="text-xs text-slate-500 mt-2">지원 형식: MP3, M4A, WAV, WEBM, OGG, FLAC, AAC</p>
      </div>
    </UiCard>
  );
}