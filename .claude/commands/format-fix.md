# 코드 포맷 자동 수정

Prettier로 전체 코드를 포맷합니다.

## 명령어

```bash
# 전체 포맷
pnpm format

# 특정 파일만
pnpm prettier --write client/src/pages/Dashboard.tsx
pnpm prettier --write server/routers/clients.ts
```

## 포맷 확인 (수정 없이)

```bash
pnpm prettier --check .
```

## 설정

`package.json`의 `"format": "prettier --write ."` 스크립트 사용.
Prettier 설정 파일이 있으면 해당 규칙 적용.
