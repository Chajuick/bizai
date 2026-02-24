import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onTranscribed: (text: string) => void;
  onAudioUrl?: (url: string) => void;
}

type RecordingState = "idle" | "recording" | "uploading" | "transcribing" | "done";

export default function VoiceRecorder({ onTranscribed, onAudioUrl }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const transcribeMutation = trpc.salesLogs.transcribe.useMutation();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        if (blob.size > 16 * 1024 * 1024) {
          toast.error("파일 크기가 16MB를 초과합니다.");
          setState("idle");
          return;
        }

        setState("uploading");
        try {
          // Upload to S3 via server
          const formData = new FormData();
          formData.append("audio", blob, `recording-${Date.now()}.webm`);

          const uploadRes = await fetch("/api/upload-audio", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) throw new Error("업로드 실패");
          const { url } = await uploadRes.json();
          onAudioUrl?.(url);

          setState("transcribing");
          const result = await transcribeMutation.mutateAsync({ audioUrl: url });
          onTranscribed(result.text);
          setState("done");
          setTimeout(() => setState("idle"), 2000);
        } catch (err) {
          console.error(err);
          toast.error("음성 변환에 실패했습니다.");
          setState("idle");
        }
      };

      mediaRecorder.start(1000);
      setState("recording");
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      toast.error("마이크 접근 권한이 필요합니다.");
    }
  }, [onTranscribed, onAudioUrl, transcribeMutation]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  }, []);

  const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3">
      {state === "idle" && (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
          style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}
        >
          <Mic size={16} />
          음성 녹음
        </button>
      )}

      {state === "recording" && (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
        >
          <div className="recording-pulse">
            <MicOff size={16} />
          </div>
          <div className="flex items-end gap-0.5 h-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="waveform-bar w-1 rounded-full" style={{ background: '#f87171', minHeight: '4px' }} />
            ))}
          </div>
          <span className="font-mono">{formatDuration(duration)}</span>
          <span>중지</span>
        </button>
      )}

      {(state === "uploading" || state === "transcribing") && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}>
          <Loader2 size={16} className="animate-spin" />
          {state === "uploading" ? "업로드 중..." : "AI 변환 중..."}
        </div>
      )}

      {state === "done" && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
          <CheckCircle size={16} />
          변환 완료
        </div>
      )}
    </div>
  );
}
