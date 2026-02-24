---
name: sales-manager-api
description: tRPC 라우터 설계, 프로시저 패턴, 인증 흐름을 설명합니다. 새 API 추가 또는 기존 API 수정 시 참조하세요.
---

# Sales Manager API (tRPC)

## tRPC 구조

### 핵심 파일
- `server/_core/trpc.ts` — tRPC 인스턴스, `publicProcedure`, `protectedProcedure`
- `server/_core/context.ts` — 요청 컨텍스트 (`ctx.user`, `ctx.req`, `ctx.res`)
- `server/routers.ts` — `AppRouter` (모든 라우터 조합)

### Procedure 종류
```typescript
publicProcedure    // 인증 없이 접근 가능
protectedProcedure // 로그인 필수 (ctx.user 보장)
```

## 라우터 목록

| 네임스페이스 | 파일 | 설명 |
|------------|------|------|
| `system` | _core/systemRouter.ts | 시스템 유틸 |
| `auth.me` | routers.ts | 현재 사용자 조회 |
| `auth.logout` | routers.ts | 로그아웃 |
| `clients` | routers/clients.ts | 고객사 CRUD |
| `salesLogs` | routers/salesLogs.ts | 영업일지 + AI 처리 |
| `promises` | routers/promises.ts | 일정 관리 |
| `orders` | routers/orders.ts | 수주 관리 |
| `deliveries` | routers/deliveries.ts | 납품/매출 |
| `dashboard` | routers/dashboard.ts | 집계 데이터 |
| `upload` | routers/upload.ts | S3 파일 업로드 |

## 새 라우터 작성 패턴

```typescript
// server/routers/newFeature.ts
import { z } from 'zod'
import { router, protectedProcedure } from '../_core/trpc'
import { db } from '../db'
import * as schema from '../../drizzle/schema'
import { eq, and } from 'drizzle-orm'

export const newFeatureRouter = router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return db.select()
        .from(schema.yourTable)
        .where(eq(schema.yourTable.userId, ctx.user.id))
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const [item] = await db.insert(schema.yourTable)
        .values({ userId: ctx.user.id, ...input })
      return item
    }),
})
```

```typescript
// server/routers.ts 에 등록
import { newFeatureRouter } from './routers/newFeature'
export const appRouter = router({
  // ...기존 라우터...
  newFeature: newFeatureRouter,
})
```

## 클라이언트 사용 패턴

```typescript
// client/src/lib/trpc.ts 에서 import
import { trpc } from '../lib/trpc'

// Query
const { data, isLoading } = trpc.clients.list.useQuery({ search: '' })

// Mutation
const createMutation = trpc.clients.create.useMutation({
  onSuccess: () => {
    utils.clients.list.invalidate()
  }
})
```

## 인증 패턴

```typescript
// protectedProcedure 사용 시 ctx.user 자동 보장
.query(async ({ ctx }) => {
  const userId = ctx.user.id  // number, 항상 존재
  const userRole = ctx.user.role  // 'user' | 'admin'
})
```

## Zod 유효성 검사

```typescript
// 공통 패턴
z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(200),
  status: z.enum(['scheduled', 'completed', 'canceled', 'overdue']),
  date: z.string().datetime().optional(),
})
```

## salesLogs AI 처리 패턴

```typescript
// rawContent 저장 후 AI 처리는 비동기
// isProcessed: false → AI 처리 → isProcessed: true
// aiSummary: AI 요약 텍스트
// aiExtracted: { nextActions: string[], amount: number, keywords: string[], sentiment: string }
```
