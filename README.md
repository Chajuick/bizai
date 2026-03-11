# Sales Manager

영업사원을 위한 AI 기반 CRM · 영업 관리 SaaS.
음성으로 영업일지를 작성하면 AI가 자동으로 거래처명, 금액, 후속 일정을 추출합니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 영업일지 | 텍스트 또는 음성으로 방문/활동 기록 작성 |
| AI 분석 | LLM이 일지 요약 · 거래처 · 금액 · 일정 자동 추출 |
| 음성 → 텍스트 | Whisper STT로 음성 파일을 한국어 텍스트로 변환 |
| 거래처 관리 | 거래처 정보 · 담당자 · 활동 이력 관리 |
| 일정 관리 | AI가 추출한 후속 미팅 자동 등록 + 수동 관리 |
| 수주 관리 | 제안 → 협상 → 확정 파이프라인 추적 |
| 납품 · 매출 | 납품 현황 및 수금 상태 관리 |
| 대시보드 | 이번 달 실적 · KPI 카드 |
| 팀 관리 | 회사 단위 멤버 초대 · 역할(owner/admin/member) 관리 |
| 플랜/빌링 | 무료 · pro · team · enterprise 플랜 |

---

## 기술 스택

```
Frontend   React 19 + Vite + TailwindCSS v4 + shadcn/ui + wouter + tRPC
Backend    Express.js + tRPC + Drizzle ORM
Database   MySQL
Storage    Cloudflare R2 (S3 호환)
AI/LLM     Groq — llama-3.3-70b-versatile
AI/STT     Groq — whisper-large-v3-turbo
Auth       JWT(jose) + Google OAuth 2.0 + 이메일/비밀번호
```

---

## 시작하기

### 사전 준비

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- MySQL 서버 (로컬 또는 클라우드)
- Cloudflare R2 버킷
- Groq API 키 (AI 기능 사용 시)

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
# 필수
DATABASE_URL=mysql://user:password@localhost:3306/bizai
JWT_SECRET=임의의-긴-문자열

# Cloudflare R2
R2_ENDPOINT=https://{ACCOUNT_ID}.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name

# 선택 — AI 기능
LLM_API_KEY=gsk_xxxx              # Groq API key (LLM)
LLM_API_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile
STT_API_KEY=gsk_xxxx              # Groq API key (STT, 생략 시 LLM_API_KEY 사용)
STT_MODEL=whisper-large-v3-turbo

# 선택 — Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret

# 선택
OWNER_EMAIL=admin@example.com     # 최초 admin 계정 이메일
PORT=3000
```

> `.env` 파일은 절대 Git에 커밋하지 마세요.

### 3. 데이터베이스 초기화

```bash
pnpm db:push
```

### 4. 개발 서버 실행

```bash
pnpm dev
```

`http://localhost:9000` 에서 확인.

---

## 개발 명령어

```bash
pnpm dev        # 개발 서버 (Express + Vite HMR)
pnpm build      # 프로덕션 빌드
pnpm start      # 프로덕션 서버 실행
pnpm check      # TypeScript 타입 체크
pnpm test       # 테스트 실행 (Vitest)
pnpm format     # 코드 포맷 (Prettier)
pnpm db:push    # DB 스키마 마이그레이션
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
│       ├── hooks/focuswin/        # 도메인별 ViewModel 훅
│       ├── lib/
│       │   ├── trpc.ts            # tRPC 클라이언트
│       │   ├── queryClient.ts     # TanStack Query + 전역 인증 리다이렉트
│       │   └── handleApiError.ts  # 공통 API 에러 처리
│       ├── pages/                 # 페이지 컴포넌트
│       └── router/                # 라우터 (wouter)
│
├── server/
│   ├── core/
│   │   ├── trpc/
│   │   │   ├── trpc.ts            # tRPC 초기화 + errorFormatter
│   │   │   ├── appError.ts        # 구조화 에러 (AppError + throwAppError)
│   │   │   ├── context.ts         # 요청 컨텍스트 (인증 · 테넌트 해석)
│   │   │   └── appRouters.ts      # 루트 라우터
│   │   ├── sdk.ts                 # SessionManager (JWT)
│   │   ├── oauth.ts               # 인증 Express 라우터
│   │   ├── llm.ts                 # LLM 호출 (Groq)
│   │   └── ai/voiceTranscription.ts  # STT
│   ├── modules/
│   │   ├── crm/                   # sale · schedule · order · shipment · client · file · dashboard
│   │   ├── org/company/           # 회사 · 멤버십 · 초대
│   │   ├── billing/               # 플랜/구독
│   │   └── ai/token/              # AI 토큰 차감
│   └── storage.ts                 # R2 스토리지
│
├── drizzle/
│   ├── schema/                    # 테이블 정의
│   └── relations.ts
│
└── shared/                        # 서버·클라이언트 공유 타입/상수
```

---

## 데이터베이스 스키마 (주요 테이블)

| 테이블 | 설명 |
|--------|------|
| `CORE_USER` | 사용자 (영업사원 계정) |
| `CORE_COMPANY` | 회사 (테넌트 단위) |
| `CORE_COMPANY_USER` | 멤버십 — 사용자 ↔ 회사 + 역할 |
| `CORE_INVITE` | 토큰 기반 초대장 |
| `CORE_FILE` | 첨부파일 메타데이터 (R2) |
| `CRM_CLIENT` | 거래처 (거래처) |
| `CRM_CONTACT` | 거래처 담당자 |
| `CRM_SALE` | 영업일지 + AI 분석 결과 |
| `CRM_SCHEDULE` | 일정 · 후속 액션 |
| `CRM_ORDER` | 수주 (제안 → 협상 → 확정) |
| `CRM_SHIPMENT` | 납품 · 매출 |

스키마 변경 후:
```bash
pnpm db:push
```

---

## 인증 흐름

1. **Google OAuth**: `/api/auth/google` → Google 인증 → 콜백 → 쿠키 발급
2. **이메일/비밀번호**: `POST /api/auth/register` 가입 → `POST /api/auth/login` 로그인 → 쿠키 발급
3. **세션**: JWT(HS256) HttpOnly 쿠키 — `{ userId, name }`
4. **테넌트**: `x-comp-id` 헤더 → 멤버십 검증 → `comp_idno` 컨텍스트 주입

---

## API 에러 처리

서버는 tRPC errorFormatter를 통해 구조화된 에러를 내려줍니다:

```json
{
  "error": {
    "data": {
      "appCode": "AUDIO_TOO_SHORT",
      "displayType": "toast",
      "retryable": true,
      "requestId": "abc-123"
    },
    "message": "음성이 너무 짧습니다."
  }
}
```

클라이언트는 `handleApiError(e)`로 일괄 처리합니다:
- `displayType: "toast"` → `toast.error(message)` 자동 호출
- `displayType: "inline"` → 호출부에서 직접 렌더링
- `displayType: "silent"` → 아무것도 하지 않음

---

## 프로덕션 배포

### 빌드

```bash
pnpm build
```

빌드 결과물:
- `dist/public/` — 프론트엔드 정적 파일
- `dist/index.js` — 서버 번들

### 실행

```bash
NODE_ENV=production node dist/index.js
```

### 권장 환경

- **서버**: Railway, Render, Fly.io, EC2 등 Node.js 지원 환경
- **데이터베이스**: PlanetScale, AWS RDS, Railway MySQL
- **스토리지**: Cloudflare R2 (이미 연동됨)
- **포트**: 기본 `3000`, 환경변수 `PORT`로 변경

---

## 테스트

```bash
pnpm test

# 특정 파일
pnpm vitest run server/salesManager.test.ts
pnpm vitest run server/auth.logout.test.ts
```
