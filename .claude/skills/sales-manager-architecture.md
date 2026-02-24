---
name: sales-manager-architecture
description: sales-manager 전체 아키텍처, 폴더 구조, 기술 스택, 의존성 방향을 설명합니다. 새 기능 추가 전 구조 파악에 활용하세요.
---

# Sales Manager Architecture

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| **Frontend** | React 19, Vite, TailwindCSS v4, shadcn/ui, wouter |
| **상태/캐시** | @tanstack/react-query v5 |
| **API 클라이언트** | tRPC v11 + react-query |
| **백엔드** | Express.js + tRPC |
| **DB** | MySQL + Drizzle ORM |
| **인증** | JWT (jose) + OAuth |
| **파일 스토리지** | AWS S3 |
| **AI** | LLM (server/_core/llm.ts) |
| **테스트** | Vitest |
| **포맷** | Prettier |

## 폴더 구조

```
sales-manager/
├── client/                   # React SPA
│   └── src/
│       ├── _core/hooks/      # useAuth (인증 상태)
│       ├── components/ui/    # shadcn/ui (직접 수정 가능)
│       ├── components/       # 앱 전용 공유 컴포넌트
│       ├── contexts/         # React Context
│       ├── hooks/            # 커스텀 훅
│       ├── lib/
│       │   ├── trpc.ts       # tRPC 클라이언트 설정
│       │   └── utils.ts      # 유틸리티
│       ├── pages/            # 라우트별 페이지
│       ├── App.tsx           # 라우터 설정 (wouter)
│       └── const.ts          # 클라이언트 상수
│
├── server/
│   ├── _core/                # 인프라 레이어
│   │   ├── index.ts          # Express 앱 진입점
│   │   ├── trpc.ts           # tRPC context & procedures
│   │   ├── context.ts        # Request context (user, db)
│   │   ├── cookies.ts        # 세션 쿠키
│   │   ├── env.ts            # 환경 변수 파싱
│   │   ├── llm.ts            # LLM API 클라이언트
│   │   ├── oauth.ts          # OAuth 핸들러
│   │   ├── sdk.ts            # 외부 SDK 초기화
│   │   └── systemRouter.ts   # 시스템 엔드포인트
│   ├── routers/              # 비즈니스 로직
│   │   ├── clients.ts
│   │   ├── salesLogs.ts      # AI 처리 포함
│   │   ├── promises.ts
│   │   ├── orders.ts
│   │   ├── deliveries.ts
│   │   ├── dashboard.ts
│   │   └── upload.ts         # S3 presigned URL
│   ├── routers.ts            # AppRouter 조합
│   ├── db.ts                 # Drizzle DB 인스턴스
│   └── storage.ts            # S3 클라이언트
│
├── drizzle/
│   ├── schema.ts             # 테이블 정의 (단일 파일)
│   ├── relations.ts          # 관계 정의
│   └── meta/                 # 마이그레이션 스냅샷
│
└── package.json              # 단일 루트 패키지 (pnpm)
```

## 데이터 흐름

```
Client (React)
  └─ tRPC hooks (lib/trpc.ts + react-query)
       └─ HTTP → Express
            └─ tRPC Router (routers.ts)
                 └─ Context (context.ts) → user 인증
                      └─ Router Handler
                           ├─ Drizzle ORM → MySQL
                           ├─ LLM (llm.ts) → AI 처리
                           └─ S3 (storage.ts) → 파일
```

## 인증 흐름

1. OAuth 로그인 → `server/_core/oauth.ts`
2. JWT 생성 → `jose` 라이브러리
3. 쿠키 저장 → `server/_core/cookies.ts`
4. 요청마다 → `server/_core/context.ts`에서 쿠키 검증 → `ctx.user`

## 새 기능 추가 패턴

1. `drizzle/schema.ts` 에 테이블 추가
2. `pnpm db:push` 마이그레이션
3. `server/routers/새기능.ts` 생성
4. `server/routers.ts` 에 등록
5. `client/src/pages/새기능.tsx` 생성
6. `client/src/App.tsx` 에 라우트 등록
