# 전체 타입 체크

프로젝트 전체 TypeScript 타입 오류를 확인합니다.

## 실행

```bash
pnpm check
```

`tsconfig.json` 기반으로 `tsc --noEmit` 실행.

## 오류 해결 우선순위

1. `server/` 타입 오류 먼저 수정 (API 계약 영향)
2. `drizzle/schema.ts` 변경 후 관련 타입 재확인
3. `client/` 오류 수정

## 자주 발생하는 오류

- **`any` 타입**: 구체적인 타입으로 교체
- **tRPC 라우터 타입**: `AppRouter` 타입이 client에서 자동 추론됨
- **Drizzle 타입**: `$inferSelect`, `$inferInsert` 사용
