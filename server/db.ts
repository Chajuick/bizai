import { and, desc, eq, gte, lte, like, sql } from "drizzle-orm";
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

// ─── Clients ──────────────────────────────────────────────────────────────────
export async function getClients(userId: number, search?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(clients.userId, userId), eq(clients.isActive, true)];
  if (search) conditions.push(like(clients.name, `%${search}%`));
  return db.select().from(clients).where(and(...conditions)).orderBy(desc(clients.updatedAt));
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
  return db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.createdAt));
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
export async function getDeliveries(userId: number, opts?: { orderId?: number; billingStatus?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(deliveries.userId, userId)];
  if (opts?.orderId) conditions.push(eq(deliveries.orderId, opts.orderId));
  if (opts?.billingStatus) conditions.push(eq(deliveries.billingStatus, opts.billingStatus as any));
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
    .where(and(eq(deliveries.userId, userId), eq(deliveries.billingStatus, "paid"), gte(deliveries.createdAt, startOfMonth), lte(deliveries.createdAt, endOfMonth)));

  // 지연된 일정 수
  const [overduePromises] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(promises)
    .where(and(eq(promises.userId, userId), eq(promises.status, "scheduled"), lte(promises.scheduledAt, now)));

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
    recentLogs,
    upcomingPromises: upcomingPromisesList,
  };
}

// 월별 매출 트렌드 (최근 6개월)
export async function getRevenueTrend(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      month: sql<string>`DATE_FORMAT(createdAt, '%Y-%m')`,
      total: sql<string>`COALESCE(SUM(revenueAmount), 0)`,
    })
    .from(deliveries)
    .where(and(eq(deliveries.userId, userId), eq(deliveries.billingStatus, "paid"), gte(deliveries.createdAt, sixMonthsAgo)))
    .groupBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`);

  return rows.map((r) => ({ month: r.month, total: Number(r.total) }));
}
