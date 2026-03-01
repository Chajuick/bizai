import { useCallback, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Loader2, CheckCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type RecordingState =
  | "idle"
  | "recording"
  | "uploading"
  | "confirming"
  | "transcribing"
  | "done";

interface VoiceRecorderProps {
  onTranscribed: (text: string) => void;

  // ✅ 저장 시점에 attachments로 묶기 위해 file_idno를 부모가 들고 있게 하자
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
  const uploadingAbortRef = useRef<AbortController | null>(null);

  // tRPC mutations
  const prepareUpload = trpc.crm.files.prepareUpload.useMutation();
  const confirmUpload = trpc.crm.files.confirmUpload.useMutation();
  const transcribeFile = trpc.crm.files.transcribeFile.useMutation();

  const busy = state !== "idle" && state !== "done";

  const cleanupRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setDuration(0);
  }, []);

  const uploadAndTranscribe = useCallback(
    async (blob: Blob, mimeType: string) => {
      if (blob.size > maxBytes) {
        toast.error(`파일 크기가 ${(maxBytes / (1024 * 1024)).toFixed(0)}MB를 초과합니다.`);
        setState("idle");
        return;
      }

      // 1) prepareUpload (서버가 file_path + presigned upload_url 발급)
      setState("uploading");
      const fileName = `sale-audio-${Date.now()}.webm`; // mime에 맞춰 확장자 바꿀 수도 있음
      let prep;
      try {
        prep = await prepareUpload.mutateAsync({
          file_name: fileName,
          mime_type: mimeType,
        });
      } catch (e) {
        console.error(e);
        toast.error("업로드 준비에 실패했습니다.");
        setState("idle");
        return;
      }

      // 2) PUT to R2 presigned URL
      try {
        uploadingAbortRef.current = new AbortController();

        const putRes = await fetch(prep.upload_url, {
          method: "PUT",
          body: blob,
          headers: {
            "Content-Type": mimeType,
          },
          signal: uploadingAbortRef.current.signal,
        });

        if (!putRes.ok) {
          const t = await putRes.text().catch(() => "");
          console.error("PUT failed:", putRes.status, t);
          toast.error("스토리지 업로드에 실패했습니다. (CORS/권한 확인)");
          setState("idle");
          return;
        }
      } catch (e) {
        console.error(e);
        toast.error("스토리지 업로드 요청이 실패했습니다. (CORS/네트워크)");
        setState("idle");
        return;
      } finally {
        uploadingAbortRef.current = null;
      }

      // 3) confirmUpload (DB에 CORE_FILE row 생성)
      setState("confirming");
      let confirmed;
      try {
        confirmed = await confirmUpload.mutateAsync({
          file_path: prep.file_path,
          file_name: fileName,
          mime_type: mimeType,
          file_size: blob.size,
          // ✅ 저장 전 sale_idno 없으니 ref는 절대 보내지 않는다
        });
      } catch (e) {
        console.error(e);
        toast.error("업로드 확정(메타 저장)에 실패했습니다.");
        setState("idle");
        return;
      }

      const fileId = confirmed.file_idno;
      onUploadedFileId?.(fileId);

      // 4) transcribeFile (자동 전사)
      setState("transcribing");
      try {
        const tx = await transcribeFile.mutateAsync({ file_idno: fileId });
        onTranscribed(tx.text);
        setState("done");
        setTimeout(() => setState("idle"), 1200);
      } catch (e) {
        console.error(e);
        toast.error("음성 전사에 실패했습니다. (STT 설정/키 확인)");
        setState("idle");
      }
    },
    [maxBytes, prepareUpload, confirmUpload, transcribeFile, onTranscribed, onUploadedFileId]
  );

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
        await uploadAndTranscribe(blob, "audio/webm"); // 서버/스토리지 content-type은 단순화
      };

      mr.start(1000);
      setState("recording");
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (e) {
      console.error(e);
      toast.error("마이크 접근 권한이 필요합니다.");
    }
  }, [cleanupRecording, uploadAndTranscribe]);

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
        toast.error("오디오 파일만 업로드할 수 있습니다.");
        return;
      }

      await uploadAndTranscribe(file, file.type || "audio/webm");
    },
    [uploadAndTranscribe]
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
              background: "rgba(148,163,184,0.12)",
              border: "1px solid rgba(148,163,184,0.25)",
              color: "#94a3b8",
            }}
          >
            <Upload size={16} />
            음성 파일 첨부
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
              <div key={i} className="waveform-bar w-1 rounded-full" style={{ background: "#f87171", minHeight: "4px" }} />
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
              uploadingAbortRef.current?.abort();
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

      {/* 에러 디버깅용: mutation error 출력(원하면 제거) */}
      {prepareUpload.error && <span className="text-xs text-red-500">prepareUpload 실패</span>}
      {confirmUpload.error && <span className="text-xs text-red-500">confirmUpload 실패</span>}
      {transcribeFile.error && <span className="text-xs text-red-500">transcribeFile 실패</span>}
    </div>
  );
}