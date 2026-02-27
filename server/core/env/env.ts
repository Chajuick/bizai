// server/core/env/env.ts

// #region Imports
import "dotenv/config"; // ✅ .env를 항상 로드 (dev/prod 모두)
import path from "path";
import dotenv from "dotenv";
// #endregion

// #region Load .env (확정)
// dotenv/config 만으로도 보통 충분하지만,
// 실행 위치가 흔들릴 때를 대비해 root .env를 한 번 더 명시 로드한다.
// - 이미 로드되어도 dotenv는 덮어쓰지 않으니 안전
// - 모노레포/서브폴더 실행에서도 안정적
const rootEnvPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: rootEnvPath });
// #endregion

// #region Helpers (검증/정규화)
/**
 * 환경변수 값을 읽고, 문자열 정규화(trim)까지 수행한다.
 * - undefined -> ""
 * - "   " -> ""
 */
function read(key: string): string {
  return String(process.env[key] ?? "").trim();
}

/**
 * 필수 환경변수: 빈 값이면 즉시 실패시켜 런타임 크래시를 예방한다.
 */
function required(key: string): string {
  const v = read(key);
  if (!v) {
    // 보안상 전체 env 덤프/로그는 금지
    throw new Error(`[ENV] Missing required environment variable: ${key}`);
  }
  return v;
}

/**
 * 선택 환경변수: 없으면 기본값 사용
 */
function optional(key: string, fallback = ""): string {
  const v = read(key);
  return v || fallback;
}

/**
 * CSV 환경변수 파싱 (예: "a,b,c")
 */
function csv(key: string): string[] {
  const v = read(key);
  if (!v) return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
// #endregion

// #region ENV (단일 진실원천)
export const ENV = {
  // --- app / runtime
  isProduction: read("NODE_ENV") === "production",

  // --- auth / session
  // ✅ jose "Zero-length key" 방지: 빈 값이면 부팅 단계에서 차단
  cookieSecret: required("JWT_SECRET"),

  // --- owner (최초 admin 지정, 이메일 기준)
  ownerEmail: optional("OWNER_EMAIL"),

  // --- Google OAuth
  googleClientId: optional("GOOGLE_CLIENT_ID"),
  googleClientSecret: optional("GOOGLE_CLIENT_SECRET"),

  // --- database
  databaseUrl: required("DATABASE_URL"),

  // --- storage (Cloudflare R2 / S3 호환)
  // optional로 두고, storage.ts에서 실제 호출 시 검증한다 (테스트 환경 부팅 허용)
  r2Endpoint: optional("R2_ENDPOINT"),
  r2AccessKeyId: optional("R2_ACCESS_KEY_ID"),
  r2SecretKey: optional("R2_SECRET_ACCESS_KEY"),
  r2Bucket: optional("R2_BUCKET_NAME"),

  // --- llm (Groq / OpenAI 호환)
  llmApiUrl: optional("LLM_API_URL", "https://api.groq.com/openai/v1"),
  llmApiKey: optional("LLM_API_KEY"),
  llmModel: optional("LLM_MODEL", "llama-3.3-70b-versatile"),

  // --- stt (Groq Whisper / OpenAI 호환)
  sttApiUrl: optional("STT_API_URL", "https://api.groq.com/openai/v1"),
  sttApiKey: optional("STT_API_KEY"),
  sttModel: optional("STT_MODEL", "whisper-large-v3-turbo"),

  // --- security
  allowedAudioHosts: optional("ALLOWED_AUDIO_HOSTS"),
  allowedAudioHostsList: csv("ALLOWED_AUDIO_HOSTS"),
} as const;
// #endregion
