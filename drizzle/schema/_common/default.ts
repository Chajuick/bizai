import { int, timestamp } from "drizzle-orm/mysql-core";

/** 회사(테넌트) 공통 컬럼 */
export const companyCols = () =>
  ({
    comp_idno: int("comp_idno").notNull()                     // 회사 ID (테넌트 키)
  } as const);

/** 생성/수정 감사 컬럼(레거시 스타일) */
export const auditCols = () =>
  ({
    crea_idno: int("crea_idno").notNull(),                    // 생성자 사용자 ID
    crea_date: timestamp("crea_date").defaultNow().notNull(), // 생성 일시 (DB 자동)

    modi_idno: int("modi_idno"),                              // 수정자 사용자 ID (nullable)
    modi_date: timestamp("modi_date").onUpdateNow(),          // 최종 수정 일시 (업데이트 시 DB 자동)
  } as const);

/** user_idno가 의미 없는 테이블(마스터/시스템용) */
export const auditColsNoUser = () =>
  ({
    crea_date: timestamp("crea_date").defaultNow().notNull(), // 생성 일시 (DB 자동)
    modi_date: timestamp("modi_date").onUpdateNow(),          // 최종 수정 일시 (업데이트 시 DB 자동)
  } as const);