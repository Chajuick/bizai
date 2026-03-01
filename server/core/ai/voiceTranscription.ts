/**
 * Voice transcription helper using internal Speech-to-Text service (Whisper-compatible)
 *
 * ✅ Improvements vs original
 * - SSRF mitigation (allowlist + https-only + private/localhost block)
 * - Request timeouts via AbortController (download + STT call)
 * - Runtime guards for FormData/Blob (Node environments)
 * - Safer defaults (mime/ext fallback, model fallback)
 * - Better errors + small normalization
 *
 * Note: This module does NOT touch DB directly.
 */
import { ENV } from "../env/env";

export type TranscribeOptions = {
  audioUrl: string; // URL to the audio file (e.g., S3 URL)
  language?: string; // Optional: specify language code (e.g., "en", "es", "zh")
  prompt?: string; // Optional: custom prompt for the transcription
};

export type WhisperSegment = {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
};

export type WhisperResponse = {
  task: "transcribe";
  language: string;
  duration: number;
  text: string;
  segments: WhisperSegment[];
};

export type TranscriptionResponse = WhisperResponse;

export type TranscriptionError = {
  error: string;
  code:
  | "FILE_TOO_LARGE"
  | "INVALID_FORMAT"
  | "TRANSCRIPTION_FAILED"
  | "UPLOAD_FAILED"
  | "SERVICE_ERROR";
  details?: string;
};

// ===== Security / policy knobs =====

// 최대 다운로드 허용 사이즈(바이트). Whisper 호환 API가 보통 25MB 제한이지만,
// 너 원 코드 기준 16MB로 유지.
const MAX_AUDIO_BYTES = 16 * 1024 * 1024;

// URL 다운로드 / STT 호출 타임아웃(ms)
const DOWNLOAD_TIMEOUT_MS = 20_000;
const TRANSCRIBE_TIMEOUT_MS = 60_000;

// ✅ 허용 도메인(SSRF 방지). 운영에서 꼭 세팅 권장.
// 예: "s3.amazonaws.com,cdn.example.com,focuswin.iptime.org"
function getAllowedAudioHosts(): Set<string> {
  const raw = ENV.allowedAudioHosts ?? ""; // env.ts에 없으면 ""로 동작 (아래에서 strict mode 처리)
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

// 허용 호스트가 비어있을 때 정책
// - true: allowlist 비어있으면 전부 거부(보안 우선)
// - false: allowlist 비어있으면 전부 허용(개발 편의)
const STRICT_ALLOWLIST = ENV.isProduction;

// ===== Helpers =====

const resolveSttApiUrl = () => {
  const base = ENV.sttApiUrl;
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/audio/transcriptions`;
};

const resolveSttApiKey = () => ENV.sttApiKey || "";

function isPrivateOrLocalHostname(hostname: string) {
  const h = hostname.toLowerCase();

  // localhost 계열
  if (h === "localhost" || h.endsWith(".localhost")) return true;

  // loopback / link-local / metadata 등 흔한 SSRF 타깃
  if (h === "127.0.0.1" || h === "::1") return true;
  if (h === "0.0.0.0") return true;
  if (h === "169.254.169.254") return true; // AWS metadata
  if (h.startsWith("169.254.")) return true;

  // 사설 IP(IPv4) 직접 입력 방어(간단 버전)
  // 10.0.0.0/8
  if (h.startsWith("10.")) return true;
  // 192.168.0.0/16
  if (h.startsWith("192.168.")) return true;
  // 172.16.0.0/12
  if (h.startsWith("172.")) {
    const second = Number(h.split(".")[1] ?? NaN);
    if (!Number.isNaN(second) && second >= 16 && second <= 31) return true;
  }

  return false;
}

function validateAudioUrl(audioUrl: string): { ok: true; url: URL } | { ok: false; err: TranscriptionError } {
  let url: URL;
  try {
    url = new URL(audioUrl);
  } catch {
    return {
      ok: false,
      err: { error: "Invalid audioUrl", code: "INVALID_FORMAT", details: "audioUrl이 올바른 URL 형식이 아닙니다." },
    };
  }

  // 운영 환경이면 https만 허용
  if (ENV.isProduction && url.protocol !== "https:") {
    return {
      ok: false,
      err: {
        error: "Invalid audio URL protocol",
        code: "INVALID_FORMAT",
        details: "운영에서는 https URL만 허용됩니다.",
      },
    };
  }

  if (isPrivateOrLocalHostname(url.hostname)) {
    return {
      ok: false,
      err: {
        error: "Blocked audio URL host",
        code: "INVALID_FORMAT",
        details: "로컬/사설망/메타데이터 주소는 보안상 차단됩니다.",
      },
    };
  }

  const allowedHosts = getAllowedAudioHosts();
  if (allowedHosts.size > 0) {
    if (!allowedHosts.has(url.hostname.toLowerCase())) {
      return {
        ok: false,
        err: {
          error: "Audio URL host not allowed",
          code: "INVALID_FORMAT",
          details: `허용되지 않은 호스트입니다: ${url.hostname}`,
        },
      };
    }
  } else if (STRICT_ALLOWLIST) {
    return {
      ok: false,
      err: {
        error: "Audio URL allowlist is not configured",
        code: "SERVICE_ERROR",
        details: "운영 환경에서는 ALLOWED_AUDIO_HOSTS(콤마 구분) 설정이 필요합니다.",
      },
    };
  }

  return { ok: true, url };
}

function abortAfter(ms: number) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  return { ac, clear: () => clearTimeout(t) };
}

function normalizeMimeType(ct: string | null): string {
  const mime = (ct || "").split(";")[0].trim().toLowerCase();
  if (!mime) return "audio/webm";
  // Express가 .webm을 video/webm으로 서빙하는 경우 정규화
  if (mime === "video/webm") return "audio/webm";
  return mime;
}

function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "audio/webm": "webm",
    "video/webm": "webm",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/ogg": "ogg",
    "audio/mp4": "m4a",
    "audio/m4a": "m4a",
  };
  return mimeToExt[mimeType] ?? "webm";
}

function getLanguageName(langCode: string): string {
  const langMap: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    ar: "Arabic",
    hi: "Hindi",
    nl: "Dutch",
    pl: "Polish",
    tr: "Turkish",
    sv: "Swedish",
    da: "Danish",
    no: "Norwegian",
    fi: "Finnish",
  };
  return langMap[langCode] || langCode;
}

function isWhisperResponse(x: unknown): x is WhisperResponse {
  if (!x || typeof x !== "object") return false;
  const obj = x as any;
  return (
    obj.task === "transcribe" &&
    typeof obj.text === "string" &&
    typeof obj.language === "string" &&
    typeof obj.duration === "number" &&
    Array.isArray(obj.segments)
  );
}

/**
 * Buffer를 직접 받아 Groq Whisper STT를 호출한다.
 * URL 다운로드 / SSRF 검증 없이 서버 내부에서 직접 사용.
 */
export async function transcribeBuffer(
  buffer: Buffer,
  contentType: string,
  opts?: { language?: string; prompt?: string }
): Promise<TranscriptionResponse | TranscriptionError> {
  try {
    if (typeof FormData === "undefined" || typeof Blob === "undefined") {
      return {
        error: "Server runtime missing FormData/Blob",
        code: "SERVICE_ERROR",
        details: "Node 런타임에서 FormData/Blob이 필요합니다.",
      };
    }

    const sttUrl = resolveSttApiUrl();
    const sttKey = resolveSttApiKey();

    if (!sttUrl) {
      return {
        error: "Voice transcription service is not configured",
        code: "SERVICE_ERROR",
        details: "STT_API_URL을 .env에 설정하세요.",
      };
    }
    if (!sttKey) {
      return {
        error: "Voice transcription service authentication is missing",
        code: "SERVICE_ERROR",
        details: "STT_API_KEY를 .env에 설정하세요.",
      };
    }

    if (buffer.length > MAX_AUDIO_BYTES) {
      return {
        error: "Audio file exceeds maximum size limit",
        code: "FILE_TOO_LARGE",
        details: `File size is ${(buffer.length / (1024 * 1024)).toFixed(2)}MB, maximum allowed is ${(MAX_AUDIO_BYTES / (1024 * 1024)).toFixed(0)}MB`,
      };
    }

    const mimeType = normalizeMimeType(contentType);
    const ext = getFileExtension(mimeType);
    const audioBlob = new Blob([new Uint8Array(buffer)], { type: mimeType });

    const formData = new FormData();
    formData.append("file", audioBlob, `audio.${ext}`);
    formData.append("model", ENV.sttModel || "whisper-1");
    formData.append("response_format", "verbose_json");

    const prompt =
      opts?.prompt ||
      (opts?.language
        ? `Transcribe the user's voice to text. The user's working language is ${getLanguageName(opts.language)}.`
        : "Transcribe the user's voice to text.");
    formData.append("prompt", prompt);

    if (opts?.language) {
      formData.append("language", opts.language);
    }

    const { ac, clear } = abortAfter(TRANSCRIBE_TIMEOUT_MS);
    try {
      const response = await fetch(sttUrl, {
        method: "POST",
        headers: {
          authorization: `Bearer ${sttKey}`,
          "Accept-Encoding": "identity",
        },
        body: formData,
        signal: ac.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        return {
          error: "Transcription service request failed",
          code: "TRANSCRIPTION_FAILED",
          details: `${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`,
        };
      }

      const json = (await response.json()) as unknown;
      if (!isWhisperResponse(json)) {
        return {
          error: "Invalid transcription response",
          code: "SERVICE_ERROR",
          details: "Transcription service returned an invalid response format",
        };
      }

      return json;
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      return {
        error: aborted ? "Transcription timed out" : "Voice transcription failed",
        code: "SERVICE_ERROR",
        details: error instanceof Error ? error.message : "An unexpected error occurred",
      };
    } finally {
      clear();
    }
  } catch (error) {
    return {
      error: "Voice transcription failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Transcribe audio to text using the internal Speech-to-Text service
 */
export async function transcribeAudio(
  options: TranscribeOptions
): Promise<TranscriptionResponse | TranscriptionError> {
  try {
    // Runtime guard (Node env differences)
    if (typeof fetch === "undefined") {
      return { error: "fetch is not available in this runtime", code: "SERVICE_ERROR" };
    }
    if (typeof FormData === "undefined" || typeof Blob === "undefined") {
      return {
        error: "Server runtime missing FormData/Blob",
        code: "SERVICE_ERROR",
        details: "Node 런타임에서 FormData/Blob이 필요합니다. (Node 18+ 또는 undici/polyfill 권장)",
      };
    }

    // Step 1: Validate environment configuration
    const sttUrl = resolveSttApiUrl();
    const sttKey = resolveSttApiKey();

    if (!sttUrl) {
      return {
        error: "Voice transcription service is not configured",
        code: "SERVICE_ERROR",
        details: "STT_API_URL을 .env에 설정하세요.",
      };
    }
    if (!sttKey) {
      return {
        error: "Voice transcription service authentication is missing",
        code: "SERVICE_ERROR",
        details: "STT_API_KEY를 .env에 설정하세요.",
      };
    }

    // Step 2: Validate audioUrl (SSRF prevention)
    const validated = validateAudioUrl(options.audioUrl);
    if (!validated.ok) return validated.err;

    // Step 3: Download audio from URL with timeout
    let audioBuffer: Buffer;
    let mimeType: string;

    {
      const { ac, clear } = abortAfter(DOWNLOAD_TIMEOUT_MS);
      try {
        const response = await fetch(validated.url, { signal: ac.signal });

        if (!response.ok) {
          return {
            error: "Failed to download audio file",
            code: "INVALID_FORMAT",
            details: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        // size hint from headers
        const contentLength = response.headers.get("content-length");
        if (contentLength) {
          const bytes = Number(contentLength);
          if (!Number.isNaN(bytes) && bytes > MAX_AUDIO_BYTES) {
            return {
              error: "Audio file exceeds maximum size limit",
              code: "FILE_TOO_LARGE",
              details: `File size is ${(bytes / (1024 * 1024)).toFixed(2)}MB, maximum allowed is ${(MAX_AUDIO_BYTES / (1024 * 1024)).toFixed(
                0
              )}MB`,
            };
          }
        }

        const ab = await response.arrayBuffer();
        audioBuffer = Buffer.from(ab);

        if (audioBuffer.length > MAX_AUDIO_BYTES) {
          return {
            error: "Audio file exceeds maximum size limit",
            code: "FILE_TOO_LARGE",
            details: `File size is ${(audioBuffer.length / (1024 * 1024)).toFixed(2)}MB, maximum allowed is ${(MAX_AUDIO_BYTES / (1024 * 1024)).toFixed(
              0
            )}MB`,
          };
        }

        mimeType = normalizeMimeType(response.headers.get("content-type"));
      } catch (error) {
        const aborted = error instanceof Error && error.name === "AbortError";
        return {
          error: aborted ? "Audio download timed out" : "Failed to fetch audio file",
          code: "SERVICE_ERROR",
          details: error instanceof Error ? error.message : "Unknown error",
        };
      } finally {
        clear();
      }
    }

    // Step 4: Create FormData for multipart upload to Whisper API
    const formData = new FormData();

    const ext = getFileExtension(mimeType);
    const filename = `audio.${ext}`;
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });

    formData.append("file", audioBlob, filename);

    const model = ENV.sttModel || "whisper-1";
    formData.append("model", model);

    formData.append("response_format", "verbose_json");

    const prompt =
      options.prompt ||
      (options.language
        ? `Transcribe the user's voice to text. The user's working language is ${getLanguageName(options.language)}.`
        : "Transcribe the user's voice to text.");

    formData.append("prompt", prompt);

    // (Optional) language hint — some Whisper-compatible servers accept it.
    if (options.language) {
      formData.append("language", options.language);
    }

    // Step 5: Call the transcription service with timeout
    {
      const { ac, clear } = abortAfter(TRANSCRIBE_TIMEOUT_MS);
      try {
        const response = await fetch(sttUrl, {
          method: "POST",
          headers: {
            authorization: `Bearer ${sttKey}`,
            "Accept-Encoding": "identity",
          },
          body: formData,
          signal: ac.signal,
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          return {
            error: "Transcription service request failed",
            code: "TRANSCRIPTION_FAILED",
            details: `${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`,
          };
        }

        const json = (await response.json()) as unknown;

        if (!isWhisperResponse(json)) {
          return {
            error: "Invalid transcription response",
            code: "SERVICE_ERROR",
            details: "Transcription service returned an invalid response format",
          };
        }

        return json;
      } catch (error) {
        const aborted = error instanceof Error && error.name === "AbortError";
        return {
          error: aborted ? "Transcription timed out" : "Voice transcription failed",
          code: "SERVICE_ERROR",
          details: error instanceof Error ? error.message : "An unexpected error occurred",
        };
      } finally {
        clear();
      }
    }
  } catch (error) {
    return {
      error: "Voice transcription failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}