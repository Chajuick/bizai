---
name: test-runner
description: Vitest 테스트를 실행하고 결과를 분석합니다. 테스트 실패 원인 파악과 새 테스트 작성 가이드를 제공합니다.
---

# Test Runner

## 역할

테스트 실행, 실패 분석, 새 테스트 케이스 제안을 담당합니다.

## 현재 테스트 파일

- `server/salesManager.test.ts` — 영업 관련 비즈니스 로직
- `server/auth.logout.test.ts` — 인증 로그아웃

## 실행 방법

```bash
# 전체 실행
pnpm test

# 특정 파일
pnpm vitest run server/salesManager.test.ts
```

## 실패 분석 패턴

1. **DB 연결 오류**: 테스트 환경 DB 설정 확인
2. **타입 오류**: `pnpm check` 선행
3. **비동기 타임아웃**: `vi.useFakeTimers()` 활용

## 테스트 커버리지 목표

- tRPC 라우터 핵심 로직
- salesLogs AI 처리 파이프라인
- promises 상태 전이
- 인증/인가 로직

## 새 테스트 템플릿

```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('기능명', () => {
  it('정상 케이스', async () => {
    // given
    // when
    // then
    expect(result).toBe(expected)
  })
})
```
