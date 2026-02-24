---
name: api-doc-generator
description: tRPC 라우터를 분석하여 API 문서를 자동 생성합니다. 프론트엔드 개발자나 새 팀원 온보딩에 활용하세요.
---

# API Doc Generator

## 역할

`server/routers/` 의 tRPC 라우터를 읽어 API 명세 문서를 생성합니다.

## 분석 대상

```
server/routers/
├── clients.ts      # 고객사 CRUD
├── salesLogs.ts    # 영업일지 (AI 처리 포함)
├── promises.ts     # 일정 관리
├── orders.ts       # 수주 관리
├── deliveries.ts   # 납품/매출
├── dashboard.ts    # 대시보드 집계
└── upload.ts       # S3 파일 업로드
```

## 문서 생성 형식

```markdown
## clients

### clients.list
- **타입**: Query
- **인증**: 필요
- **입력**: `{ search?: string, isActive?: boolean }`
- **반환**: `Client[]`
- **설명**: 로그인한 사용자의 고객사 목록 조회

### clients.create
- **타입**: Mutation
- ...
```

## 생성 후 저장 위치

`docs/api-reference.md` 에 저장합니다.
