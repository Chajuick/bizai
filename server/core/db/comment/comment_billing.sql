/* =========================================================
COAPP_BILLING_PLAN
요금제 마스터
- 서비스에서 사용하는 플랜 정의
- free / pro / team / enterprise 기준 정보 보관
========================================================= */
-- 테이블 코멘트
ALTER TABLE COAPP_BILLING_PLAN COMMENT = '서비스 요금제 마스터 테이블';

-- 컬럼 코멘트
-- 실제 DDL과 동일한 타입 / DEFAULT / ON UPDATE 유지
ALTER TABLE COAPP_BILLING_PLAN MODIFY COLUMN plan_idno int NOT NULL AUTO_INCREMENT COMMENT '요금제 ID',
MODIFY COLUMN plan_code enum ('free', 'pro', 'team', 'enterprise') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '요금제 코드',
MODIFY COLUMN plan_name varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '요금제 표시명',
MODIFY COLUMN seat_limt int NOT NULL COMMENT '기본 좌석 수 제한',
MODIFY COLUMN tokn_mont int NOT NULL COMMENT '월 기본 제공 AI 토큰 수',
MODIFY COLUMN crea_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
MODIFY COLUMN modi_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정 일시';

/* =========================================================
COAPP_BILLING_SUBSCRIPTION
회사 구독 정보
- 회사별 현재 적용된 요금제
- 결제 프로바이더 구독 연결
- 좌석 / 토큰 override 정책 관리
========================================================= */
-- 테이블 코멘트
ALTER TABLE COAPP_BILLING_SUBSCRIPTION COMMENT = '회사별 서비스 구독 정보 테이블';

-- 컬럼 코멘트
-- 실제 DDL과 동일한 타입 / DEFAULT / ON UPDATE 유지
ALTER TABLE COAPP_BILLING_SUBSCRIPTION MODIFY COLUMN subs_idno int NOT NULL AUTO_INCREMENT COMMENT '구독 ID',
MODIFY COLUMN comp_idno int NOT NULL COMMENT '회사 ID (테넌트 키)',
MODIFY COLUMN plan_idno int NOT NULL COMMENT '적용 요금제 ID',
MODIFY COLUMN subs_stat enum (
  'active',
  'trialing',
  'canceled',
  'past_due',
  'inactive'
) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT '구독 상태',
MODIFY COLUMN prov_name varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '결제 프로바이더 이름',
MODIFY COLUMN prov_subs varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '프로바이더 구독 ID',
MODIFY COLUMN seat_ovrr int DEFAULT NULL COMMENT '좌석 수 오버라이드',
MODIFY COLUMN tokn_ovrr int DEFAULT NULL COMMENT '월 AI 토큰 오버라이드',
MODIFY COLUMN star_date timestamp NOT NULL COMMENT '현재 결제 주기 시작 시각',
MODIFY COLUMN ends_date timestamp NOT NULL COMMENT '현재 결제 주기 종료 시각',
MODIFY COLUMN crea_idno int NOT NULL COMMENT '생성 사용자 ID',
MODIFY COLUMN crea_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시각',
MODIFY COLUMN modi_idno int DEFAULT NULL COMMENT '수정 사용자 ID',
MODIFY COLUMN modi_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정 시각';