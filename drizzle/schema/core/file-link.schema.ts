import { int, timestamp, index, primaryKey } from "drizzle-orm/mysql-core";
import { table } from "../common/table";
import { companyCols, auditCols } from "../common/default";
import { fileRefTypeEnum, filePurpTypeEnum } from "../common/enums";

export const CORE_FILE_LINK = table(
  "CORE_FILE_LINK",
  {
    ...companyCols(),                                              // comp_idno (회사 키)

    file_idno: int("file_idno").notNull(),                         // 파일 PK(CORE_FILE)

    refe_type: fileRefTypeEnum.notNull(),                          // 대상 엔티티 타입
    refe_idno: int("refe_idno").notNull(),                         // 대상 엔티티 ID

    purp_type: filePurpTypeEnum,                                   // 용도 라벨(옵션)
    sort_orde: int("sort_orde").default(0).notNull(),              // 정렬 순서(옵션)

    dele_yesn: int("dele_yesn").default(0).notNull(),              // 링크 소프트 삭제(0/1)
    dele_date: timestamp("dele_date"),                             // 링크 삭제 시각

    ...auditCols(),                                                // crea_*/modi_* 감사
  },
  (t) => [
    // 링크 자체 PK(복합): 같은 엔티티에 같은 파일 중복 연결 방지 포함
    primaryKey({ name: "pk_core_file_link", columns: [t.comp_idno, t.refe_type, t.refe_idno, t.file_idno] }),

    // 한 엔티티에 달린 파일 조회
    index("ix_core_file_link_ref").on(t.comp_idno, t.refe_type, t.refe_idno, t.dele_yesn),

    // 특정 파일이 어디에 붙었는지 역조회
    index("ix_core_file_link_file").on(t.comp_idno, t.file_idno, t.dele_yesn),
  ]
);

export type CoreFileLink = typeof CORE_FILE_LINK.$inferSelect;
export type InsertCoreFileLink = typeof CORE_FILE_LINK.$inferInsert;