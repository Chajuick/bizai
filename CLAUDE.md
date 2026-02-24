# Sales Manager — Claude Code Guide

## 프로젝트 개요

영업사원용 CRM/영업 관리 앱.
- **Frontend**: React 19 + Vite + TailwindCSS v4 + shadcn/ui + wouter + tRPC
- **Backend**: Express.js + tRPC + Drizzle ORM + MySQL
- **Storage**: AWS S3 (파일 업로드)
- **Auth**: JWT (jose) + OAuth

## 패키지 관리

**항상 `pnpm` 사용** (npm, yarn 금지)

```bash
pnpm install         # 의존성 설치
pnpm add <pkg>       # 패키지 추가
pnpm remove <pkg>    # 패키지 제거
```

## 개발 워크플로우

변경 후 반드시 아래 순서로 확인:

```bash
pnpm check    # TypeScript 타입체크 (tsc --noEmit)
pnpm test     # 테스트 실행 (vitest run)
pnpm format   # 코드 포맷 (prettier --write .)
pnpm build    # 빌드 검증
```

개발 서버:
```bash
pnpm dev      # 개발 서버 실행 (Express + Vite HMR)
```

DB 마이그레이션:
```bash
pnpm db:push  # drizzle-kit generate && migrate
```

## 프로젝트 구조

```
sales-manager/
├── client/                    # React 프론트엔드
│   └── src/
│       ├── _core/hooks/       # 인증 훅 (useAuth)
│       ├── components/        # 공유 컴포넌트
│       │   └── ui/            # shadcn/ui 기본 컴포넌트
│       ├── contexts/          # React Context (ThemeContext)
│       ├── hooks/             # 커스텀 훅
│       ├── lib/               # tRPC 클라이언트, utils
│       └── pages/             # 페이지 컴포넌트
├── server/                    # Express 백엔드
│   ├── _core/                 # 핵심 인프라 (tRPC, auth, DB, LLM)
│   ├── routers/               # tRPC 라우터 (도메인별)
│   ├── routers.ts             # 루트 라우터 조합
│   ├── db.ts                  # DB 연결
│   └── storage.ts             # S3 스토리지
├── drizzle/                   # DB 스키마 & 마이그레이션
│   ├── schema.ts              # 테이블 정의
│   └── relations.ts           # 관계 정의
└── package.json               # 단일 루트 패키지
```

## 코딩 컨벤션

### TypeScript
- `type` 선호, `interface`는 꼭 필요한 경우만
- **`enum` 절대 금지** → `mysqlEnum`(DB용) 또는 문자열 리터럴 유니온 사용
- Zod v4로 입력 유효성 검사
- `any` 타입 사용 금지

### tRPC
- 모든 API는 `server/routers/` 에 도메인별 파일로 작성
- `publicProcedure` vs `protectedProcedure` 구분 필수
- 입력은 반드시 Zod 스키마로 검증

### Drizzle ORM
- 스키마 변경 후 반드시 `pnpm db:push` 실행
- `drizzle/schema.ts` 에서 타입 export (`$inferSelect`, `$inferInsert`)

### React
- 함수형 컴포넌트 + 훅 패턴
- 페이지 컴포넌트: `client/src/pages/`
- 공유 컴포넌트: `client/src/components/`
- shadcn/ui 컴포넌트: `client/src/components/ui/` (직접 수정 가능)

### 금지 사항
- ❌ `console.log` — 디버그 후 반드시 제거
- ❌ `any` 타입
- ❌ `enum` 키워드 (문자열 리터럴 유니온 사용)
- ❌ npm / yarn 사용 (pnpm만)
- ❌ 불필요한 `useEffect` 남용

## 도메인 모델

| 테이블 | 한국어 | 설명 |
|--------|--------|------|
| `users` | 사용자 | 영업사원 계정 |
| `clients` | 고객사 | 거래처 정보 |
| `salesLogs` | 영업일지 | 방문/활동 기록 (AI 분석 포함) |
| `promises` | 일정 | 후속 조치 일정 |
| `orders` | 수주 | 계약/수주 정보 |
| `deliveries` | 납품 | 납품/매출 정보 |
| `attachments` | 첨부파일 | S3 파일 메타데이터 |

## 환경 변수

`.env` 파일 필요 (절대 커밋 금지):
- `DATABASE_URL` — MySQL 연결 문자열
- `JWT_SECRET` — JWT 서명 키
- `AWS_*` — S3 자격증명
- `OPENAI_API_KEY` — AI 기능용
