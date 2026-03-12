import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Loader2, CheckCircle, UploadCloud, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useVoiceUploadTranscribe } from "@/hooks/focuswin/files/useVoiceUploadTranscribe";

type RecordingState =
  | "idle"
  | "recording"
  | "stopping"
  | "uploading"
  | "confirming"
  | "transcribing"
  | "done";

interface VoiceRecorderProps {
  onTranscribed: (text: string) => void;
  onUploadedFileId?: (fileId: number) => void;
  maxBytes?: number;
}

type MicPermissionState = "granted" | "prompt" | "denied" | "unknown";

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
  const [permissionState, setPermissionState] = useState<MicPermissionState>("unknown");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const ensureMicrophonePermission = useCallback(async (): Promise<MicPermissionState> => {
    try {
      if (!("permissions" in navigator) || !navigator.permissions?.query) {
        return "unknown";
      }

      const result = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      return result.state;
    } catch {
      return "unknown";
    }
  }, []);

  const refreshPermissionState = useCallback(async () => {
    const permission = await ensureMicrophonePermission();
    setPermissionState(permission);
    return permission;
  }, [ensureMicrophonePermission]);

  const checkBrowserSupport = useCallback(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("이 브라우저에서는 마이크 녹음을 지원하지 않습니다.", {
        description: "Chrome, Edge 같은 최신 브라우저에서 다시 시도해 주세요.",
        duration: 5000,
      });
      return false;
    }

    if (typeof MediaRecorder === "undefined") {
      toast.error("이 브라우저에서는 녹음 기능을 지원하지 않습니다.", {
        description: "최신 Chrome 또는 Edge 환경을 권장합니다.",
        duration: 5000,
      });
      return false;
    }

    return true;
  }, []);

  const resolveMimeType = useCallback(() => {
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
      return "audio/webm;codecs=opus";
    }
    if (MediaRecorder.isTypeSupported("audio/webm")) {
      return "audio/webm";
    }
    if (MediaRecorder.isTypeSupported("audio/mp4")) {
      return "audio/mp4";
    }
    return "";
  }, []);

  const requestMicrophonePermission = useCallback(async () => {
    if (!checkBrowserSupport()) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());

      setPermissionState("granted");
      toast.success("마이크 권한이 확인되었습니다.", {
        description: "이제 음성 녹음을 시작할 수 있어요.",
        duration: 3000,
      });
    } catch (e) {
      const latest = await refreshPermissionState();

      if (e instanceof DOMException) {
        if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
          toast.error("마이크 접근이 거부되었습니다.", {
            description:
              latest === "denied"
                ? "브라우저 주소창의 권한 설정과 운영체제의 마이크 권한을 모두 확인해 주세요."
                : "권한 요청이 취소되었거나 시스템 마이크 접근이 막혀 있을 수 있습니다.",
            duration: 6000,
          });
          return;
        }

        if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
          toast.error("사용 가능한 마이크를 찾을 수 없습니다.", {
            description: "마이크 연결 상태와 기본 입력 장치를 확인해 주세요.",
            duration: 5000,
          });
          return;
        }

        if (e.name === "NotReadableError" || e.name === "TrackStartError") {
          toast.error("마이크를 사용할 수 없습니다.", {
            description: "다른 앱이나 다른 브라우저 탭에서 마이크를 사용 중인지 확인해 주세요.",
            duration: 5000,
          });
          return;
        }

        if (e.name === "SecurityError") {
          toast.error("보안 설정 때문에 마이크를 열 수 없습니다.", {
            description: "브라우저 정책, iframe 설정, localhost/HTTPS 환경을 확인해 주세요.",
            duration: 5000,
          });
          return;
        }
      }

      toast.error("마이크 권한을 확인할 수 없습니다.", {
        description: "브라우저 및 운영체제 마이크 설정을 다시 확인해 주세요.",
        duration: 5000,
      });
    }
  }, [checkBrowserSupport, refreshPermissionState]);

  const startRecording = useCallback(async () => {
    if (!checkBrowserSupport()) return;

    try {
      const permission = await refreshPermissionState();

      if (permission === "denied") {
        toast.error("마이크 권한이 차단되어 있습니다.", {
          description: "브라우저 주소창의 권한 설정과 운영체제의 마이크 권한을 모두 확인해 주세요.",
          duration: 6000,
        });
        return;
      }

      const mimeType = resolveMimeType();
      if (!mimeType) {
        toast.error("지원되는 녹음 형식을 찾지 못했습니다.", {
          description: "최신 Chrome 또는 Edge 환경에서 다시 시도해 주세요.",
          duration: 5000,
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

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
          mimeType,
          fileName: `sale-audio-${Date.now()}.webm`,
          maxBytes,
          onUploadedFileId,
          onTranscribed,
          onState: (s) => setState(s),
          onFinally: () => {
            setTimeout(() => setState("idle"), 1200);
          },
        });
      };

      mr.start(1000);
      setState("recording");
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (e) {
      const latest = await refreshPermissionState();

      if (e instanceof DOMException) {
        if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
          toast.error("마이크 접근이 거부되었습니다.", {
            description:
              latest === "denied"
                ? "사이트 권한이 차단되어 있습니다. 주소창의 권한 설정을 확인해 주세요."
                : "사이트 권한뿐 아니라 Windows/macOS의 시스템 마이크 권한도 함께 확인해 주세요.",
            duration: 6000,
          });
          return;
        }

        if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
          toast.error("사용 가능한 마이크를 찾을 수 없습니다.", {
            description: "마이크 연결 상태와 기본 입력 장치를 확인해 주세요.",
            duration: 5000,
          });
          return;
        }

        if (e.name === "NotReadableError" || e.name === "TrackStartError") {
          toast.error("마이크를 사용할 수 없습니다.", {
            description: "다른 앱이나 다른 브라우저 탭에서 마이크를 사용 중인지 확인해 주세요.",
            duration: 5000,
          });
          return;
        }

        if (e.name === "SecurityError") {
          toast.error("보안 설정 때문에 마이크를 열 수 없습니다.", {
            description: "iframe 사용 여부, 브라우저 정책, HTTPS/localhost 환경을 확인해 주세요.",
            duration: 5000,
          });
          return;
        }
      }

      toast.error("마이크를 시작할 수 없습니다.", {
        description: "권한, 장치 연결, 브라우저 환경을 다시 확인해 주세요.",
        duration: 5000,
      });
    }
  }, [
    checkBrowserSupport,
    cleanupRecording,
    maxBytes,
    onTranscribed,
    onUploadedFileId,
    refreshPermissionState,
    resolveMimeType,
    uploadAndTranscribe,
  ]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    setState("stopping");
    mediaRecorderRef.current?.stop();
  }, []);

  const onPickFile = useCallback(
    async (file: File | null) => {
      if (!file) return;

      if (!file.type.startsWith("audio/") && file.type !== "video/webm") {
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
    if (state === "stopping") return "녹음 정리 중...";
    if (state === "uploading") return "1/3 업로드 중...";
    if (state === "confirming") return "2/3 등록 중...";
    if (state === "transcribing") return "3/3 텍스트 변환 중...";
    if (state === "done") return "본문에 반영 완료";
    return "";
  }, [state]);

  const permissionHint = useMemo(() => {
    if (permissionState === "granted") return "마이크 권한이 허용되어 있어요.";
    if (permissionState === "prompt") return "처음 사용 시 브라우저 마이크 권한 허용이 필요해요.";
    if (permissionState === "denied") return "마이크 권한이 차단되어 있어요. 주소창 권한 설정을 확인해 주세요.";
    return "브라우저와 운영체제의 마이크 설정이 필요할 수 있어요.";
  }, [permissionState]);

  useEffect(() => {
    refreshPermissionState();
  }, [refreshPermissionState]);

  useEffect(() => {
    return () => {
      abort();
      cleanupRecording();
    };
  }, [abort, cleanupRecording]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {state === "idle" && (
          <>
            <button
              type="button"
              onClick={startRecording}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:scale-[1.02]"
              style={{
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#818cf8",
              }}
            >
              <UploadCloud size={15} />
              음성 파일 첨부 (최대 {(maxBytes / (1024 * 1024)).toFixed(0)}MB)
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/webm"
                className="hidden"
                onChange={async (e) => {
                  await onPickFile(e.target.files?.[0] ?? null);
                  e.currentTarget.value = "";
                }}
              />
            </label>

            <button
              type="button"
              onClick={requestMicrophonePermission}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
              style={{
                background: "rgba(16,185,129,0.10)",
                border: "1px solid rgba(16,185,129,0.22)",
                color: "#10b981",
              }}
            >
              <ShieldCheck size={16} />
              권한 확인
            </button>
          </>
        )}

        {state === "recording" && (
          <button
            type="button"
            onClick={stopRecording}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium"
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

        {(state === "stopping" ||
          state === "uploading" ||
          state === "confirming" ||
          state === "transcribing") && (
          <div
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm"
            style={{
              background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.2)",
              color: "#fbbf24",
            }}
          >
            <Loader2 size={16} className="animate-spin" />
            {label}
            {state !== "stopping" && (
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
            )}
          </div>
        )}

        {state === "done" && (
          <div
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm"
            style={{
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.2)",
              color: "#34d399",
            }}
          >
            <CheckCircle size={16} />
            {label}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">{permissionHint}</p>
    </div>
  );
}