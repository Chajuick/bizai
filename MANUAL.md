# FocusWin Sales Manager — 통합 매뉴얼

> 버전: 1.0 | 작성일: 2026-03-07

---

## 목차

1. [사업 소개](#1-사업-소개)
2. [제품 소개](#2-제품-소개)
3. [사용자 가이드](#3-사용자-가이드)
4. [시스템 아키텍처](#4-시스템-아키텍처)
5. [DB 스키마](#5-db-스키마)
6. [API 구조](#6-api-구조)
7. [개발자 가이드](#7-개발자-가이드)
8. [운영 가이드](#8-운영-가이드)

---

## 1. 사업 소개

### 1.1 제품 개요

**FocusWin Sales Manager**는 영업사원을 위한 AI 기반 CRM·영업 관리 SaaS입니다.
현장 방문 후 음성 녹음 한 번으로 고객 정보, 후속 일정, 수주 가능성까지 자동 정리되는 것이 핵심 가치입니다.

### 1.2 해결하는 문제

| 기존 불편함 | FocusWin 해결 방식 |
|------------|-------------------|
| 영업 일지 수기 작성 부담 | 음성 녹음 → 자동 텍스트 변환 + AI 요약 |
| 고객 담당자 정보 흩어짐 | AI가 통화/미팅에서 담당자 자동 추출·저장 |
| 후속 일정 누락 | AI가 대화에서 약속 추출 → 일정 자동 생성 |
| 수주 현황 파악 어려움 | 수주·납품·매출 파이프라인 한눈에 관리 |
| 팀 영업 현황 불투명 | 워크스페이스 기반 팀원 활동 통합 관리 |

### 1.3 핵심 플로우

```
[현장 방문]
    ↓
[음성 녹음 / 메모 입력]
    ↓
[Whisper STT] ← Groq API
    ↓
[LLM 분석] ← Groq (llama-3.3-70b-versatile)
    ↓ 자동 추출
┌─────────────────────────────────────────┐
│  • 미팅 요약     • 담당자 정보           │
│  • 후속 일정     • 예상 금액             │
│  • 고객사 매칭   • 액션 주체(영업/고객)  │
└─────────────────────────────────────────┘
    ↓ 자동 저장
[영업일지 + 일정 + 고객사 정보 업데이트]
```

### 1.4 요금제

| 플랜 | 좌석 | 월 AI 토큰 | 특징 |
|------|------|-----------|------|
| Free | 기본 | 10,000 | 개인 사용자용 |
| Pro | 확장 | 50,000 | 개인 전문가용 |
| Team | 팀 | 200,000 | 팀 협업 |
| Enterprise | 무제한 | 커스텀 | 대기업/커스텀 |

> AI 토큰 = STT(음성 초당 10토큰) + LLM 분석(건당 약 1,500토큰) 기준

---

## 2. 제품 소개

### 2.1 주요 기능

#### 영업일지 (Sales Log)
- 음성 녹음 또는 텍스트로 현장 미팅 기록
- Whisper STT로 음성 → 텍스트 자동 변환
- LLM AI 분석: 요약·담당자·일정·금액 자동 추출
- 고객사 자동 매칭 및 연결
- 첨부파일(사진·계약서 등) 관리

#### 고객사 관리 (Client CRM)
- 고객사 기본 정보(업종·주소·메모)
- 복수 담당자 관리(이름·직책·연락처·이메일)
- 대표 담당자 지정
- AI 분석 결과로 담당자 자동 업데이트

#### 일정 관리 (Schedule)
- AI가 영업일지에서 약속 자동 추출·생성
- 수동 일정 등록
- 상태 관리: 예정 → 완료 / 취소 / 지연
- 액션 주체 표시(본인/고객/공동)
- 브라우저 Web Notification 알림(임박·지연)

#### 수주 관리 (Order)
- 영업 파이프라인 단계 관리: 제안 → 협상 → 확정
- 고객사 연결, 금액 관리
- 예상 납기일 추적

#### 납품·매출 관리 (Shipment)
- 수주 → 납품 생성
- 상태: 대기 → 납품완료 → 청구 → 수금
- 매출 집계 및 대시보드 연동

#### 대시보드 (Dashboard)
- 이번 달 수주액·매출액 요약
- 임박 일정 / 지연 일정 현황
- 팀 전체 영업 활동 현황

#### 워크스페이스 (Team)
- 이메일 초대 / 링크 초대
- 역할 관리: owner / admin / member
- 멀티 워크스페이스 전환

### 2.2 화면 구성

```
/ (랜딩)
/login              로그인
/register           이메일 가입

/dashboard          대시보드 (메인)
/sale-list          영업일지 목록
/sale-list/:id      영업일지 상세
/sale-new           영업일지 등록

/schedule           일정 목록

/client-list        고객사 목록
/client-list/:id    고객사 상세
/client-new         고객사 등록

/order-list         수주 목록
/shipment-list      납품·매출 목록

/settings           설정 허브
/settings/team      팀 멤버 관리
/settings/billing   요금제·결제
/settings/usage     AI 사용량
```

### 2.3 AI 분석 결과 구조

```json
{
  "summary": "2026-03-05 ABC전자 김철수 과장 미팅. ERP 시스템 도입 검토 중.",
  "client_name": "ABC전자",
  "contacts": [
    { "name": "김철수", "role": "과장", "phone": "010-1234-5678", "email": "kim@abc.com" }
  ],
  "appointments": [
    {
      "title": "ERP 시스템 견적서 전달",
      "date": "2026-03-15T10:00:00",
      "desc": "견적서 준비 후 이메일 발송",
      "action_owner": "self"
    }
  ],
  "pricing": {
    "primary": { "amount": 50000000, "type": "one_time" }
  }
}
```

---

## 3. 사용자 가이드

### 3.1 시작하기

#### 계정 생성
1. `/register` 접속 → 이름·이메일·비밀번호 입력
2. 회원가입 완료 시 워크스페이스 자동 생성 + Free Plan 적용

#### 구글 계정으로 로그인
1. 로그인 페이지 → "Google로 시작하기" 클릭
2. Google 계정 인증 완료

#### 워크스페이스 전환
- 상단 워크스페이스 셀렉터에서 소속 팀 전환

---

### 3.2 영업일지 작성

#### 음성 녹음으로 작성 (추천)
1. 영업일지 등록 페이지 → 마이크 버튼 클릭
2. 현장 대화·미팅 내용 녹음 (최대 16MB)
3. 녹음 완료 → 자동 업로드
4. "음성 변환" 버튼 → Whisper STT 변환 (30초~1분 소요)
5. 변환된 텍스트 확인·수정 가능
6. "AI 분석" 버튼 → LLM 분석 실행 (비동기, 3~10초 후 자동 갱신)
7. 분석 완료 후: 요약·담당자·일정 확인 후 저장

#### 텍스트로 작성
1. 영업일지 등록 → 방문일시·고객사·메모 입력
2. 저장 후 "AI 분석" 버튼으로 텍스트 기반 분석 가능

#### AI 분석 결과 활용
- **요약**: 미팅 핵심 내용 자동 요약
- **담당자**: 추출된 담당자를 고객사에 자동 등록
- **일정**: 약속이 자동 일정으로 생성됨 (일정 탭에서 확인)
- **고객사 연결**: AI가 매칭한 고객사 연결 또는 신규 등록

---

### 3.3 일정 관리

#### 일정 상태
| 상태 | 설명 |
|------|------|
| 예정 (scheduled) | 아직 진행 전 |
| 완료 (completed) | 약속 이행 완료 |
| 취소 (canceled) | 취소된 일정 |
| 지연 (overdue) | 날짜 지났지만 미처리 |

#### 알림 설정
- 브라우저에서 알림 권한 허용 시 자동 활성화
- 임박 일정(12시간 이내): 실시간 알림
- 지연 일정: 접속 시 알림
- 이번 주 일정: 금요일 리마인드
- 다음 주 일정: 화요일 리마인드

---

### 3.4 수주 파이프라인

```
제안 (proposal)
    ↓
협상 (negotiation)
    ↓
확정 (confirmed) ─── → 납품 생성
    또는
취소 (canceled)
```

#### 납품 상태
```
대기 (pending)
    ↓
납품완료 (delivered)
    ↓
청구 (invoiced)
    ↓
수금 (paid) ──── 대시보드 매출 집계
```

---

### 3.5 팀 관리

#### 팀원 초대
1. 설정 → 팀 관리 → 초대 링크 생성 또는 이메일 초대
2. 초대받은 사람이 링크 클릭 → 계정 가입/로그인 → 워크스페이스 합류

#### 역할 권한

| 기능 | Member | Admin | Owner |
|------|--------|-------|-------|
| 본인 영업일지 CRUD | O | O | O |
| 팀원 영업일지 조회 | X | O | O |
| 팀원 초대 | X | O | O |
| 요금제 변경 | X | X | O |
| 워크스페이스 삭제 | X | X | O |

---

### 3.6 AI 사용량 관리

- 설정 → AI 사용량에서 월별 토큰 사용 현황 확인
- 잔여량 80% 소진 시: 경고 표시
- 한도 초과 시: AI 분석 불가 (플랜 업그레이드 필요)

---

## 4. 시스템 아키텍처

### 4.1 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 19 + Vite + TailwindCSS v4 + shadcn/ui |
| 라우팅 | wouter |
| 상태관리 | TanStack Query v5 |
| API 통신 | tRPC (타입 안전 RPC) |
| Backend | Express.js + tRPC |
| ORM | Drizzle ORM |
| DB | MySQL |
| Storage | Cloudflare R2 (S3 SDK 호환) |
| STT | Groq Whisper (whisper-large-v3-turbo) |
| LLM | Groq (llama-3.3-70b-versatile) |
| 인증 | JWT (HS256, HttpOnly Cookie) + Google OAuth 2.0 |
| 패키지 관리 | pnpm |

### 4.2 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
│   React SPA (Vite)                                      │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│   │Dashboard │ │ Sale     │ │Schedule  │ │Settings  │  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                 tRPC Client + TanStack Query             │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS (Cookie: JWT)
┌───────────────────────▼─────────────────────────────────┐
│                   Express Server                        │
│  ┌─────────────┐  ┌──────────────────────────────────┐  │
│  │ /api/auth/* │  │ /api/trpc/*                      │  │
│  │ Google OAuth│  │ tRPC Router (타입 안전 API)       │  │
│  │ Email Auth  │  │ ├── company.*                    │  │
│  └─────────────┘  │ ├── billing.*                    │  │
│                   │ └── crm.*                        │  │
│  ┌─────────────┐  │     ├── sale.*                   │  │
│  │Background   │  │     ├── schedule.*               │  │
│  │Jobs         │  │     ├── client.*                 │  │
│  │• Billing    │  │     ├── order.*                  │  │
│  │  Sweep      │  │     ├── shipment.*               │  │
│  │• AI Worker  │  │     ├── files.*                  │  │
│  │• Stale Job  │  │     └── dashboard.*              │  │
│  │  Recovery   │  └──────────────────────────────────┘  │
│  └─────────────┘                                        │
└───────┬─────────────────────┬───────────────────────────┘
        │                     │
┌───────▼──────┐   ┌──────────▼─────────────────────────┐
│   MySQL DB   │   │        External APIs               │
│  (Drizzle)   │   │  ┌─────────────────────────────┐   │
│              │   │  │ Groq API                    │   │
│  19 Tables   │   │  │  • Whisper STT              │   │
└──────────────┘   │  │  • LLaMA LLM               │   │
                   │  └─────────────────────────────┘   │
                   │  ┌─────────────────────────────┐   │
                   │  │ Cloudflare R2               │   │
                   │  │  • 파일 저장 (음성·첨부)     │   │
                   │  └─────────────────────────────┘   │
                   └────────────────────────────────────┘
```

### 4.3 AI 비동기 파이프라인

```
[사용자] POST /crm.sale.transcribe  또는  /crm.sale.analyze
    ↓
[Server] CRM_SALE_AUDIO_JOB 생성(queued) + 토큰 선차감
         jobs_type = "transcribe" | "analyze"
    ↓ 즉시 응답 { jobs_idno }
[Client] 3초마다 polling (ai_status)

[Background Worker] 5초마다 실행 (최대 10 job/사이클)
    ↓ queued job 조회 (오래된 순)
    ↓ jobs_type = "transcribe" → Groq Whisper STT
      jobs_type = "analyze"    → Groq LLaMA LLM
    ↓ jobs_stat = running → (처리) → done | failed
    ↓ ai_status = completed | failed

[Client] polling 감지 → 화면 자동 갱신
```

### 4.4 인증 흐름

```
[로그인] POST /api/auth/login
    ↓
[Server] bcrypt 검증 → JWT 생성 (HS256, 7일)
    ↓
[Response] Set-Cookie: session=<JWT> (HttpOnly, Secure)

[API 요청] Cookie 자동 전송
    ↓
[tRPC Context] JWT 검증 → user 정보 추출
    ↓ x-comp-id 헤더 확인 → 워크스페이스 멤버십 검증
    ↓ company_role 부여 (owner/admin/member)
```

### 4.5 파일 업로드 흐름 (Presigned URL)

```
[Client] POST /crm.files.presignedPut → R2 Presigned URL 발급
    ↓
[Client] PUT <Presigned URL> (직접 R2 업로드)
    ↓
[Client] POST /crm.files.confirmUpload → DB 메타데이터 저장
    ↓
[AI 분석 시] Server가 R2에서 파일 다운로드 → Groq STT
```

### 4.6 보안 구성

| 항목 | 구성 |
|------|------|
| 인증 | JWT HS256, HttpOnly Cookie |
| 격리 | 모든 API는 comp_idno 기반 테넌트 격리 |
| CORS | 프로덕션: CLIENT_URL 기준 제한 |
| 보안 헤더 | Helmet (CSP, HSTS 등) |
| Rate Limiting | Auth: 분당 5~10회 / AI API: 분당 10회 |
| 파일 격리 | file_idno + comp_idno 이중 검증 |
| 타이밍 공격 방지 | 로그인 실패 시 항상 bcrypt 수행 |

---

## 5. DB 스키마

### 5.1 테이블 전체 목록

| 테이블 | 한국어명 | 설명 |
|--------|---------|------|
| `CORE_USER` | 사용자 | 영업사원 계정 |
| `CORE_COMPANY` | 회사(테넌트) | 워크스페이스 단위 |
| `CORE_COMPANY_USER` | 멤버십 | 사용자↔회사 관계 + 역할 |
| `CORE_COMPANY_INVITE` | 초대 | 토큰 기반 초대장 |
| `CORE_FILE` | 파일 | R2 업로드 파일 메타데이터 |
| `CORE_FILE_LINK` | 파일 연결 | 파일↔도메인 엔티티 연결 |
| `BILLING_PLAN` | 요금제 | free/pro/team/enterprise |
| `BILLING_SUBSCRIPTION` | 구독 | 회사별 현재 구독 상태 |
| `AI_TOKEN_BALANCE` | AI 잔액 | 회사별 AI 토큰 잔액 캐시 |
| `AI_TOKEN_LEDGER` | AI 원장 | 토큰 입출금 이력 |
| `AI_USAGE_EVENT` | AI 사용 이벤트 | STT/LLM 사용 로그 |
| `AI_USAGE_MONTH` | AI 월별 집계 | 월별 사용량 집계 |
| `CRM_CLIENT` | 고객사 | 거래처 정보 |
| `CRM_CLIENT_CONT` | 고객사 담당자 | 다수 담당자 관리 |
| `CRM_SALE` | 영업일지 | 방문/활동 기록 + AI 분석 |
| `CRM_SALE_AUDIO_JOB` | AI 작업 큐 | STT/LLM 비동기 작업 |
| `CRM_SCHEDULE` | 일정 | 후속 조치 일정 |
| `CRM_ORDER` | 수주 | 계약/수주 정보 |
| `CRM_SHIPMENT` | 납품/매출 | 납품 및 매출 정보 |

---

### 5.2 Core — 사용자 / 회사

#### CORE_USER
```
PK  user_idno    INT AUTO_INCREMENT
    open_idno    VARCHAR(200)         Google subject / 이메일
    user_name    VARCHAR(100)         표시 이름
    mail_idno    VARCHAR(320) UNIQUE  이메일 (중복 방지)
    passwd_hash  VARCHAR(255)         이메일 가입자 bcrypt 해시
    user_auth    VARCHAR(30)          시스템 권한 (user/admin)
    logi_mthd    VARCHAR(20)          google | email
    last_sign    TIMESTAMP            마지막 로그인
    [audit]      crea_date, modi_date
```

#### CORE_COMPANY
```
PK  comp_idno    INT AUTO_INCREMENT
    comp_name    VARCHAR(200)         워크스페이스명
    bizn_numb    VARCHAR(20)          사업자번호 (랜덤 생성)
    [audit]      crea_*, modi_*
```

#### CORE_COMPANY_USER (멤버십)
```
PK  cump_idno    INT AUTO_INCREMENT
FK  comp_idno    INT                  회사
FK  user_idno    INT                  사용자
    role_code    ENUM(owner,admin,member)
    status_code  ENUM(active,pending,removed)
    [audit]
INDEX: (comp_idno, user_idno) UNIQUE
```

#### CORE_COMPANY_INVITE (초대)
```
PK  invt_idno    INT AUTO_INCREMENT
FK  comp_idno    INT
    invt_kind    ENUM(link,email)
    invt_stat    ENUM(active,used,revoked,expired)
    role_code    ENUM(owner,admin,member)   초대받을 역할
    invt_tokn    VARCHAR(64)  UNIQUE        토큰
    expr_date    TIMESTAMP                  만료 시각
    invt_mail    VARCHAR(320)               이메일 초대 시 대상
    used_idno    INT                        수락한 user_idno
    [audit]
```

---

### 5.3 Core — 파일

#### CORE_FILE
```
PK  file_idno    INT AUTO_INCREMENT
FK  comp_idno    INT                  테넌트 격리
    upld_idno    INT                  업로더 user_idno
    file_name    VARCHAR(300)         원본 파일명
    file_extn    VARCHAR(20)          확장자
    mime_type    VARCHAR(120)         MIME 타입
    file_size    INT                  파일 크기(byte)
    file_hash    VARCHAR(64)          sha256
    stor_drve    VARCHAR(32)          s3/r2/local
    file_path    VARCHAR(500)         스토리지 키
    dura_secs    INT                  음성 길이(초)
    dele_yesn    INT DEFAULT 0        소프트 삭제
    [audit]
INDEX: (comp_idno), (comp_idno, upld_idno)
```

#### CORE_FILE_LINK
```
PK  link_idno    INT AUTO_INCREMENT
FK  comp_idno    INT
FK  file_idno    INT
    refe_type    ENUM(sale_info,client,promise,order,delivery)
    refe_idno    INT                  대상 엔티티 PK
    purp_type    ENUM(general,sale_audio,sale_image,contract,quote)
    sort_orde    INT DEFAULT 0
    [audit]
```

---

### 5.4 Billing — 요금제 / 구독

#### BILLING_PLAN
```
PK  plan_idno    INT AUTO_INCREMENT
    plan_code    ENUM(free,pro,team,enterprise)  UNIQUE
    plan_name    VARCHAR(80)
    seat_limt    INT           기본 좌석 제한
    tokn_mont    INT           월 기본 AI 토큰
```

#### BILLING_SUBSCRIPTION
```
PK  subs_idno    INT AUTO_INCREMENT
FK  comp_idno    INT UNIQUE        회사당 1개 (DM-1)
FK  plan_idno    INT
    subs_stat    ENUM(active,trialing,canceled,past_due,inactive)
    prov_name    VARCHAR(40)   결제 프로바이더 (stripe 등)
    prov_subs    VARCHAR(120)  프로바이더 구독 ID
    seat_ovrr    INT           좌석 커스텀 override
    tokn_ovrr    INT           토큰 커스텀 override
    star_date    TIMESTAMP     현재 기간 시작
    ends_date    TIMESTAMP     현재 기간 종료
    [audit]
```

---

### 5.5 AI — 토큰 / 사용량

#### AI_TOKEN_BALANCE (잔액 캐시)
```
FK  comp_idno    INT UNIQUE    회사당 1개
    bala_tokn    INT           현재 잔여 토큰
```

> 원자적 UPDATE: `SET bala_tokn = bala_tokn - N WHERE bala_tokn >= N`

#### AI_TOKEN_LEDGER (원장)
```
PK  ldgr_idno    INT AUTO_INCREMENT
FK  comp_idno    INT
    user_idno    INT
    delt_tokn    INT           차감(음수) / 충전(양수)
    blnc_afer    INT           처리 후 잔액
    ldgr_reas    ENUM(plan_monthly_grant,topup_purchase,usage_chat,usage_stt,usage_llm,admin_adjust)
    [audit]
```

#### AI_USAGE_EVENT (사용 로그)
```
PK  evnt_idno    INT AUTO_INCREMENT
FK  comp_idno    INT
    user_idno    INT
    feat_code    ENUM(chat,stt,llm)
    mode_name    VARCHAR(80)   모델명
    tokn_inpt    INT           입력 토큰
    tokn_outs    INT           출력 토큰
    tokn_tota    INT           합계
    meta_json    JSON          추가 메타
    crea_date    TIMESTAMP
```

---

### 5.6 CRM — 핵심 도메인

#### CRM_CLIENT (고객사)
```
PK  clie_idno    INT AUTO_INCREMENT
FK  comp_idno    INT
    clie_name    VARCHAR(200) NOT NULL    고객사명
    indu_type    VARCHAR(100)             업종
    cont_name    VARCHAR(100)             대표 담당자명 (캐시)
    cont_tele    VARCHAR(50)              대표 연락처 (캐시)
    cont_mail    VARCHAR(320)             대표 이메일 (캐시)
    clie_addr    TEXT                     주소
    clie_memo    TEXT                     메모
    enab_yesn    BOOLEAN DEFAULT true
    [audit]
UNIQUE: (comp_idno, clie_name)
```

#### CRM_CLIENT_CONT (고객사 담당자)
```
PK  cont_idno    INT AUTO_INCREMENT
FK  comp_idno    INT
FK  clie_idno    INT                 고객사
    cont_name    VARCHAR(100) NOT NULL
    cont_role    VARCHAR(100)        직책/업무
    cont_tele    VARCHAR(50)
    cont_mail    VARCHAR(320)
    cont_memo    TEXT
    main_yesn    BOOLEAN DEFAULT false    대표 담당자 여부
    enab_yesn    BOOLEAN DEFAULT true
    [audit]
UNIQUE: (comp_idno, clie_idno, cont_mail)
UNIQUE: (comp_idno, clie_idno, cont_tele)
```

#### CRM_SALE (영업일지)
```
PK  sale_idno    INT AUTO_INCREMENT
FK  comp_idno    INT
    owne_idno    INT NOT NULL          작성자
    clie_idno    INT                   고객사 (옵션)
    clie_name    VARCHAR(200)          고객사명 스냅샷
    cont_name    VARCHAR(100)          담당자명 스냅샷
    cont_role    VARCHAR(100)
    cont_tele    VARCHAR(50)
    cont_mail    VARCHAR(320)
    sale_loca    VARCHAR(200)          방문 장소
    vist_date    TIMESTAMP NOT NULL    방문일시
    sale_pric    DECIMAL(15,2)         예상/실제 금액
    orig_memo    TEXT NOT NULL         원문 메모
    sttx_text    TEXT                  STT 변환 텍스트 (원본)
    edit_text    TEXT                  사용자 수정 텍스트
    aiex_summ    TEXT                  AI 요약
    aiex_text    JSON                  AI 추출 전체 결과
    aiex_done    BOOLEAN DEFAULT false AI 처리 완료
    ai_status    ENUM(pending,processing,completed,failed)
    enab_yesn    BOOLEAN DEFAULT true
    [audit]
INDEX: (comp_idno, vist_date)
INDEX: (comp_idno, owne_idno, vist_date)
INDEX: (comp_idno, clie_idno, vist_date)
```

#### CRM_SALE_AUDIO_JOB (AI 작업 큐)
```
PK  jobs_idno    INT AUTO_INCREMENT
FK  comp_idno    INT
    sale_idno    INT               대상 영업일지 (file-only transcribe 시 NULL)
    file_idno    INT               음성 파일 (텍스트 전용 분석 시 NULL)
    jobs_type    VARCHAR(20)       "analyze" | "transcribe" (기본: analyze)
    jobs_stat    ENUM(queued,running,done,failed)
    fail_mess    TEXT              실패 메시지
    sttx_text    TEXT              STT 결과
    aiex_sum     TEXT              AI 요약
    aiex_ext     JSON              AI 추출 결과
    sttx_name    VARCHAR(80)       STT 모델명
    llmd_name    VARCHAR(80)       LLM 모델명
    meta_json    JSON              { audioSeconds, tokensIn, tokensOut }
    reqe_date    TIMESTAMP NOT NULL 요청 시각
    fini_date    TIMESTAMP         완료 시각
    [audit]
UNIQUE: (comp_idno, sale_idno, file_idno, jobs_type)
INDEX: (comp_idno, sale_idno)
INDEX: (comp_idno, file_idno)
INDEX: (comp_idno, jobs_stat, reqe_date)
```

#### CRM_SCHEDULE (일정)
```
PK  sche_idno    INT AUTO_INCREMENT
FK  comp_idno    INT
    owne_idno    INT NOT NULL       담당자
    sale_idno    INT                연결 영업일지 (옵션)
    clie_idno    INT                연결 고객사 (옵션)
    clie_name    VARCHAR(200)       고객명 스냅샷
    sche_name    VARCHAR(300) NOT NULL  제목
    sche_desc    TEXT               설명
    sche_pric    DECIMAL(15,2)      금액 (옵션)
    sche_date    TIMESTAMP NOT NULL 예정 일시
    stat_code    ENUM(scheduled,completed,canceled,overdue)
    actn_ownr    VARCHAR(16)        self/client/shared
    remd_sent    BOOLEAN DEFAULT false 리마인드 발송 여부
    auto_gene    BOOLEAN DEFAULT false AI 자동 생성 여부
    aiex_keys    VARCHAR(64)        AI 생성 키 (중복 방지)
    enab_yesn    BOOLEAN DEFAULT true
    [audit]
INDEX: (comp_idno, sche_date)
INDEX: (comp_idno, owne_idno, sche_date)
INDEX: (comp_idno, stat_code, sche_date)
```

#### CRM_ORDER (수주)
```
PK  orde_idno    INT AUTO_INCREMENT
FK  comp_idno    INT
    owne_idno    INT NOT NULL       담당자
    clie_idno    INT                고객사 (옵션)
    sale_idno    INT                연결 영업일지 (옵션)
    clie_name    VARCHAR(200) NOT NULL 고객명 스냅샷
    prod_serv    VARCHAR(300) NOT NULL 제품/서비스명
    orde_pric    DECIMAL(15,2) NOT NULL 수주 금액
    stat_code    ENUM(proposal,negotiation,confirmed,canceled)
    ctrt_date    TIMESTAMP          계약일
    expd_date    TIMESTAMP          예상 납기
    orde_memo    TEXT
    enab_yesn    BOOLEAN DEFAULT true
    [audit]
INDEX: (comp_idno), (comp_idno, stat_code), (comp_idno, owne_idno)
```

#### CRM_SHIPMENT (납품/매출)
```
PK  ship_idno    INT AUTO_INCREMENT
FK  comp_idno    INT
    owne_idno    INT NOT NULL
    orde_idno    INT NOT NULL       수주 (필수)
    clie_idno    INT                고객사
    clie_name    VARCHAR(200) NOT NULL 고객명 스냅샷
    stat_code    ENUM(pending,delivered,invoiced,paid)
    ship_date    TIMESTAMP          납품일
    invc_date    TIMESTAMP          청구일
    paid_date    TIMESTAMP          수금일
    ship_pric    DECIMAL(15,2) NOT NULL 매출 금액
    ship_memo    TEXT
    enab_yesn    BOOLEAN DEFAULT true
    [audit]
INDEX: (comp_idno), (comp_idno, stat_code), (comp_idno, stat_code, paid_date)
```

### 5.7 ERD 관계도

```
CORE_COMPANY ──< CORE_COMPANY_USER >── CORE_USER
     │
     ├── BILLING_SUBSCRIPTION ── BILLING_PLAN
     │
     ├── AI_TOKEN_BALANCE
     ├── AI_TOKEN_LEDGER
     ├── AI_USAGE_EVENT
     │
     ├── CRM_CLIENT ──< CRM_CLIENT_CONT
     │       │
     ├── CRM_SALE ──< CRM_SALE_AUDIO_JOB
     │       │
     ├── CRM_SCHEDULE
     │
     ├── CRM_ORDER ──< CRM_SHIPMENT
     │
     └── CORE_FILE ──< CORE_FILE_LINK
```

> 모든 CRM 테이블은 `comp_idno`로 테넌트 격리됨.
> FK는 논리적 참조 (물리 FK 제약 미적용, 서비스 레이어에서 검증).

---

## 6. API 구조

### 6.1 인증 엔드포인트 (Express REST)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/auth/google` | Google OAuth 시작 |
| GET | `/api/auth/google/callback` | Google OAuth 콜백 |
| POST | `/api/auth/register` | 이메일/비밀번호 가입 |
| POST | `/api/auth/login` | 이메일/비밀번호 로그인 |
| POST | `/api/auth/logout` | 로그아웃 (쿠키 삭제) |

### 6.2 tRPC 라우터

```
appRouter
├── system.health                   헬스체크
├── auth.me                         현재 사용자 조회
├── auth.logout                     로그아웃
│
├── company.getMyContext            워크스페이스 컨텍스트
├── company.getMyCompanies          소속 워크스페이스 목록
├── company.create                  워크스페이스 생성
├── company.getMembers              팀원 목록
├── company.updateMemberRole        역할 변경
├── company.removeMember            멤버 제거
├── company.invite.*                초대 관리
│
├── billing.getPlans                요금제 목록
├── billing.getSummary              현재 구독 요약
├── billing.getUsageSummary         AI 사용량
├── billing.changePlan              플랜 변경
├── billing.cancelSubscription      구독 해지
│
└── crm
    ├── client.list                 고객사 목록
    ├── client.get                  고객사 상세
    ├── client.create               고객사 등록
    ├── client.update               고객사 수정
    ├── client.delete               고객사 삭제
    ├── client.listContacts         담당자 목록
    ├── client.addContact           담당자 추가
    ├── client.updateContact        담당자 수정
    │
    ├── sale.list                   영업일지 목록
    ├── sale.get                    영업일지 상세
    ├── sale.create                 영업일지 등록
    ├── sale.update                 영업일지 수정
    ├── sale.delete                 영업일지 삭제
    ├── sale.transcribe             음성 STT 변환 (비동기)
    ├── sale.analyze                AI 분석 실행 (비동기)
    ├── sale.analyzeResult          AI 분석 결과 조회
    ├── sale.patchScheduleClient    일정·고객 연결 업데이트
    │
    ├── schedule.list               일정 목록
    ├── schedule.get                일정 상세
    ├── schedule.create             일정 등록
    ├── schedule.update             일정 수정
    ├── schedule.delete             일정 삭제
    │
    ├── order.list                  수주 목록
    ├── order.create                수주 등록
    ├── order.update                수주 수정
    │
    ├── shipment.list               납품 목록
    ├── shipment.create             납품 등록
    ├── shipment.update             납품 수정
    │
    ├── dashboard.getSummary        대시보드 통계
    │
    └── files.getPresignedPut       R2 Presigned URL 발급
        files.confirmUpload         업로드 확인
        files.listByRef             파일 목록 조회
        files.delete                파일 삭제
        files.transcribeFile        파일 STT (직접)
```

### 6.3 tRPC 프로시저 권한

| 타입 | 설명 |
|------|------|
| `publicProcedure` | 인증 불필요 (헬스체크 등) |
| `authedProcedure` | JWT 인증 필요 |
| `protectedProcedure` | 인증 + 워크스페이스 필요 (x-comp-id) |
| `companyAdminProcedure` | 인증 + 워크스페이스 + admin/owner 역할 |

---

## 7. 개발자 가이드

### 7.1 개발 환경 설정

```bash
# 저장소 클론
git clone <repo>
cd bizai

# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env
# .env 편집 (아래 환경변수 섹션 참조)

# DB 마이그레이션
pnpm db:push

# 개발 서버 시작
pnpm dev      # http://localhost:9000
```

### 7.2 환경 변수

```env
# 필수
DATABASE_URL=mysql://user:pass@host:3306/dbname
JWT_SECRET=your-secret-key-min-32-chars

# Cloudflare R2 (파일 스토리지)
R2_ENDPOINT=https://{accountId}.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Groq AI (LLM + STT)
LLM_API_KEY=
STT_API_KEY=

# 선택
OWNER_EMAIL=          최초 admin 이메일
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
LLM_API_URL=          기본값: https://api.groq.com/openai/v1
LLM_MODEL=            기본값: llama-3.3-70b-versatile
STT_API_URL=          기본값: https://api.groq.com/openai/v1
STT_MODEL=            기본값: whisper-large-v3-turbo
CLIENT_URL=           프로덕션 CORS origin (예: https://app.example.com)
DB_POOL_SIZE=20       DB 연결 풀 크기
PORT=9000
```

### 7.3 주요 스크립트

```bash
pnpm dev          # 개발 서버 (Express + Vite HMR)
pnpm build        # 프로덕션 빌드
pnpm check        # TypeScript 타입 체크
pnpm test         # 테스트 실행 (vitest)
pnpm format       # Prettier 포맷
pnpm db:push      # DB 스키마 적용 (generate + migrate)
```

### 7.4 프로젝트 구조

```
bizai/
├── client/src/
│   ├── _core/hooks/       인증 훅 (useAuth)
│   ├── components/
│   │   ├── ui/            shadcn/ui 기본 컴포넌트
│   │   └── focuswin/      앱 전용 컴포넌트
│   │       ├── app/       레이아웃, VoiceRecorder
│   │       ├── common/    공통 UI (card, modal, badge)
│   │       └── page/      도메인별 페이지 컴포넌트
│   ├── hooks/focuswin/    ViewModel 훅 (도메인별)
│   │   ├── sale/          영업일지 VM
│   │   ├── schedule/      일정 VM
│   │   ├── client/        고객사 VM
│   │   ├── order/         수주 VM
│   │   └── files/         파일/STT VM
│   ├── lib/
│   │   ├── trpc.ts        tRPC React 클라이언트
│   │   ├── queryClient.ts TanStack Query 설정
│   │   └── handleApiError.ts API 에러 처리
│   └── pages/             페이지 컴포넌트 (라우트 단위)
│
├── server/
│   ├── core/
│   │   ├── trpc/          tRPC 초기화, 컨텍스트, 에러
│   │   ├── db/            DB 연결 (Drizzle)
│   │   ├── auth/          사용자 저장소
│   │   ├── ai/            STT (voiceTranscription)
│   │   ├── env/env.ts     환경변수 파싱
│   │   ├── sdk.ts         JWT 세션 관리
│   │   ├── oauth.ts       인증 라우터
│   │   ├── llm.ts         LLM 호출
│   │   └── logger.ts      Pino 로거
│   ├── modules/
│   │   ├── crm/           CRM 도메인 (router/service/repo/dto)
│   │   ├── org/company/   회사/멤버십
│   │   ├── billing/       요금제/구독
│   │   └── ai/token/      AI 토큰 관리
│   ├── jopbs/             백그라운드 작업 (배치)
│   └── storage.ts         R2 스토리지
│
├── drizzle/
│   ├── schema/            테이블 정의 (도메인별)
│   ├── migrations/        마이그레이션 파일
│   └── relations.ts       테이블 관계
│
└── shared/
    ├── const.ts           공유 상수
    └── _core/errors.ts    공통 에러 클래스
```

### 7.5 코딩 컨벤션

| 항목 | 규칙 |
|------|------|
| 타입 | `type` 선호, `interface` 최소화 |
| Enum | **금지** → 문자열 리터럴 유니온 사용 |
| any | **금지** |
| 패키지 | **pnpm만 사용** |
| 에러(서버) | `throwAppError()` (TRPCError 직접 throw 금지) |
| 에러(클라이언트) | `handleApiError(e)` |
| DB 변경 | 스키마 수정 후 반드시 `pnpm db:push` |

### 7.6 새 tRPC 엔드포인트 추가 방법

```ts
// 1. DTO 정의 (server/modules/<domain>/<domain>.dto.ts)
export const MyInput = z.object({ id: z.number().int().positive() });

// 2. 서비스 로직 (server/modules/<domain>/<domain>.service.ts)
export const myService = {
  async doSomething(ctx: ServiceCtx, id: number) {
    const db = getDb();
    // ...
  }
};

// 3. 라우터 연결 (server/modules/<domain>/<domain>.router.ts)
export const myRouter = router({
  doSomething: protectedProcedure
    .input(MyInput)
    .mutation(({ ctx, input }) => myService.doSomething(svcCtxFromTrpc(ctx), input.id)),
});

// 4. 루트 라우터 등록 (server/core/trpc/appRouters.ts)
export const appRouter = router({
  // ...
  myDomain: myRouter,
});
```

---

## 8. 운영 가이드

### 8.1 백그라운드 작업 목록

| 작업 | 주기 | 설명 |
|------|------|------|
| `runBillingSweepJobs` | 10분 | 만료 구독 → Free 전환 |
| `runStaleJobRecovery` | 5분 | 10분 이상 running AI job → failed |
| `runOrphanFileCleanup` | 1시간 | 연결 안 된 파일 R2 삭제 |
| `runAiJobWorker` | 5초 | queued AI job 처리 |

### 8.2 환경변수 운영 체크리스트

- [ ] `JWT_SECRET` 최소 32자 이상 랜덤값
- [ ] `DATABASE_URL` 프로덕션 DB 연결
- [ ] `R2_*` 4개 변수 모두 설정
- [ ] `LLM_API_KEY` / `STT_API_KEY` Groq API 키
- [ ] `CLIENT_URL` 프론트엔드 도메인 (CORS)
- [ ] `DB_POOL_SIZE` 서버 스펙에 맞게 조정 (권장: 20~50)

### 8.3 모니터링 포인트

| 항목 | 확인 방법 |
|------|-----------|
| AI Job 처리 지연 | `CRM_SALE_AUDIO_JOB.jobs_stat = 'running'` 건수 |
| 토큰 잔액 고갈 | `AI_TOKEN_BALANCE.bala_tokn = 0` 회사 수 |
| 구독 만료 미처리 | `BILLING_SUBSCRIPTION` where `subs_stat='active' AND ends_date < NOW()` |
| 고아 파일 | `CORE_FILE` LEFT JOIN `CORE_FILE_LINK` IS NULL |

### 8.4 DB 마이그레이션 절차

```bash
# 1. schema 파일 수정
# 2. 마이그레이션 생성 + 적용
pnpm db:push

# 마이그레이션 파일 확인
ls drizzle/migrations/
```
