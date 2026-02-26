import { int, varchar, text, timestamp, index, uniqueIndex } from "drizzle-orm/mysql-core";
import { table } from "../_common/table";
import { companyCols, auditCols } from "../_common/default";

export const CORE_FILE = table(
  "CORE_FILE",
  {
    file_idno: int("file_idno").autoincrement().primaryKey(),      // 파일 PK
    ...companyCols(),                                              // comp_idno (회사 키)

    upld_idno: int("upld_idno").notNull(),                         // 업로더 user_idno

    file_name: varchar("file_name", { length: 300 }).notNull(),    // 원본 파일명(표시용)
    file_extn: varchar("file_extn", { length: 20 }),               // 확장자(pdf/xlsx/mp3...)
    mime_type: varchar("mime_type", { length: 120 }),              // MIME 타입
    file_size: int("file_size"),                                   // 파일 크기(byte)

    file_hash: varchar("file_hash", { length: 64 }),               // sha256 등(중복검출/무결성)

    stor_drve: varchar("stor_drve", { length: 32 }).default("s3"), // 스토리지 드라이버(s3/r2/local...)
    file_path: varchar("file_path", { length: 500 }).notNull(),    // 스토리지 키(경로)
    file_addr: text("file_addr"),                                  // (옵션) 퍼블릭/고정 URL(서명 URL이면 비움)

    dura_secs: int("dura_secs"),                                   // 음성/영상 길이(초)

    dele_yesn: int("dele_yesn").default(0).notNull(),              // 소프트 삭제(0/1)
    dele_date: timestamp("dele_date"),                             // 삭제 시각
    drop_date: timestamp("drop_date"),                             // 실제 스토리지 삭제 예정 시각(옵션)

    ...auditCols(),                                                // crea_*/modi_* 감사
  },
  (t) => [
    index("ix_core_file_comp").on(t.comp_idno),                    // 회사 기준 조회
    index("ix_core_file_upld").on(t.comp_idno, t.upld_idno),       // 업로더 기준 조회

    index("ix_core_file_dele").on(t.comp_idno, t.dele_date),       // 삭제 후보 조회
    index("ix_core_file_drop").on(t.comp_idno, t.drop_date),       // GC 후보 조회

    uniqueIndex("ux_core_file_hash").on(t.comp_idno, t.file_hash), // (옵션) 해시 중복 방지(해시 있을 때만)
  ]
);

export type CoreFile = typeof CORE_FILE.$inferSelect;
export type InsertCoreFile = typeof CORE_FILE.$inferInsert;