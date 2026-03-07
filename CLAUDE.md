# Sales Manager — Claude Code Guide

## 프로젝트 개요

영업사원용 AI 기반 CRM · 영업 관리 SaaS.
음성 녹음 → Whisper STT → LLM 분석 → 고객사/일정/수주 자동 구조화가 핵심 플로우.

- **Frontend**: React 19 + Vite + TailwindCSS v4 + shadcn/ui + wouter + tRPC
- **Backend**: Express.js + tRPC + Drizzle ORM + MySQL
- **Storage**: Cloudflare R2 (S3 SDK 호환)
- **AI**: Groq — LLM(`llama-3.3-70b-versatile`) + STT(`whisper-large-v3-turbo`)
- **Auth**: JWT(jose) + Google OAuth 2.0 + 이메일/비밀번호

---

## 패키지 관리

**항상 `pnpm` 사용** (npm, yarn 금지)

```bash
pnpm install         # 의존성 설치
pnpm add <pkg>       # 패키지 추가
pnpm remove <pkg>    # 패키지 제거
```

---

## 개발 워크플로우

변경 후 반드시 아래 순서로 확인:

```bash
pnpm check    # TypeScript 타입 체크 (tsc --noEmit)
pnpm test     # 테스트 실행 (vitest run)
pnpm format   # 코드 포맷 (prettier --write .)
pnpm build    # 빌드 검증
```

개발 서버:
```bash
pnpm dev      # 개발 서버 (Express + Vite HMR)
```

DB 마이그레이션:
```bash
pnpm db:push  # drizzle-kit generate && migrate
```

---

## 프로젝트 구조

```
bizai/
├── client/                        # React SPA
│   └── src/
│       ├── _core/hooks/           # 인증 훅 (useAuth)
│       ├── components/
│       │   ├── ui/                # shadcn/ui 기본 컴포넌트
│       │   └── focuswin/          # 앱 전용 컴포넌트
│       │       ├── app/           # 앱 레이아웃, 미디어(VoiceRecorder)
│       │       ├── common/        # 공통 UI (card, modal, badge 등)
│       │       └── page/          # 도메인별 페이지 전용 컴포넌트
│       ├── contexts/              # React Context (ThemeContext)
│       ├── hooks/focuswin/        # 도메인별 ViewModel 훅
│       │   ├── sale/              # 영업일지 VM
│       │   ├── schedule/          # 일정 VM
│       │   ├── order/             # 수주 VM
│       │   ├── shipment/          # 납품 VM
│       │   ├── client/            # 고객사 VM
│       │   ├── company/           # 회사/멤버 VM
│       │   └── files/             # 파일 업로드/STT VM
│       ├── lib/
│       │   ├── trpc.ts            # tRPC React 클라이언트
│       │   ├── trpcClient.ts      # tRPC HTTP 클라이언트 설정
│       │   ├── queryClient.ts     # TanStack Query 클라이언트 + 전역 에러 처리
│       │   └── handleApiError.ts  # 공통 API 에러 처리 (parseApiError, handleApiError)
│       ├── pages/                 # 페이지 컴포넌트 (라우트 단위)
│       └── router/                # wouter 라우터
│
├── server/
│   ├── core/
│   │   ├── trpc/
│   │   │   ├── trpc.ts            # tRPC 초기화 + errorFormatter
│   │   │   ├── appError.ts        # AppError 클래스 + throwAppError 헬퍼
│   │   │   ├── context.ts         # tRPC 컨텍스트 생성 (인증/회사 해석)
│   │   │   └── appRouters.ts      # 루트 라우터 조합
│   │   ├── db/                    # DB 연결 (Drizzle)
│   │   ├── auth/                  # 사용자 저장소 (user.repo)
│   │   ├── ai/                    # STT (voiceTranscription)
│   │   ├── env/env.ts             # 환경변수 파싱 (zod)
│   │   ├── sdk.ts                 # SessionManager (JWT 서명/검증)
│   │   ├── oauth.ts               # Express OAuth 라우터 (Google + 이메일)
│   │   ├── llm.ts                 # LLM 호출 (Groq)
│   │   └── logger.ts              # Pino 로거
│   ├── modules/
│   │   ├── crm/
│   │   │   ├── sale/              # 영업일지 (router/service/repo/dto)
│   │   │   ├── schedule/          # 일정
│   │   │   ├── order/             # 수주
│   │   │   ├── shipment/          # 납품
│   │   │   ├── client/            # 고객사
│   │   │   ├── file/              # 파일 (presigned upload, STT)
│   │   │   └── dashboard/         # 대시보드 통계
│   │   ├── org/
│   │   │   └── company/           # 회사/멤버십/초대
│   │   ├── billing/               # 플랜/구독
│   │   └── ai/token/              # AI 토큰 차감
│   ├── jopbs/                     # 백그라운드 작업 (billing sweep, AI worker, 파일 정리)
│   └── storage.ts                 # R2 스토리지 (put/get/delete/presigned)
│
├── drizzle/
│   ├── schema/                    # 테이블 정의 (도메인별 파일)
│   │   └── index.ts               # schema barrel 파일
│   └── relations.ts               # 테이블 관계
│
└── shared/
    ├── const.ts                   # 공유 상수 (에러 메시지 등)
    └── _core/errors.ts            # HttpError 클래스
```

---

## 코딩 컨벤션

### TypeScript
- `type` 선호, `interface`는 꼭 필요한 경우만
- **`enum` 절대 금지** → `mysqlEnum`(DB용) 또는 문자열 리터럴 유니온 사용
- Zod v4로 입력 유효성 검사
- `any` 타입 사용 금지

### tRPC
- 모든 API는 `server/modules/` 하위 도메인 파일에 작성
- `publicProcedure` / `authedProcedure` / `protectedProcedure` / `companyAdminProcedure` 구분 필수
- 입력은 반드시 Zod 스키마로 검증
- 서비스 에러는 `throwAppError()` 사용 (`TRPCError` 직접 throw 금지)

### 에러 처리
- **서버**: `server/core/trpc/appError.ts`의 `throwAppError()` 사용
  ```ts
  throwAppError({ tRPCCode: "NOT_FOUND", appCode: "FILE_NOT_FOUND", message: "...", displayType: "toast" })
  ```
- **클라이언트**: `client/src/lib/handleApiError.ts`의 `handleApiError(e)` 사용
  ```ts
  } catch (e) { handleApiError(e); }
  ```
- **브라우저 전용 에러** (마이크 권한, 파일 형식, presigned fetch): 직접 `toast.error()` 처리

### Drizzle ORM
- 스키마 변경 후 반드시 `pnpm db:push` 실행
- `drizzle/schema/index.ts`에서 타입 export (`$inferSelect`, `$inferInsert`)

### React
- 함수형 컴포넌트 + 훅 패턴
- 페이지 컴포넌트: `client/src/pages/`
- 도메인 VM 훅: `client/src/hooks/focuswin/<도메인>/`
- 공유 컴포넌트: `client/src/components/focuswin/common/`
- shadcn/ui 컴포넌트: `client/src/components/ui/` (직접 수정 가능)

### 금지 사항
- `console.log` — 디버그 후 반드시 제거
- `any` 타입
- `enum` 키워드 (문자열 리터럴 유니온 사용)
- npm / yarn (pnpm만)
- 불필요한 `useEffect` 남용
- `TRPCError` 직접 throw (throwAppError 사용)

---

## 도메인 모델 (주요 테이블)

| 테이블 | 한국어 | 설명 |
|--------|--------|------|
| `CORE_USER` | 사용자 | 영업사원 계정 (passwd_hash 포함) |
| `CORE_COMPANY` | 회사 | 테넌트 단위 |
| `CORE_COMPANY_USER` | 멤버십 | 사용자↔회사 관계 + 역할(owner/admin/member) |
| `CORE_COMPANY_INVITE` | 초대 | 토큰 기반 초대장 (SHA-256 해시 저장) |
| `CORE_FILE` | 첨부파일 | R2 파일 메타데이터 |
| `CORE_FILE_LINK` | 파일 연결 | 파일 ↔ 도메인 엔티티 연결 |
| `CRM_CLIENT` | 고객사 | 거래처 정보 |
| `CRM_SALE` | 영업일지 | 방문/활동 기록 + AI 분석 결과 |
| `CRM_SALE_AUDIO_JOB` | AI 작업 큐 | STT/LLM 비동기 작업 (jobs_type: transcribe/analyze) |
| `CRM_SCHEDULE` | 일정 | 후속 조치 일정 |
| `CRM_ORDER` | 수주 | 계약/수주 정보 |
| `CRM_SHIPMENT` | 납품 | 납품/매출 정보 |

---

## 환경 변수

`.env` 파일 필요 (절대 커밋 금지):

```env
# 필수
DATABASE_URL=          # MySQL 연결 문자열
JWT_SECRET=            # JWT 서명 키

# Cloudflare R2
R2_ENDPOINT=           # https://{accountId}.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# 선택
OWNER_EMAIL=           # 최초 admin 지정
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
LLM_API_KEY=           # Groq API key
LLM_API_URL=           # 기본값: https://api.groq.com/openai/v1
LLM_MODEL=             # 기본값: llama-3.3-70b-versatile
STT_API_KEY=           # Groq API key (STT)
STT_MODEL=             # 기본값: whisper-large-v3-turbo
PORT=                  # 서버 포트 (기본값: 9000)
```

---

## 인증 흐름

- 세션: JWT(HS256) → HttpOnly 쿠키(`COOKIE_NAME`)에 저장
- `SessionPayload`: `{ userId: number, name: string }`
- 인증 엔드포인트 (Express, tRPC 외부):
  - `GET /api/auth/google` → Google OAuth 시작
  - `GET /api/auth/google/callback` → 콜백 처리
  - `POST /api/auth/register` → 이메일/비밀번호 가입
  - `POST /api/auth/login` → 이메일/비밀번호 로그인
  - `POST /api/auth/logout` → 쿠키 삭제
- 테넌트: `x-comp-id` 헤더로 전달 → 컨텍스트에서 멤버십 검증

---

## tRPC 라우터 구조

```
appRouter
├── system          # 헬스체크, 시스템 프로시저
├── auth.me         # 현재 사용자 조회
├── auth.logout     # 로그아웃
├── company.*       # 회사 관리, 멤버십, 초대
├── billing.*       # 플랜/구독
└── crm
    ├── client.*    # 고객사 CRUD
    ├── sale.*      # 영업일지 CRUD + AI 분석
    ├── schedule.*  # 일정 CRUD
    ├── order.*     # 수주 CRUD
    ├── shipment.*  # 납품 CRUD
    ├── dashboard.* # 통계
    └── files.*     # 파일 업로드(presigned), STT
```
