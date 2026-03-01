import { useRef } from "react";
import { Mic, UploadCloud, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import UiCard from "../../common/info-card";
import VoiceRecorder from "@/components/VoiceRecorder";
import type { FileUploadState } from "@/hooks/focuswin/sale/useSaleRegiViewModel";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function SalesLogNewVoiceCard({
  onTranscribed,
  onAudioUrl,
  onFileSelected,
  fileUploadState,
  fileUploadError,
  onResetFileUpload,
}: {
  onTranscribed: (text: string) => void;
  onAudioUrl: (url: string) => void;
  onFileSelected: (file: File) => void;
  fileUploadState: FileUploadState;
  fileUploadError?: string | null;
  onResetFileUpload: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const isProcessing = fileUploadState === "uploading" || fileUploadState === "transcribing";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("파일 크기가 50MB를 초과합니다.");
      e.target.value = "";
      return;
    }
    onFileSelected(file);
    e.target.value = "";
  };

  const handleClick = () => {
    if (fileUploadState === "error") onResetFileUpload();
    inputRef.current?.click();
  };

  return (
    <UiCard title="음성 입력" desc="음성 녹음 또는 파일 첨부로 텍스트를 추출합니다." icon={Mic}>
      <VoiceRecorder onTranscribed={onTranscribed} onAudioUrl={onAudioUrl} />

      {/* 구분선 */}
      <div className="flex items-center gap-2 my-3">
        <div className="flex-1 border-t border-slate-700/40" />
        <span className="text-xs text-slate-500">또는</span>
        <div className="flex-1 border-t border-slate-700/40" />
      </div>

      {/* 파일 업로드 */}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.m4a,.mp3,.wav,.webm,.ogg,.flac,.aac"
          className="hidden"
          onChange={handleFileChange}
          disabled={isProcessing}
        />

        <div className="flex items-center gap-3">
          {(fileUploadState === "idle" || fileUploadState === "error") && (
            <button
              type="button"
              onClick={handleClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#818cf8",
              }}
            >
              <UploadCloud size={15} />
              {fileUploadState === "error" ? "다시 시도" : "음성 파일 첨부 (최대 50MB)"}
            </button>
          )}

          {isProcessing && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
              style={{
                background: "rgba(251,191,36,0.1)",
                border: "1px solid rgba(251,191,36,0.2)",
                color: "#fbbf24",
              }}
            >
              <Loader2 size={15} className="animate-spin" />
              {fileUploadState === "uploading" ? "업로드 중..." : "음성 전사 중..."}
            </div>
          )}

          {fileUploadState === "done" && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
              style={{
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.2)",
                color: "#34d399",
              }}
            >
              <CheckCircle size={15} />
              전사 완료
            </div>
          )}

          {fileUploadState === "error" && fileUploadError && (
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <XCircle size={13} />
              <span className="truncate max-w-[200px]">{fileUploadError}</span>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500 mt-2">지원 형식: MP3, M4A, WAV, WEBM, OGG, FLAC, AAC</p>
      </div>
    </UiCard>
  );
}
