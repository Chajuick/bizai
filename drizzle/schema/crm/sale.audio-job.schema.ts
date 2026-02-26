import { int, varchar, text, json, timestamp, index, uniqueIndex } from "drizzle-orm/mysql-core";
import { table } from "../_common/table";
import { companyCols, auditCols } from "../_common/default";
import { jobsStatusEnum } from "../_common/enums";

export const CRM_SALE_AUDIO_JOB = table(
  "CRM_SALE_AUDIO_JOB",
  {
    jobs_idno: int("jobs_idno").autoincrement().primaryKey(),          // 작업 PK
    ...companyCols(),                                                 // comp_idno (회사 키)

    sale_idno: int("sale_idno").notNull(),                            // 영업일지 PK(대상)
    file_idno: int("file_idno").notNull(),                            // 음성 파일 PK(CORE_FILE)

    jobs_stat: jobsStatusEnum.default("queued").notNull(),            // queued|running|done|failed
    fail_mess: text("fail_mess"),                                     // 실패 메시지(옵션)

    sttx_text: text("sttx_text"),                                     // STT 결과(옵션)
    aiex_sum:  text("aiex_sum"),                                      // AI 요약
    aiex_ext:  json("aiex_ext"),                                      // AI 추출(json)

    sttx_name: varchar("sttx_name", { length: 80 }),                  // STT 모델명
    llmd_name: varchar("llmd_name", { length: 80 }),                  // LLM 모델명
    meta_json: json("meta_json"),                                     // { audioSeconds, tokensIn, tokensOut ... }

    reqe_date: timestamp("reqe_date").defaultNow().notNull(),         // 요청 시각
    fini_date: timestamp("fini_date"),                                // 완료 시각

    ...auditCols(),                                                   // crea_*/modi_* 감사
  },
  (t) => [
    // 중복 생성 방지
    uniqueIndex("ux_sale_audio_job_ref").on(t.comp_idno, t.sale_idno, t.file_idno),

    // 조회 패턴 최적화
    index("ix_sale_audio_job_sale").on(t.comp_idno, t.sale_idno),
    index("ix_sale_audio_job_file").on(t.comp_idno, t.file_idno),
    index("ix_sale_audio_job_stat_reqe").on(t.comp_idno, t.jobs_stat, t.reqe_date),
  ]
);

export type SaleAudioJob = typeof CRM_SALE_AUDIO_JOB.$inferSelect;
export type InsertSaleAudioJob = typeof CRM_SALE_AUDIO_JOB.$inferInsert;