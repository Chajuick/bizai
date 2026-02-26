---
name: sales-manager-frontend
description: React 컴포넌트 구조, shadcn/ui 패턴, TailwindCSS v4 스타일링, 라우팅(wouter)을 설명합니다. 프론트엔드 작업 시 참조하세요.
---

# Sales Manager Frontend

## 기술 스택

- **React 19** — 함수형 컴포넌트, 훅
- **Vite 7** — 번들러, HMR
- **TailwindCSS v4** — 유틸리티 CSS
- **shadcn/ui** — UI 컴포넌트 라이브러리 (Radix UI 기반)
- **wouter** — 경량 클라이언트 사이드 라우터
- **framer-motion** — 애니메이션
- **react-hook-form + zod** — 폼 관리
- **recharts** — 차트 (Dashboard)
- **sonner** — 토스트 알림

## 라우팅 (wouter)

```typescript
// client/src/App.tsx
<Route path="/" component={Home} />
<Route path="/dashboard" component={Dashboard} />
<Route path="/clients" component={Clients} />
<Route path="/clients/:id" component={ClientDetail} />
<Route path="/sale-list" component={SalesLogs} />
<Route path="/sale-list/regi" component={SalesLogNew} />
<Route path="/sale-list/:id" component={SalesLogDetail} />
<Route path="/sche-list" component={Promises} />
<Route path="/orde-list" component={Orders} />
<Route path="/deliveries" component={Deliveries} />
```

## 컴포넌트 구조

```
client/src/
├── _core/hooks/useAuth.ts    # 인증 상태 (로그인 여부, 사용자 정보)
├── components/
│   ├── ui/                   # shadcn/ui 기본 컴포넌트 (직접 수정 가능)
│   ├── AppLayout.tsx         # 앱 전체 레이아웃
│   ├── DashboardLayout.tsx   # 대시보드 레이아웃 (사이드바)
│   ├── AIChatBox.tsx         # AI 채팅 UI
│   ├── VoiceRecorder.tsx     # 음성 녹음
│   ├── Map.tsx               # 지도 컴포넌트
│   └── StatusBadge.tsx       # 상태 배지
└── pages/
    ├── LandingPage.tsx       # 비로그인 랜딩
    ├── Home.tsx              # 홈 (로그인 후 리다이렉트)
    ├── Dashboard.tsx         # 대시보드
    ├── Clients.tsx           # 고객사 목록
    ├── ClientDetail.tsx      # 고객사 상세
    ├── SalesLogs.tsx         # 영업일지 목록
    ├── SalesLogNew.tsx       # 영업일지 작성
    ├── SalesLogDetail.tsx    # 영업일지 상세
    ├── Promises.tsx          # 일정 목록
    ├── Orders.tsx            # 수주 목록
    └── Deliveries.tsx        # 납품 목록
```

## shadcn/ui 사용 패턴

```typescript
// client/src/components/ui/ 에서 import
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
```

## 폼 패턴 (react-hook-form + zod)

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form'

const schema = z.object({ name: z.string().min(1) })
type FormData = z.infer<typeof schema>

const form = useForm<FormData>({ resolver: zodResolver(schema) })
```

## 인증 상태 확인

```typescript
import { useAuth } from '@/_core/hooks/useAuth'

const { user, isLoading } = useAuth()
if (!user) return <Redirect to="/" />
```

## tRPC + react-query 패턴

```typescript
import { trpc } from '@/lib/trpc'

// 데이터 조회
const { data, isLoading, error } = trpc.clients.list.useQuery()

// 뮤테이션
const utils = trpc.useUtils()
const createClient = trpc.clients.create.useMutation({
  onSuccess: () => {
    utils.clients.list.invalidate()
    toast.success('고객사가 추가되었습니다')
  }
})
```

## TailwindCSS v4 주의사항

- v4는 CSS-first 설정 방식 (`@import "tailwindcss"`)
- arbitrary values: `[&:hover]:` 패턴 지원
- `cn()` 유틸리티로 조건부 클래스 결합 (`lib/utils.ts`)

```typescript
import { cn } from '@/lib/utils'
<div className={cn('base-class', condition && 'conditional-class')} />
```

## 알림 (sonner)

```typescript
import { toast } from 'sonner'
toast.success('저장되었습니다')
toast.error('오류가 발생했습니다')
```

## 테마 (다크모드)

- `client/src/contexts/ThemeContext.tsx` 에서 관리
- `next-themes` 라이브러리 사용
