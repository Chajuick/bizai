// server/core/vision.ts
//
// Google Gemini — 영수증/명세서 이미지 분석
// Free tier 대응 + JSON schema 강제 + 429 상세 분기 + 안전한 파싱
// 이미지 → 지출 정보 구조화 JSON 반환

import { ENV } from "./env/env";
import { logger } from "./logger";

// #region Types
type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  error?: { message?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  modelVersion?: string;
};

type GeminiModelInfo = {
  name: string;
  displayName: string;
  supportedGenerationMethods: string[];
};

type GeminiModelsResponse = {
  models?: GeminiModelInfo[];
  error?: { message?: string };
};

type GeminiErrorPayload = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: unknown[];
  };
};

export type ReceiptAnalysisResult = {
  expe_name: string | null;
  expe_amnt: number | null;
  expe_date: string | null; // YYYY-MM-DD
  expe_type: "receipt" | "invoice" | "contract" | "other" | null;
  paym_meth: "card" | "cash" | "transfer" | "other" | null;
  ai_categ: string | null;
  ai_vendor: string | null;
  clie_name: string | null;
  recr_type: "none" | "daily" | "weekly" | "monthly" | "yearly" | null;
  summary: string | null;
};
// #endregion

// #region Constants
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_LIST_URL = `${GEMINI_BASE_URL}/models`;
const RETRY_DELAYS_MS = [2000, 4000]; // 429 재시도 딜레이 (최대 2회)

const GEMINI_MODEL = ENV.geminiModel; // 기본값: env.ts → "gemini-2.5-flash"

const ALLOWED_EXPE_TYPES = ["receipt", "invoice", "contract", "other"] as const;
const ALLOWED_PAY_METHODS = ["card", "cash", "transfer", "other"] as const;
const ALLOWED_RECR_TYPES = ["none", "daily", "weekly", "monthly", "yearly"] as const;
const ALLOWED_CATEGORIES = ["식비", "교통비", "숙박비", "사무용품", "통신비", "기타"] as const;

const ANALYSIS_PROMPT = `
당신은 영수증, 세금계산서, 명세서 이미지를 분석하는 AI입니다.

반드시 순수 JSON 객체만 반환하세요.
설명, 마크다운, 코드블록, 부가 문장은 절대 포함하지 마세요.

추출 규칙:
- expe_name: 지출 항목명 (예: 점심 식대, 사무용품, 택시비)
- expe_amnt: 최종 결제 금액(원), 숫자만
- expe_date: YYYY-MM-DD 형식
- expe_type: receipt | invoice | contract | other
- paym_meth: card | cash | transfer | other
- ai_categ: 식비 | 교통비 | 숙박비 | 사무용품 | 통신비 | 기타 중 정확히 하나
- ai_vendor: 판매처/가맹점명
- clie_name: 거래처명 (없으면 null)
- recr_type: none | daily | weekly | monthly | yearly
- summary: 한국어 1~2문장 요약

판단 기준:
- receipt: 일반 영수증, 카드 영수증, 간이영수증
- invoice: 세금계산서, 거래명세서, 견적서
- contract: 계약서, 이용 계약, 서비스 계약
- other: 위에 해당하지 않는 문서

중요:
- 인식 불가 필드는 null
- 금액은 부가세 포함 최종 합계 금액
- 반복결제가 아니면 recr_type은 none
`.trim();

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    expe_name: { type: "STRING", nullable: true },
    expe_amnt: { type: "NUMBER", nullable: true },
    expe_date: { type: "STRING", nullable: true },
    expe_type: {
      type: "STRING",
      nullable: true,
      enum: [...ALLOWED_EXPE_TYPES],
    },
    paym_meth: {
      type: "STRING",
      nullable: true,
      enum: [...ALLOWED_PAY_METHODS],
    },
    ai_categ: {
      type: "STRING",
      nullable: true,
      enum: [...ALLOWED_CATEGORIES],
    },
    ai_vendor: { type: "STRING", nullable: true },
    clie_name: { type: "STRING", nullable: true },
    recr_type: {
      type: "STRING",
      nullable: true,
      enum: [...ALLOWED_RECR_TYPES],
    },
    summary: { type: "STRING", nullable: true },
  },
  required: ["recr_type"],
};
// #endregion

// #region listAvailableModels — 사용 가능한 모델 목록 조회 (디버그용)
export async function listAvailableModels(): Promise<void> {
  const apiKey = ENV.geminiApiKey;
  if (!apiKey) {
    logger.warn("[vision:listModels] GEMINI_API_KEY 미설정 — 건너뜀");
    return;
  }

  try {
    const res = await fetch(`${GEMINI_LIST_URL}?key=${apiKey}`);
    const body = await res.text();

    if (!res.ok) {
      logger.error(
        { status: res.status, body },
        "[vision:listModels] ListModels API 오류 — 키 또는 프로젝트 문제일 수 있음",
      );
      return;
    }

  } catch (err) {
    logger.error({ err }, "[vision:listModels] fetch 실패");
  }
}
// #endregion

// #region Internal helpers
function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function extractJsonObject(raw: string): string {
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return cleaned.slice(start, end + 1);
  }

  return cleaned;
}

function normalizeAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const num = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(num) ? Math.round(num) : null;
  }

  return null;
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalized = value
    .trim()
    .replace(/\./g, "-")
    .replace(/\//g, "-")
    .replace(/\s+/g, "");

  const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;

  const [, y, m, d] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number] | null = null,
): T[number] | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T[number])
    : fallback;
}

function extractGeminiErrorDetail(errorText: string): string {
  const parsed = safeJsonParse<GeminiErrorPayload>(errorText);
  return parsed?.error?.message ?? errorText;
}

function isFreeTierZeroQuota(detail: string): boolean {
  const lower = detail.toLowerCase();
  return lower.includes("quota exceeded for metric") && lower.includes("limit: 0");
}

async function callGeminiGenerate(
  apiKey: string,
  model: string,
  body: object,
): Promise<{ ok: boolean; status: number; text: string }> {
  const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  const text = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, text };
}
// #endregion

// #region analyzeReceiptImage
export async function analyzeReceiptImage(params: {
  imageBase64: string;
  mimeType: string;
}): Promise<ReceiptAnalysisResult> {
  const apiKey = ENV.geminiApiKey;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const requestBody = {
    contents: [
      {
        parts: [
          { text: ANALYSIS_PROMPT },
          {
            inline_data: {
              mime_type: params.mimeType,
              data: params.imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  let lastResult: { ok: boolean; status: number; text: string } | null = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const result = await callGeminiGenerate(apiKey, GEMINI_MODEL, requestBody);

    logger.debug(
      {
        attempt,
        model: GEMINI_MODEL,
        status: result.status,
        bodySnippet: result.text.slice(0, 400),
      },
      "[vision] generateContent 응답",
    );

    if (result.ok) {
      return parseGeminiResponse(result.text, GEMINI_MODEL);
    }

    lastResult = result;

    if (result.status === 429 && attempt < RETRY_DELAYS_MS.length) {
      const delay = RETRY_DELAYS_MS[attempt];

      logger.warn(
        {
          attempt,
          model: GEMINI_MODEL,
          status: result.status,
          body: result.text,
        },
        `[vision] 429 Rate Limit — ${delay / 1000}초 후 재시도 (${attempt + 1}/${RETRY_DELAYS_MS.length})`,
      );

      await sleep(delay);
      continue;
    }

    break;
  }

  const { status, text: errorText } = lastResult!;
  const detail = extractGeminiErrorDetail(errorText);

  logger.error(
    { model: GEMINI_MODEL, status, detail, body: errorText },
    "[vision] generateContent 최종 실패",
  );

  if (status === 429) {
    if (isFreeTierZeroQuota(detail)) {
      throw new Error(
        `현재 프로젝트/API 키에서 모델 ${GEMINI_MODEL}의 무료 할당량이 0으로 적용되어 있습니다. 다른 모델을 사용하거나 새 프로젝트/API 키를 확인해주세요.`,
      );
    }

    throw new Error(`Gemini API 요청 한도 초과: ${detail}`);
  }

  throw new Error(`Gemini API 오류 (${status}): ${detail}`);
}
// #endregion

// #region parseGeminiResponse
function parseGeminiResponse(rawText: string, model: string): ReceiptAnalysisResult {
  const response = safeJsonParse<GeminiResponse>(rawText);

  if (!response) {
    logger.warn({ model, rawText }, "[vision] Gemini 응답 JSON 파싱 실패");
    return failureResult();
  }

  if (response.error?.message) {
    logger.error({ model, error: response.error }, "[vision] Gemini 응답 내 error 필드");
    return failureResult();
  }

  const text =
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim() ?? "";

  if (!text) {
    logger.warn({ model, rawText }, "[vision] Gemini 응답 content 비어 있음");
    return failureResult();
  }

  const cleaned = extractJsonObject(text);
  const parsed = safeJsonParse<Partial<ReceiptAnalysisResult>>(cleaned);

  if (!parsed) {
    logger.warn({ model, raw: text, cleaned }, "[vision] Gemini 콘텐츠 JSON 파싱 실패");
    return failureResult();
  }
  const candidate = response.candidates?.[0];
  const finishReason = candidate?.finishReason ?? "UNKNOWN";

  logger.info(
    {
      model,
      finishReason,
      usageMetadata: response.usageMetadata,
      modelVersion: response.modelVersion,
    },
    "[vision] Gemini 응답 메타"
  );
  return {
    expe_name: normalizeString(parsed.expe_name),
    expe_amnt: normalizeAmount(parsed.expe_amnt),
    expe_date: normalizeDate(parsed.expe_date),
    expe_type: normalizeEnum(parsed.expe_type, ALLOWED_EXPE_TYPES, null),
    paym_meth: normalizeEnum(parsed.paym_meth, ALLOWED_PAY_METHODS, null),
    ai_categ: normalizeEnum(parsed.ai_categ, ALLOWED_CATEGORIES, "기타"),
    ai_vendor: normalizeString(parsed.ai_vendor),
    clie_name: normalizeString(parsed.clie_name),
    recr_type: normalizeEnum(parsed.recr_type, ALLOWED_RECR_TYPES, "none"),
    summary: normalizeString(parsed.summary),
  };
}

function failureResult(): ReceiptAnalysisResult {
  return {
    expe_name: null,
    expe_amnt: null,
    expe_date: null,
    expe_type: null,
    paym_meth: null,
    ai_categ: null,
    ai_vendor: null,
    clie_name: null,
    recr_type: "none",
    summary: "이미지 분석에 실패했습니다. 수동으로 입력해주세요.",
  };
}
// #endregion