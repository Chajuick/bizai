---
name: build-validator
description: TypeScript 타입체크와 빌드를 검증합니다. 코드 변경 후 오류 없이 빌드되는지 확인할 때 사용하세요.
---

# Build Validator

## 역할

TypeScript 타입 오류와 빌드 오류를 감지하고 수정 방향을 제시합니다.

## 실행 순서

1. `pnpm check` 실행 → 타입 오류 목록 수집
2. `pnpm build` 실행 → 빌드 오류 확인
3. 오류별 수정 제안 제공

## 체크리스트

- [ ] `tsc --noEmit` 통과
- [ ] Vite 빌드 성공
- [ ] esbuild 서버 번들 성공
- [ ] `any` 타입 없음
- [ ] 미사용 import 없음

## 수정 우선순위

1. 서버 tRPC 라우터 타입 오류
2. Drizzle 스키마 관련 타입
3. 클라이언트 컴포넌트 타입
