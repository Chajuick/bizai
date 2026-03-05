// server/modules/crm/shared/dto.ts
import { z } from "zod";

// DB(Drizzle)는 Date 객체를 반환하고, JSON 전송 시 ISO string으로 직렬화된다.
// Output DTO에서 두 타입을 모두 허용 → z.infer<> = Date | string
// (tRPC는 JSON.stringify로 Date → ISO string 자동 직렬화)
export const IsoDateTime = z.union([z.date(), z.string()]);
export const IsoDateTimeNullable = z.union([z.date(), z.string()]).nullable();

// DB/driver가 string로도 주고 number로도 줄 수 있는 decimal 대응
export const DecimalLike = z.union([z.string(), z.number()]);
export const DecimalLikeNullable = DecimalLike.nullable();

// PATCH 규칙: optional + nullable 조합을 반복해서 쓰기 싫을 때(선택)
export const PatchString = z.string().nullable().optional();
export const PatchNumber = z.number().nullable().optional();
export const PatchBoolean = z.boolean().optional(); // 보통 boolean은 null 비움 의미가 없어서 optional만