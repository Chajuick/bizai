/* =========================================================
COAPP_AI_TOKEN_BALANCE
회사별 AI 토큰 현재 잔액 캐시
- 회사당 1행만 유지
- 빠른 잔액 조회용 캐시 테이블
========================================================= */
-- 테이블 코멘트
ALTER TABLE COAPP_AI_TOKEN_BALANCE COMMENT = '회사별 AI 토큰 현재 잔액 캐시 테이블';

-- 컬럼 코멘트
-- 주의:
-- MODIFY COLUMN은 실제 DB DDL과 동일하게 타입/NULL/DEFAULT/ON UPDATE를 유지해야 함
ALTER TABLE COAPP_AI_TOKEN_BALANCE MODIFY COLUMN comp_idno int NOT NULL COMMENT '회사 ID (테넌트 키)',
MODIFY COLUMN bala_tokn int NOT NULL DEFAULT '0' COMMENT '현재 AI 토큰 잔액 캐시',
MODIFY COLUMN modi_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '잔액 최종 갱신 일시';

/* =========================================================
COAPP_AI_TOKEN_LEDGER
회사별 AI 토큰 증감 이력 원장
- 충전 / 월지급 / 사용 / 관리자 조정 내역 기록
- 잔액 자체가 아니라 '변화 이력'을 저장하는 원장 테이블
========================================================= */
-- 테이블 코멘트
ALTER TABLE COAPP_AI_TOKEN_LEDGER COMMENT = '회사별 AI 토큰 증감 이력 원장 테이블';

-- 컬럼 코멘트
-- 주의:
-- MODIFY COLUMN은 실제 DB DDL과 동일하게 타입/NULL/DEFAULT를 유지해야 함
ALTER TABLE COAPP_AI_TOKEN_LEDGER MODIFY COLUMN ldgr_idno int NOT NULL AUTO_INCREMENT COMMENT 'AI 토큰 원장 ID',
MODIFY COLUMN comp_idno int NOT NULL COMMENT '회사 ID (테넌트 키)',
MODIFY COLUMN actv_user int DEFAULT NULL COMMENT '토큰 사용 또는 조정의 주체 사용자 ID',
MODIFY COLUMN resn_code enum (
    'plan_monthly_grant',
    'topup_purchase',
    'usage_chat',
    'usage_stt',
    'usage_llm',
    'admin_adjust'
) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '원장 사유 코드',
MODIFY COLUMN feat_code enum ('chat', 'stt', 'llm') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '관련 AI 기능 코드',
MODIFY COLUMN delt_tokn int NOT NULL COMMENT '토큰 변화량 (+충전 / -차감)',
MODIFY COLUMN year_mont int NOT NULL COMMENT '기준 연월(YYYYMM)',
MODIFY COLUMN refe_type varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '참조 엔티티 유형',
MODIFY COLUMN refe_idno int DEFAULT NULL COMMENT '참조 엔티티 ID',
MODIFY COLUMN meta_json json DEFAULT NULL COMMENT '토큰 사용 상세 메타 정보(JSON)',
MODIFY COLUMN crea_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '원장 발생 일시';

/* =========================================================
COAPP_AI_USAGE_EVENT
AI 기능 사용 이벤트 로그
- 사용자 단위 AI 사용 이벤트 기록
- 토큰 사용량 / 모델 / 메타 정보 저장
- 분석 및 통계 집계의 원천 데이터
========================================================= */
-- 테이블 코멘트
ALTER TABLE COAPP_AI_USAGE_EVENT COMMENT = 'AI 기능 사용 이벤트 로그 테이블';

-- 컬럼 코멘트
-- 실제 DDL과 동일한 타입 / DEFAULT 유지
ALTER TABLE COAPP_AI_USAGE_EVENT MODIFY COLUMN evnt_idno int NOT NULL AUTO_INCREMENT COMMENT 'AI 사용 이벤트 ID',
MODIFY COLUMN comp_idno int NOT NULL COMMENT '회사 ID (테넌트 키)',
MODIFY COLUMN user_idno int NOT NULL COMMENT 'AI 기능 사용 사용자 ID',
MODIFY COLUMN feat_code enum ('chat', 'stt', 'llm') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'AI 기능 코드',
MODIFY COLUMN mode_name varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '사용 모델 이름',
MODIFY COLUMN tokn_inpt int NOT NULL DEFAULT '0' COMMENT '입력 토큰 수',
MODIFY COLUMN tokn_outs int NOT NULL DEFAULT '0' COMMENT '출력 토큰 수',
MODIFY COLUMN tokn_tota int NOT NULL DEFAULT '0' COMMENT '총 토큰 사용량',
MODIFY COLUMN meta_json json DEFAULT NULL COMMENT 'AI 요청 메타 정보(JSON)',
MODIFY COLUMN crea_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '이벤트 발생 시각';

/* =========================================================
COAPP_AI_USAGE_MONTH
AI 기능 월별 사용 집계
- 회사/월/기능 단위 사용량 집계
- Free 플랜 사용 제한 체크용
========================================================= */
-- 테이블 코멘트
ALTER TABLE COAPP_AI_USAGE_MONTH COMMENT = 'AI 기능 월별 사용 집계 테이블';

-- 컬럼 코멘트
-- 실제 DDL과 동일한 타입 / PK / DEFAULT / ON UPDATE 유지
ALTER TABLE COAPP_AI_USAGE_MONTH MODIFY COLUMN comp_idno int NOT NULL COMMENT '회사 ID (테넌트 키)',
MODIFY COLUMN year_mont int NOT NULL COMMENT '집계 기준 연월(YYYYMM)',
MODIFY COLUMN feat_code enum ('chat', 'stt', 'llm') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'AI 기능 코드',
MODIFY COLUMN call_usag int NOT NULL DEFAULT '0' COMMENT '월간 기능 사용 횟수',
MODIFY COLUMN modi_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '집계 최종 갱신 일시';