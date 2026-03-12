/* =========================================================
COAPP_CRM_CLIENT
거래처 마스터
- 회사별 거래처 기본 정보 관리
- 대표 담당자 / 연락처 / 사업자번호 / 주소 관리
========================================================= */
ALTER TABLE COAPP_CRM_CLIENT COMMENT = '회사별 거래처 기본 정보 관리 테이블';

ALTER TABLE COAPP_CRM_CLIENT MODIFY COLUMN clie_idno int NOT NULL AUTO_INCREMENT COMMENT '거래처 ID',
MODIFY COLUMN comp_idno int NOT NULL COMMENT '회사 ID (테넌트 키)',
MODIFY COLUMN clie_name varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '거래처명',
MODIFY COLUMN indu_type varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '업종',
MODIFY COLUMN cont_name varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '대표 담당자명 (캐시)',
MODIFY COLUMN cont_tele varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '대표 연락처 (캐시)',
MODIFY COLUMN cont_mail varchar(320) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '대표 이메일 (캐시)',
MODIFY COLUMN clie_addr text COLLATE utf8mb4_unicode_ci COMMENT '거래처 주소',
MODIFY COLUMN clie_memo text COLLATE utf8mb4_unicode_ci COMMENT '거래처 메모',
MODIFY COLUMN enab_yesn tinyint (1) NOT NULL DEFAULT '1' COMMENT '거래처 활성 여부',
MODIFY COLUMN crea_idno int NOT NULL COMMENT '생성 사용자 ID',
MODIFY COLUMN crea_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
MODIFY COLUMN modi_idno int DEFAULT NULL COMMENT '수정 사용자 ID',
MODIFY COLUMN modi_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정 일시',
MODIFY COLUMN bizn_numb varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '사업자등록번호',
MODIFY COLUMN clie_type varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sales' COMMENT '거래처 유형';

/* =========================================================
COAPP_CRM_CLIENT_CONT
거래처 담당자
- 거래처별 담당자 정보 관리
- 연락처 / 이메일 / 직책 / 메모 관리
========================================================= */
ALTER TABLE COAPP_CRM_CLIENT_CONT COMMENT = '거래처 담당자 정보 관리 테이블';

ALTER TABLE COAPP_CRM_CLIENT_CONT MODIFY COLUMN cont_idno int NOT NULL AUTO_INCREMENT COMMENT '담당자 ID',
MODIFY COLUMN comp_idno int NOT NULL COMMENT '회사 ID',
MODIFY COLUMN clie_idno int NOT NULL COMMENT '거래처 ID',
MODIFY COLUMN cont_name varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '담당자 이름',
MODIFY COLUMN cont_role varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '담당자 직책 또는 역할',
MODIFY COLUMN cont_tele varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '담당자 연락처',
MODIFY COLUMN cont_mail varchar(320) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '담당자 이메일',
MODIFY COLUMN cont_memo text COLLATE utf8mb4_unicode_ci COMMENT '담당자 메모',
MODIFY COLUMN main_yesn tinyint (1) NOT NULL DEFAULT '0' COMMENT '대표 담당자 여부',
MODIFY COLUMN enab_yesn tinyint (1) NOT NULL DEFAULT '1' COMMENT '활성 여부',
MODIFY COLUMN crea_idno int NOT NULL COMMENT '생성 사용자 ID',
MODIFY COLUMN crea_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
MODIFY COLUMN modi_idno int DEFAULT NULL COMMENT '수정 사용자 ID',
MODIFY COLUMN modi_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정 일시';

/* =========================================================
COAPP_CRM_ORDER
수주 정보
- 거래처 / 영업일지 기반 수주 등록
- 수주 금액 / 상태 / 계약일 / 예상 납기 관리
========================================================= */
ALTER TABLE COAPP_CRM_ORDER COMMENT = '수주 정보 관리 테이블';

ALTER TABLE COAPP_CRM_ORDER MODIFY COLUMN orde_idno int NOT NULL AUTO_INCREMENT COMMENT '수주 ID',
MODIFY COLUMN comp_idno int NOT NULL COMMENT '회사 ID (테넌트 키)',
MODIFY COLUMN owne_idno int NOT NULL COMMENT '담당 사용자 ID',
MODIFY COLUMN clie_idno int DEFAULT NULL COMMENT '거래처 ID',
MODIFY COLUMN sale_idno int DEFAULT NULL COMMENT '영업일지 ID',
MODIFY COLUMN clie_name varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '거래처명 스냅샷',
MODIFY COLUMN prod_serv varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '제품 또는 서비스명',
MODIFY COLUMN orde_pric decimal(15, 2) NOT NULL COMMENT '수주 금액',
MODIFY COLUMN orde_stat enum (
    'proposal',
    'negotiation',
    'confirmed',
    'canceled'
) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'proposal' COMMENT '수주 상태',
MODIFY COLUMN ctrt_date timestamp NULL DEFAULT NULL COMMENT '계약일',
MODIFY COLUMN expd_date timestamp NULL DEFAULT NULL COMMENT '예상 납기일',
MODIFY COLUMN orde_memo text COLLATE utf8mb4_unicode_ci COMMENT '수주 메모',
MODIFY COLUMN enab_yesn tinyint (1) NOT NULL DEFAULT '1' COMMENT '활성 여부',
MODIFY COLUMN crea_idno int NOT NULL COMMENT '생성 사용자 ID',
MODIFY COLUMN crea_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
MODIFY COLUMN modi_idno int DEFAULT NULL COMMENT '수정 사용자 ID',
MODIFY COLUMN modi_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정 일시';

/* =========================================================
COAPP_CRM_SHIPMENT
납품 및 매출 정보
- 수주 기준 납품 진행 상태 관리
- 납품 / 청구 / 수금 일자 및 금액 관리
========================================================= */
ALTER TABLE COAPP_CRM_SHIPMENT COMMENT = '납품 및 매출 정보 관리 테이블';

ALTER TABLE COAPP_CRM_SHIPMENT MODIFY COLUMN ship_idno int NOT NULL AUTO_INCREMENT COMMENT '납품 ID',
MODIFY COLUMN comp_idno int NOT NULL COMMENT '회사 ID (테넌트 키)',
MODIFY COLUMN owne_idno int NOT NULL COMMENT '담당 사용자 ID',
MODIFY COLUMN orde_idno int NOT NULL COMMENT '수주 ID',
MODIFY COLUMN clie_name varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '거래처명 스냅샷',
MODIFY COLUMN ship_stat enum ('pending', 'delivered', 'invoiced', 'paid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '납품 진행 상태',
MODIFY COLUMN ship_date timestamp NULL DEFAULT NULL COMMENT '납품일',
MODIFY COLUMN invc_date timestamp NULL DEFAULT NULL COMMENT '청구일',
MODIFY COLUMN paid_date timestamp NULL DEFAULT NULL COMMENT '수금일',
MODIFY COLUMN ship_pric decimal(15, 2) NOT NULL COMMENT '매출 금액',
MODIFY COLUMN ship_memo text COLLATE utf8mb4_unicode_ci COMMENT '납품 메모',
MODIFY COLUMN enab_yesn tinyint (1) NOT NULL DEFAULT '1' COMMENT '활성 여부',
MODIFY COLUMN crea_idno int NOT NULL COMMENT '생성 사용자 ID',
MODIFY COLUMN crea_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
MODIFY COLUMN modi_idno int DEFAULT NULL COMMENT '수정 사용자 ID',
MODIFY COLUMN modi_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정 일시',
MODIFY COLUMN clie_idno int DEFAULT NULL COMMENT '거래처 ID';

/* =========================================================
COAPP_CRM_SCHEDULE
일정/약속 관리
- 거래처 / 영업일지 연계 일정 관리
- 예정 일시 / 상태 / 수행 주체 / 리마인드 여부 관리
========================================================= */
ALTER TABLE COAPP_CRM_SCHEDULE COMMENT = '일정 및 약속 정보 관리 테이블';

ALTER TABLE COAPP_CRM_SCHEDULE MODIFY COLUMN sche_idno int NOT NULL AUTO_INCREMENT COMMENT '일정 ID',
MODIFY COLUMN comp_idno int NOT NULL COMMENT '회사 ID (테넌트 키)',
MODIFY COLUMN owne_idno int NOT NULL COMMENT '담당 사용자 ID',
MODIFY COLUMN sale_idno int DEFAULT NULL COMMENT '연결 영업일지 ID',
MODIFY COLUMN clie_idno int DEFAULT NULL COMMENT '연결 거래처 ID',
MODIFY COLUMN clie_name varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '거래처명 스냅샷 또는 자유입력',
MODIFY COLUMN sche_name varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '일정 제목',
MODIFY COLUMN sche_desc text COLLATE utf8mb4_unicode_ci COMMENT '일정 설명',
MODIFY COLUMN sche_pric decimal(15, 2) DEFAULT NULL COMMENT '관련 금액',
MODIFY COLUMN sche_date timestamp NOT NULL COMMENT '예정 일시',
MODIFY COLUMN sche_stat enum ('scheduled', 'completed', 'canceled', 'overdue') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled' COMMENT '일정 상태',
MODIFY COLUMN remd_sent tinyint (1) NOT NULL DEFAULT '0' COMMENT '리마인드 발송 여부',
MODIFY COLUMN auto_gene tinyint (1) NOT NULL DEFAULT '0' COMMENT 'AI 자동 생성 여부',
MODIFY COLUMN enab_yesn tinyint (1) NOT NULL DEFAULT '1' COMMENT '활성 여부',
MODIFY COLUMN crea_idno int NOT NULL COMMENT '생성 사용자 ID',
MODIFY COLUMN crea_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
MODIFY COLUMN modi_idno int DEFAULT NULL COMMENT '수정 사용자 ID',
MODIFY COLUMN modi_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정 일시',
MODIFY COLUMN actn_ownr varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '수행 주체',
MODIFY COLUMN aiex_keys varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'AI 자동생성 연계 키';

/* =========================================================
COAPP_CRM_SALE
영업일지
- 방문/미팅 기록 관리
- 원문 메모 / STT 결과 / AI 요약 및 추출 결과 저장
========================================================= */
ALTER TABLE COAPP_CRM_SALE COMMENT = '영업일지 및 AI 분석 결과 관리 테이블';

ALTER TABLE COAPP_CRM_SALE MODIFY COLUMN sale_idno int NOT NULL AUTO_INCREMENT COMMENT '영업일지 ID',
MODIFY COLUMN comp_idno int NOT NULL COMMENT '회사 ID (테넌트 키)',
MODIFY COLUMN owne_idno int NOT NULL COMMENT '작성 사용자 ID',
MODIFY COLUMN clie_idno int DEFAULT NULL COMMENT '거래처 ID',
MODIFY COLUMN clie_name varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '거래처명 스냅샷 또는 자유입력',
MODIFY COLUMN cont_name varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '담당자명 스냅샷',
MODIFY COLUMN sale_loca varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '방문 또는 미팅 장소',
MODIFY COLUMN vist_date timestamp NOT NULL COMMENT '방문 일시',
MODIFY COLUMN orig_memo text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '원문 메모 또는 음성 입력 원문',
MODIFY COLUMN aiex_summ text COLLATE utf8mb4_unicode_ci COMMENT 'AI 요약 결과',
MODIFY COLUMN aiex_text json DEFAULT NULL COMMENT 'AI 추출 결과(JSON)',
MODIFY COLUMN sttx_text text COLLATE utf8mb4_unicode_ci COMMENT 'STT 원본 텍스트',
MODIFY COLUMN aiex_done tinyint (1) NOT NULL DEFAULT '0' COMMENT 'AI 처리 완료 여부',
MODIFY COLUMN enab_yesn tinyint (1) NOT NULL DEFAULT '1' COMMENT '활성 여부',
MODIFY COLUMN crea_idno int NOT NULL COMMENT '생성 사용자 ID',
MODIFY COLUMN crea_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
MODIFY COLUMN modi_idno int DEFAULT NULL COMMENT '수정 사용자 ID',
MODIFY COLUMN modi_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정 일시',
MODIFY COLUMN sale_pric decimal(15, 2) DEFAULT NULL COMMENT '관련 금액',
MODIFY COLUMN cont_role varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '담당자 직책 또는 역할',
MODIFY COLUMN cont_tele varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '담당자 연락처',
MODIFY COLUMN cont_mail varchar(320) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '담당자 이메일',
MODIFY COLUMN edit_text text COLLATE utf8mb4_unicode_ci COMMENT '사용자 수정 텍스트',
MODIFY COLUMN aiex_stat enum ('pending', 'processing', 'completed', 'failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT 'AI 분석 상태';

/* =========================================================
COAPP_CRM_SALE_AUDIO_JOB
영업일지 음성/STT/AI 작업
- 음성 전사 및 AI 분석 작업 상태 관리
- 작업 실패 메시지 / 모델명 / 메타 정보 저장
========================================================= */
ALTER TABLE COAPP_CRM_SALE_AUDIO_JOB COMMENT = '영업일지 음성 전사 및 AI 분석 작업 관리 테이블';

ALTER TABLE COAPP_CRM_SALE_AUDIO_JOB MODIFY COLUMN jobs_idno int NOT NULL AUTO_INCREMENT COMMENT '작업 ID',
MODIFY COLUMN comp_idno int NOT NULL COMMENT '회사 ID (테넌트 키)',
MODIFY COLUMN sale_idno int DEFAULT NULL COMMENT '대상 영업일지 ID',
MODIFY COLUMN file_idno int DEFAULT NULL COMMENT '대상 음성 파일 ID',
MODIFY COLUMN jobs_stat enum ('queued', 'running', 'done', 'failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'queued' COMMENT '작업 상태',
MODIFY COLUMN fail_mess text COLLATE utf8mb4_unicode_ci COMMENT '실패 메시지',
MODIFY COLUMN sttx_text text COLLATE utf8mb4_unicode_ci COMMENT 'STT 결과 텍스트',
MODIFY COLUMN aiex_summ text COLLATE utf8mb4_unicode_ci COMMENT 'AI 요약 결과',
MODIFY COLUMN aiex_text json DEFAULT NULL COMMENT 'AI 추출 결과(JSON)',
MODIFY COLUMN sttx_name varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'STT 모델명',
MODIFY COLUMN llmd_name varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'LLM 모델명',
MODIFY COLUMN meta_json json DEFAULT NULL COMMENT '작업 메타 정보(JSON)',
MODIFY COLUMN reqe_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작업 요청 시각',
MODIFY COLUMN fini_date timestamp NULL DEFAULT NULL COMMENT '작업 완료 시각',
MODIFY COLUMN crea_idno int NOT NULL COMMENT '생성 사용자 ID',
MODIFY COLUMN crea_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
MODIFY COLUMN modi_idno int DEFAULT NULL COMMENT '수정 사용자 ID',
MODIFY COLUMN modi_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정 일시',
MODIFY COLUMN jobs_type varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'analyze' COMMENT '작업 유형';