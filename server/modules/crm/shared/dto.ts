// server/modules/crm/shared/dto.ts
import { z } from "zod";

/**
 * DB(Drizzle/mysql2)는 Date 객체를 반환하기도 하고, 환경에 따라 string을 반환하기도 한다.
 * 또한 mysql2는 특정 환경(서버 timezone 불일치 등)에서 timestamp를 Invalid Date 객체로 반환할 수 있다.
 *
 * - z.date()는 Invalid Date를 거부한다 (isNaN(date.getTime()) 체크)
 * - string일 경우도 "" / "0000-00-00 00:00:00" 같이 파싱 불가한 값이 섞일 수 있다
 *
 * 따라서 Output DTO에서 preprocess로 "유효하지 않은 날짜"를 null 처리한다.
 */

// 1) Date 인스턴스인데 Invalid Date면 null
const toNullIfInvalidDate = (v: unknown) =>
  v instanceof Date && Number.isNaN(v.getTime()) ? null : v;

// 2) 흔한 “제로 데이트/빈값” 문자열도 null 처리
const toNullIfInvalidDateString = (v: unknown) => {
  if (typeof v !== "string") return v;

  const s = v.trim();
  if (!s) return null;

  // MySQL zero-date 계열 (환경에 따라 이런 값이 튀어나올 수 있음)
  if (
    s === "0000-00-00" ||
    s.startsWith("0000-00-00 00:00:00") ||
    s.startsWith("0000-00-00T00:00:00")
  ) {
    return null;
  }

  return v;
};

// 3) (선택) string이 실제 datetime 형태인지도 어느 정도 보장하고 싶으면 datetime() 사용
//    - JSON stringify된 Date는 ISO 형태(YYYY-MM-DDTHH:mm:ss.sssZ)라서 datetime()에 잘 맞음
//    - 만약 DB가 "YYYY-MM-DD HH:mm:ss" 형태로 준다면 datetime()에서 걸릴 수 있음
//    - 그 경우엔 아래 .datetime()을 빼고 z.string()으로 두면 됨
const IsoDateTimeString = z.string(); // <- 보수적으로 넓게(호환 최우선)
// const IsoDateTimeString = z.string().datetime(); // <- 엄격하게 하고 싶으면 이걸로

export const IsoDateTime = z.preprocess(
  toNullIfInvalidDate,
  z.union([z.date(), IsoDateTimeString])
);

/**
 * Nullable 버전:
 * - Invalid Date(Date 객체) -> null
 * - "" / zero-date(string) -> null
 * - 그 외는 Date or string 허용
 */
export const IsoDateTimeNullable = z.preprocess(
  (v) => toNullIfInvalidDate(toNullIfInvalidDateString(v)),
  z.union([z.date(), IsoDateTimeString]).nullable()
);

// DB/driver가 string로도 주고 number로도 줄 수 있는 decimal 대응
export const DecimalLike = z.union([z.string(), z.number()]);
export const DecimalLikeNullable = DecimalLike.nullable();

// PATCH 규칙: optional + nullable 조합을 반복해서 쓰기 싫을 때(선택)
export const PatchString = z.string().nullable().optional();
export const PatchNumber = z.number().nullable().optional();
export const PatchBoolean = z.boolean().nullable().optional(); // PATCH에서는 null로 비우는 경우도 있어서 nullable 추천