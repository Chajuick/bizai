# 빌드 검증

프로덕션 빌드가 성공하는지 확인합니다.

## 명령어

```bash
pnpm build
```

## 빌드 내용

1. `vite build` — `client/` 프론트엔드 번들링 → `dist/public/`
2. `esbuild server/_core/index.ts` — 서버 번들링 → `dist/index.js`

## 빌드 후 프로덕션 실행 테스트

```bash
pnpm start
# NODE_ENV=production node dist/index.js
```

## 자주 발생하는 빌드 오류

- **import 경로 오류**: `@shared/*` alias 확인
- **환경 변수 미설정**: `.env` 파일 확인
- **타입 오류**: 빌드 전 `pnpm check` 선행
