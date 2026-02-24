# 테스트 실행

Vitest 테스트를 실행합니다.

## 명령어

```bash
# 전체 테스트
pnpm test

# 특정 파일만
pnpm vitest run server/salesManager.test.ts
pnpm vitest run server/auth.logout.test.ts

# Watch 모드 (개발 중)
pnpm vitest
```

## 테스트 파일 위치

- `server/salesManager.test.ts` — 영업 관련 로직
- `server/auth.logout.test.ts` — 인증 로그아웃

## 새 테스트 작성 규칙

- 파일명: `*.test.ts`
- Vitest 문법 사용 (`describe`, `it`, `expect`)
- DB 테스트는 실제 DB 대신 mock 사용 권장
