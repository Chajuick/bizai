// drizzle/schema/index.ts

/**
 * ============================================================
 * Schema Barrel (Single Entry)
 * ------------------------------------------------------------
 * - 앱에서는 오직 이 파일만 import 한다
 * - deep import 금지
 * - 구조 의미 유지
 * ============================================================
 */

// #region Common (shared building blocks)
export * from "./common/default";
export * from "./common/enums";
export * from "./common/table";
// #endregion


// #region Core (platform-level tables)
export * from "./core/company.schema";
export * from "./core/user.schema";
export * from "./core/company-user.schema";
export * from "./core/company_invite.schema";

// Global file system (cross-domain)
export * from "./core/file.schema";
export * from "./core/file-link.schema";
// #endregion


// #region Billing
export * from "./billing/plan.schema";
export * from "./billing/subscription.schema";
// #endregion


// #region AI
export * from "./ai/ai-token-balance.schema";
export * from "./ai/ai-token-ledger.schema";
export * from "./ai/ai-usage-event.schema";
export * from "./ai/ai-usage-month.schema";
// #endregion


// #region CRM domain
export * from "./crm/client-contact.schema";
export * from "./crm/client.schema";
export * from "./crm/sale.schema";
export * from "./crm/sale.audio-job.schema";
export * from "./crm/schedule.schema";
export * from "./crm/order.schema";
export * from "./crm/shipment.schema";
// #endregion