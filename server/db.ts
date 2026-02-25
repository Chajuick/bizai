import { and, desc, eq, gte, lt, lte, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  clients,
  salesLogs,
  promises,
  orders,
  deliveries,
  attachments,
  InsertClient,
  InsertSalesLog,
  InsertPromise,
  InsertOrder,
  InsertDelivery,
  InsertAttachment,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Client fuzzy matching ────────────────────────────────────────────────────
function normalizeCompanyName(name: string): string {
  return name
    .replace(/\(\s*주\s*\)/g, "")   // (주)나산 → 나산
    .replace(/㈜/g, "")              // ㈜나산 → 나산
    .replace(/\s*주식회사\s*/g, "")  // 주식회사 나산 → 나산
    .replace(/\(\s*유\s*\)/g, "")
    .replace(/\s*유한회사\s*/g, "")
    .replace(/^주(?=[가-힣]{2,})/g, "") // 주나산 → 나산 (비공식 (주) 표기)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function levenshteinSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return 1 - dp[m][n] / Math.max(m, n);
}

// 이름으로 고객사 찾거나 없으면 신규 생성
export async function findOrCreateClient(
  userId: number,
  name: string
): Promise<{ id: number; name: string; isNew: boolean }> {
  const all = await getClients(userId);
  const normTarget = normalizeCompanyName(name);
  const existing = all.find((c) => normalizeCompanyName(c.name) === normTarget);
  if (existing) return { id: existing.id, name: existing.name, isNew: false };
  const result = await createClient({ userId, name });
  return { id: (result as any).insertId, name, isNew: true };
}

export async function findBestClientMatch(
  userId: number,
  name: string,
  minConfidence = 0.7
): Promise<{ id: number; name: string; confidence: number } | null> {
  const allClients = await getClients(userId);
  if (!allClients.length || !name) return null;
  const normInput = normalizeCompanyName(name);
  if (!normInput) return null;
  let best: { id: number; name: string; confidence: number } | null = null;
  for (const c of allClients) {
    const normClient = normalizeCompanyName(c.name);
    const sim = Math.max(
      levenshteinSimilarity(normInput, normClient),
      normInput.includes(normClient) || normClient.includes(normInput) ? 0.85 : 0
    );
    if (sim >= minConfidence && (!best || sim > best.confidence)) {
      best = { id: c.id, name: c.name, confidence: sim };
    }
  }
  return best;
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export async function getClients(userId: number, search?: string, limit?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(clients.userId, userId), eq(clients.isActive, true)];
  if (search) conditions.push(like(clients.name, `%${search}%`));
  const q = db.select().from(clients).where(and(...conditions)).orderBy(desc(clients.updatedAt));
  return limit ? q.limit(limit) : q;
}

export async function getClientById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.userId, userId))).limit(1);
  return result[0];
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(clients).values(data);
  return result[0];
}

export async function updateClient(id: number, userId: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(clients).set(data).where(and(eq(clients.id, id), eq(clients.userId, userId)));
}

export async function deleteClient(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(clients).set({ isActive: false }).where(and(eq(clients.id, id), eq(clients.userId, userId)));
}

// ─── SalesLogs ────────────────────────────────────────────────────────────────
export async function getSalesLogs(userId: number, opts?: { clientId?: number; search?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(salesLogs.userId, userId)];
  if (opts?.clientId) conditions.push(eq(salesLogs.clientId, opts.clientId));
  if (opts?.search) conditions.push(like(salesLogs.rawContent, `%${opts.search}%`));
  return db.select().from(salesLogs).where(and(...conditions)).orderBy(desc(salesLogs.visitedAt)).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0);
}

export async function getSalesLogById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(salesLogs).where(and(eq(salesLogs.id, id), eq(salesLogs.userId, userId))).limit(1);
  return result[0];
}

export async function createSalesLog(data: InsertSalesLog) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(salesLogs).values(data);
  return { insertId: (result[0] as any).insertId };
}

export async function updateSalesLog(id: number, userId: number, data: Partial<InsertSalesLog>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(salesLogs).set(data).where(and(eq(salesLogs.id, id), eq(salesLogs.userId, userId)));
}

export async function deleteSalesLog(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(salesLogs).where(and(eq(salesLogs.id, id), eq(salesLogs.userId, userId)));
}

// ─── Promises ─────────────────────────────────────────────────────────────────
export async function getPromises(userId: number, opts?: { status?: string; upcoming?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(promises.userId, userId)];
  if (opts?.status) conditions.push(eq(promises.status, opts.status as any));
  if (opts?.upcoming) conditions.push(gte(promises.scheduledAt, new Date()));
  return db.select().from(promises).where(and(...conditions)).orderBy(promises.scheduledAt);
}

export async function getPromiseById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(promises).where(and(eq(promises.id, id), eq(promises.userId, userId))).limit(1);
  return result[0];
}

export async function createPromise(data: InsertPromise) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(promises).values(data);
  return { insertId: (result[0] as any).insertId };
}

export async function updatePromise(id: number, userId: number, data: Partial<InsertPromise>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(promises).set(data).where(and(eq(promises.id, id), eq(promises.userId, userId)));
}

export async function deletePromise(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(promises).where(and(eq(promises.id, id), eq(promises.userId, userId)));
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function getOrders(userId: number, opts?: { status?: string; clientId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(orders.userId, userId)];
  if (opts?.status) conditions.push(eq(orders.status, opts.status as any));
  if (opts?.clientId) conditions.push(eq(orders.clientId, opts.clientId));

  const [orderRows, deliveryCounts] = await Promise.all([
    db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.createdAt)),
    db
      .select({
        orderId: deliveries.orderId,
        count: sql<string>`COUNT(*)`,
      })
      .from(deliveries)
      .where(eq(deliveries.userId, userId))
      .groupBy(deliveries.orderId),
  ]);

  const countMap = new Map(deliveryCounts.map((r) => [r.orderId, Number(r.count)]));
  return orderRows.map((o) => ({ ...o, deliveryCount: countMap.get(o.id) ?? 0 }));
}

export async function getOrderById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.userId, userId))).limit(1);
  return result[0];
}

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(orders).values(data);
  return { insertId: (result[0] as any).insertId };
}

export async function updateOrder(id: number, userId: number, data: Partial<InsertOrder>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(orders).set(data).where(and(eq(orders.id, id), eq(orders.userId, userId)));
}

export async function deleteOrder(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(orders).where(and(eq(orders.id, id), eq(orders.userId, userId)));
}

// ─── Deliveries ───────────────────────────────────────────────────────────────
export async function getDeliveries(userId: number, opts?: { orderId?: number; deliveryStatus?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(deliveries.userId, userId)];
  if (opts?.orderId) conditions.push(eq(deliveries.orderId, opts.orderId));
  if (opts?.deliveryStatus) conditions.push(eq(deliveries.deliveryStatus, opts.deliveryStatus as any));
  return db.select().from(deliveries).where(and(...conditions)).orderBy(desc(deliveries.createdAt));
}

export async function createDelivery(data: InsertDelivery) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(deliveries).values(data);
  return { insertId: (result[0] as any).insertId };
}

export async function updateDelivery(id: number, userId: number, data: Partial<InsertDelivery>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(deliveries).set(data).where(and(eq(deliveries.id, id), eq(deliveries.userId, userId)));
}

export async function deleteDelivery(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(deliveries).where(and(eq(deliveries.id, id), eq(deliveries.userId, userId)));
}

// ─── Attachments ──────────────────────────────────────────────────────────────
export async function createAttachment(data: InsertAttachment) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(attachments).values(data);
  return { insertId: (result[0] as any).insertId };
}

export async function getAttachmentsBySalesLog(salesLogId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(attachments).where(and(eq(attachments.salesLogId, salesLogId), eq(attachments.userId, userId)));
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // KST(UTC+9) 기준 오늘 자정: 이 시각 이전의 일정만 "지연"으로 간주
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const kstTodayMidnight = new Date(kstNow.toISOString().slice(0, 10) + "T00:00:00+09:00");

  // 이번 달 영업일지 수
  const [logsCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(salesLogs)
    .where(and(eq(salesLogs.userId, userId), gte(salesLogs.visitedAt, startOfMonth), lte(salesLogs.visitedAt, endOfMonth)));

  // 예정 일정 수 (오늘 이후)
  const [upcomingPromises] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(promises)
    .where(and(eq(promises.userId, userId), eq(promises.status, "scheduled"), gte(promises.scheduledAt, now)));

  // 진행 중 수주 수 (proposal + negotiation)
  const [activeOrders] = await db
    .select({ count: sql<number>`COUNT(*)`, total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(orders)
    .where(and(eq(orders.userId, userId), sql`status IN ('proposal', 'negotiation', 'confirmed')`));

  // 이번 달 매출 (paid deliveries)
  const [monthlyRevenue] = await db
    .select({ total: sql<string>`COALESCE(SUM(revenueAmount), 0)` })
    .from(deliveries)
    .where(and(eq(deliveries.userId, userId), eq(deliveries.deliveryStatus, "paid"), gte(deliveries.createdAt, startOfMonth), lte(deliveries.createdAt, endOfMonth)));

  // 지연된 일정 수 (KST 기준 오늘 자정 이전 날의 일정만)
  const [overduePromises] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(promises)
    .where(and(eq(promises.userId, userId), eq(promises.status, "scheduled"), lt(promises.scheduledAt, kstTodayMidnight)));

  // 임박 일정 수 (지금부터 12시간 이내)
  const twelveHoursLater = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  const [imminentPromises] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(promises)
    .where(and(eq(promises.userId, userId), eq(promises.status, "scheduled"), gte(promises.scheduledAt, now), lte(promises.scheduledAt, twelveHoursLater)));

  // 최근 영업일지 5개
  const recentLogs = await db
    .select()
    .from(salesLogs)
    .where(eq(salesLogs.userId, userId))
    .orderBy(desc(salesLogs.visitedAt))
    .limit(5);

  // 이번 달 예정 일정 5개
  const upcomingPromisesList = await db
    .select()
    .from(promises)
    .where(and(eq(promises.userId, userId), eq(promises.status, "scheduled"), gte(promises.scheduledAt, now)))
    .orderBy(promises.scheduledAt)
    .limit(5);

  return {
    logsThisMonth: Number(logsCount?.count ?? 0),
    upcomingPromisesCount: Number(upcomingPromises?.count ?? 0),
    activeOrdersCount: Number(activeOrders?.count ?? 0),
    activeOrdersTotal: Number(activeOrders?.total ?? 0),
    monthlyRevenue: Number(monthlyRevenue?.total ?? 0),
    overdueCount: Number(overduePromises?.count ?? 0),
    imminentCount: Number(imminentPromises?.count ?? 0),
    recentLogs,
    upcomingPromises: upcomingPromisesList,
  };
}

// 월별 매출 트렌드 (최근 6개월) — 수주 + 납품 분리
export async function getRevenueTrend(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  // 최근 6개월 레이블 생성
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
  }

  const [orderRows, deliveryRows] = await Promise.all([
    db
      .select({
        month: sql<string>`DATE_FORMAT(createdAt, '%Y-%m')`,
        total: sql<string>`COALESCE(SUM(amount), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          gte(orders.createdAt, sixMonthsAgo),
          sql`status != 'canceled'`
        )
      )
      .groupBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`),

    db
      .select({
        month: sql<string>`DATE_FORMAT(createdAt, '%Y-%m')`,
        total: sql<string>`COALESCE(SUM(revenueAmount), 0)`,
      })
      .from(deliveries)
      .where(
        and(
          eq(deliveries.userId, userId),
          eq(deliveries.deliveryStatus, "paid"),
          gte(deliveries.createdAt, sixMonthsAgo)
        )
      )
      .groupBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`),
  ]);

  const orderMap = new Map(orderRows.map((r) => [r.month, Number(r.total)]));
  const deliveryMap = new Map(deliveryRows.map((r) => [r.month, Number(r.total)]));

  return months.map((m) => ({
    month: m.slice(5) + "월", // "MM월" 형식
    order: orderMap.get(m) ?? 0,
    delivery: deliveryMap.get(m) ?? 0,
  }));
}
