import { useCallback, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Loader2, CheckCircle, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { useVoiceUploadTranscribe } from "@/hooks/focuswin/files/useVoiceUploadTranscribe";

type RecordingState = "idle" | "recording" | "uploading" | "confirming" | "transcribing" | "done";

interface VoiceRecorderProps {
  onTranscribed: (text: string) => void;

  // 저장 시점에 attachments로 묶기 위해 file_idno를 부모가 들고 있게 하자
  onUploadedFileId?: (fileId: number) => void;

  // 옵션: 파일 크기 제한
  maxBytes?: number; // default 16MB
}

function formatDuration(s: number) {
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function VoiceRecorder({
  onTranscribed,
  onUploadedFileId,
  maxBytes = 16 * 1024 * 1024,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { uploadAndTranscribe, abort } = useVoiceUploadTranscribe();

  const cleanupRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setDuration(0);
  }, []);

  // 녹음 시작
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // mimeType: 브라우저 지원 체크 (webm 우선)
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanupRecording();

        await uploadAndTranscribe({
          blob,
          mimeType, // ✅ 고정 "audio/webm"이 아니라 실제 mimeType 전달
          fileName: `sale-audio-${Date.now()}.webm`,
          maxBytes,
          onUploadedFileId,
          onTranscribed,
          onState: (s) => setState(s),
          onFinally: () => {
            // done 상태는 잠깐 보여주고 idle로 복귀
            setTimeout(() => setState("idle"), 1200);
          },
        });
      };

      mr.start(1000);
      setState("recording");
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (e) {
      // 브라우저/디바이스 에러 — getUserMedia 권한 거부, MediaRecorder 미지원 등
      // tRPC 외부이므로 직접 toast 처리
      const msg =
        e instanceof Error && e.name === "NotAllowedError"
          ? "마이크 접근 권한이 필요합니다."
          : "마이크를 사용할 수 없습니다. 브라우저 설정을 확인해 주세요.";
      toast.error(msg);
    }
  }, [cleanupRecording, uploadAndTranscribe, maxBytes, onUploadedFileId, onTranscribed]);

  // 녹음 중지
  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    mediaRecorderRef.current?.stop();
  }, []);

  // 파일 업로드(첨부) 핸들러
  const onPickFile = useCallback(
    async (file: File | null) => {
      if (!file) return;

      // 타입 제한(원하면 더 엄격히)
      if (!file.type.startsWith("audio/") && file.type !== "video/webm") {
        // 파일 형식 검증 — 브라우저에서만 알 수 있으므로 직접 처리
        toast.error("오디오 파일만 업로드할 수 있습니다.");
        return;
      }

      await uploadAndTranscribe({
        blob: file,
        mimeType: file.type || "audio/webm",
        fileName: file.name || `sale-audio-${Date.now()}.webm`,
        maxBytes,
        onUploadedFileId,
        onTranscribed,
        onState: (s) => setState(s),
        onFinally: () => {
          setTimeout(() => setState("idle"), 1200);
        },
      });
    },
    [uploadAndTranscribe, maxBytes, onUploadedFileId, onTranscribed]
  );

  const label = useMemo(() => {
    if (state === "uploading") return "업로드 중...";
    if (state === "confirming") return "등록 중...";
    if (state === "transcribing") return "텍스트 변환 중...";
    if (state === "done") return "완료";
    return "";
  }, [state]);

  return (
    <div className="flex items-center gap-3">
      {state === "idle" && (
        <>
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
            style={{
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.3)",
              color: "#60a5fa",
            }}
          >
            <Mic size={16} />
            음성 녹음
          </button>

          <label
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:scale-105"
            style={{
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.3)",
              color: "#818cf8",
            }}
          >
            <UploadCloud size={15} />
            음성 파일 첨부 (최대 {(maxBytes / (1024 * 1024)).toFixed(0)}MB)
            <input
              type="file"
              accept="audio/*,video/webm"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </>
      )}

      {state === "recording" && (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171",
          }}
        >
          <div className="recording-pulse">
            <MicOff size={16} />
          </div>
          <div className="flex items-end gap-0.5 h-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="waveform-bar w-1 rounded-full"
                style={{ background: "#f87171", minHeight: "4px" }}
              />
            ))}
          </div>
          <span className="font-mono">{formatDuration(duration)}</span>
          <span>중지</span>
        </button>
      )}

      {(state === "uploading" || state === "confirming" || state === "transcribing") && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm"
          style={{
            background: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.2)",
            color: "#fbbf24",
          }}
        >
          <Loader2 size={16} className="animate-spin" />
          {label}
          <button
            type="button"
            className="ml-2 text-xs opacity-80 hover:opacity-100"
            onClick={() => {
              abort();
              toast.message("작업을 취소했습니다.");
              setState("idle");
              cleanupRecording();
            }}
          >
            취소
          </button>
        </div>
      )}

      {state === "done" && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm"
          style={{
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.2)",
            color: "#34d399",
          }}
        >
          <CheckCircle size={16} />
          변환 완료
        </div>
      )}

    </div>
  );
}