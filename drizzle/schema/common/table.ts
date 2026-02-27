import { mysqlTableCreator } from "drizzle-orm/mysql-core";

/** drizzle mysqlTable 대체 + 테이블명 규칙 강제 */
export const table = mysqlTableCreator((name) => `COAPP_${name}`);