# Commit → Push → PR

변경 사항을 커밋하고 PR을 생성합니다.

## 실행 순서

1. `pnpm check` — 타입 오류 확인
2. `pnpm test` — 테스트 통과 확인
3. 변경된 파일 스테이징 (`git add`)
4. 커밋 메시지 작성 (관례: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`)
5. `git push`
6. PR 생성 (gh CLI 사용)

## PR 템플릿

```
## Summary
- 변경 내용 요약 (2-3줄)

## Changes
- 구체적인 변경 파일/기능

## Test Plan
- [ ] pnpm check 통과
- [ ] pnpm test 통과
- [ ] 로컬에서 동작 확인
```

## 주의

- `.env` 파일 절대 커밋 금지
- `pnpm-lock.yaml`은 항상 포함
