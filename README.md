# Sales Manager

영업사원을 위한 AI 기반 CRM · 영업 관리 앱.
음성으로 영업일지를 작성하면 AI가 자동으로 고객명, 금액, 후속 일정을 추출합니다.

## 주요 기능

| 기능 | 설명 |
|------|------|
| 영업일지 | 텍스트 또는 음성으로 방문 기록 작성 |
| AI 분석 | Gemini 2.5 Flash가 일지 요약 · 일정 자동 추출 |
| 음성 녹음 | Whisper STT로 음성 → 텍스트 변환 |
| 고객사 관리 | 거래처 정보 및 활동 이력 관리 |
| 일정 관리 | 후속 미팅 · 할일 일정 추적 |
| 수주 관리 | 제안 → 협상 → 수주 파이프라인 |
| 납품 · 매출 | 납품 현황 및 청구 상태 관리 |
| 대시보드 | 이번 달 실적 · 매출 트렌드 차트 |

## 기술 스택

```
Frontend  React 19 + Vite + TailwindCSS v4 + shadcn/ui + wouter + tRPC
Backend   Express.js + tRPC + Drizzle ORM
Database  MySQL
Storage   Manus Forge (파일 업로드)
AI        Gemini 2.5 Flash (LLM) · Whisper (STT)
```

---

## 시작하기

### 사전 준비

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- MySQL 서버 (로컬 또는 클라우드)

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
# 데이터베이스
DATABASE_URL=mysql://user:password@localhost:3306/sales_manager

# 인증 (JWT 서명 키 — 임의의 긴 문자열)
JWT_SECRET=your-secret-key-here

# OAuth 서버 (Manus 플랫폼 제공)
OAUTH_SERVER_URL=https://your-oauth-server-url
OWNER_OPEN_ID=your-open-id

# Manus Forge API (LLM · STT · 스토리지)
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key

# 앱 ID
VITE_APP_ID=your-app-id
```

> `.env` 파일은 절대 Git에 커밋하지 마세요.

### 3. 데이터베이스 초기화

```bash
pnpm db:push
```

MySQL에 모든 테이블이 자동으로 생성됩니다.

### 4. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 `http://localhost:3000` 접속.

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
sales-manager/
├── client/                  # React SPA (프론트엔드)
│   └── src/
│       ├── pages/           # 라우트별 페이지 컴포넌트
│       ├── components/      # 공유 컴포넌트
│       │   └── ui/          # shadcn/ui 기본 컴포넌트
│       ├── hooks/           # 커스텀 훅
│       ├── lib/trpc.ts      # API 클라이언트 설정
│       └── App.tsx          # 라우터 설정
│
├── server/                  # Express 백엔드
│   ├── _core/               # 인프라 (tRPC, 인증, LLM, STT)
│   ├── routers/             # API 엔드포인트 (도메인별)
│   ├── routers.ts           # 전체 라우터 조합
│   └── db.ts                # DB 쿼리 함수
│
├── drizzle/
│   ├── schema.ts            # DB 테이블 정의
│   └── relations.ts         # 테이블 관계 정의
│
└── package.json
```

---

## 주요 화면 흐름

```
로그인 (OAuth)
  └─ 대시보드          이번 달 실적 요약
       ├─ 영업일지 목록
       │    └─ 새 일지 작성   [음성 녹음] 또는 텍스트 입력
       │         └─ AI 분석  고객명 · 금액 · 일정 자동 추출
       ├─ 고객사 관리    거래처 등록 · 이력 조회
       ├─ 일정 관리     일정 목록 · 완료 처리
       ├─ 수주 관리     파이프라인 상태 추적
       └─ 납품 · 매출   청구 현황 관리
```

---

## 데이터베이스 스키마

| 테이블 | 설명 |
|--------|------|
| `users` | 사용자 (영업사원 계정) |
| `clients` | 고객사 (거래처 정보) |
| `salesLogs` | 영업일지 (AI 분석 결과 포함) |
| `promises` | 일정 · 후속 액션 |
| `orders` | 수주 (제안 → 계약) |
| `deliveries` | 납품 · 매출 정보 |
| `attachments` | 첨부파일 (S3 메타데이터) |

스키마 변경 후 반드시 실행:
```bash
pnpm db:push
```

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

### 권장 배포 환경

- **서버**: Railway, Render, Fly.io, EC2 등
- **데이터베이스**: PlanetScale, AWS RDS, Railway MySQL
- **포트**: 기본 `3000`, 환경 변수 `PORT`로 변경 가능

---

## API 비용 (1인당 월 기준)

일 5건 처리 기준 추정값. 자세한 내용은 [`.claude/api-cost-analysis.md`](.claude/api-cost-analysis.md) 참조.

| API | 용도 | 월 비용 |
|-----|------|--------|
| Gemini 2.5 Flash | 영업일지 AI 분석 | ~$0.14 |
| Whisper STT | 음성 → 텍스트 | ~$0.53 |
| 파일 스토리지 | 음성·첨부 파일 | ~$0.00 |
| **합계** | | **~$0.67** |

---

## 테스트

```bash
pnpm test

# 특정 파일
pnpm vitest run server/salesManager.test.ts
pnpm vitest run server/auth.logout.test.ts
```

---

## 환경 변수 전체 목록

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `DATABASE_URL` | ✅ | MySQL 연결 문자열 |
| `JWT_SECRET` | ✅ | 세션 토큰 서명 키 |
| `OAUTH_SERVER_URL` | ✅ | OAuth 인증 서버 URL |
| `OWNER_OPEN_ID` | ✅ | 관리자 계정의 OpenID |
| `BUILT_IN_FORGE_API_URL` | ✅ | Forge API 기본 URL |
| `BUILT_IN_FORGE_API_KEY` | ✅ | Forge API 인증 키 |
| `VITE_APP_ID` | ✅ | 앱 식별자 |
| `PORT` | ❌ | 서버 포트 (기본값: 3000) |
