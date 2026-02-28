// server/modules/crm/shared/like.ts
// MySQL LIKE 패턴 이스케이프 유틸
//
// 문제: like(col, `%${input}%`) 에 사용자가 "10%" 또는 "_A" 같은 입력을 넣으면
//       LIKE 와일드카드로 해석되어 의도하지 않은 결과가 나옴.
// 해결: LIKE 패턴에 넣기 전 \, %, _ 를 이스케이프.
//
// 사용 예:
//   like(col, `%${escapeLike(userInput)}%`)

export function escapeLike(value: string): string {
  // MySQL 기본 LIKE escape char: \
  // %  → \%
  // _  → \_
  // \  → \\
  return value.replace(/[\\%_]/g, "\\$&");
}
