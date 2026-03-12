/* =========================================================
COAPP_CORE_COMPANY_INVITE
회사 초대 관리
- 링크/이메일 초대 발급
- 초대 상태 및 만료 관리
- 수락 시 부여할 회사 역할 지정
========================================================= */
-- 테이블 코멘트
ALTER TABLE COAPP_CORE_COMPANY_INVITE COMMENT = '회사 구성원 초대 관리 테이블';

-- 컬럼 코멘트
-- 실제 DDL과 동일한 타입 / DEFAULT / ON UPDATE 유지
ALTER TABLE COAPP_CORE_COMPANY_INVITE MODIFY COLUMN comp_idno int NOT NULL COMMENT '회사 ID (테넌트 키)',
MODIFY COLUMN invt_idno int NOT NULL AUTO_INCREMENT COMMENT '회사 초대 ID',
MODIFY COLUMN invt_kind enum ('link', 'email') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '초대 방식 코드',
MODIFY COLUMN invt_stat enum ('active', 'used', 'revoked', 'expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT '초대 상태 코드',
MODIFY COLUMN tokn_keys varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '초대 토큰 키',
MODIFY COLUMN mail_idno varchar(320) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '초대 대상 이메일',
MODIFY COLUMN comp_role enum ('owner', 'admin', 'member') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member' COMMENT '수락 시 부여할 회사 역할',
MODIFY COLUMN expi_date timestamp NOT NULL COMMENT '초대 만료 일시',
MODIFY COLUMN used_date timestamp NULL DEFAULT NULL COMMENT '초대 사용 일시',
MODIFY COLUMN used_user int DEFAULT NULL COMMENT '초대를 수락한 사용자 ID',
MODIFY COLUMN crea_idno int NOT NULL COMMENT '생성 사용자 ID',
MODIFY COLUMN crea_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
MODIFY COLUMN modi_idno int DEFAULT NULL COMMENT '수정 사용자 ID',
MODIFY COLUMN modi_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정 일시';

/* =========================================================
COAPP_CORE_COMPANY_USER
회사 구성원 소속 정보
- 회사와 사용자 연결
- 회사 내 역할 및 멤버 상태 관리
========================================================= */
-- 테이블 코멘트
ALTER TABLE COAPP_CORE_COMPANY_USER COMMENT = '회사 구성원 소속 및 권한 관리 테이블';

-- 컬럼 코멘트
-- 실제 DDL과 동일한 타입 / DEFAULT / ON UPDATE 유지
ALTER TABLE COAPP_CORE_COMPANY_USER MODIFY COLUMN comp_idno int NOT NULL COMMENT '회사 ID (테넌트 키)',
MODIFY COLUMN user_idno int NOT NULL COMMENT '사용자 ID',
MODIFY COLUMN comp_role enum ('owner', 'admin', 'member') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member' COMMENT '회사 내 역할 코드',
MODIFY COLUMN memb_stat enum ('active', 'pending', 'removed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT '회사 멤버 상태 코드',
MODIFY COLUMN crea_idno int NOT NULL COMMENT '생성 사용자 ID',
MODIFY COLUMN crea_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
MODIFY COLUMN modi_idno int DEFAULT NULL COMMENT '수정 사용자 ID',
MODIFY COLUMN modi_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정 일시';

/* =========================================================
COAPP_CORE_COMPANY
회사(테넌트) 마스터
- 서비스 내 회사 기본 정보
- 회사 가입/초대 정책 관리
========================================================= */
-- 테이블 코멘트
ALTER TABLE COAPP_CORE_COMPANY COMMENT = '회사(테넌트) 기본 정보 및 정책 관리 테이블';

-- 컬럼 코멘트
-- 실제 DDL과 동일한 타입 / DEFAULT / ON UPDATE 유지
ALTER TABLE COAPP_CORE_COMPANY MODIFY COLUMN comp_idno int NOT NULL AUTO_INCREMENT COMMENT '회사 ID (테넌트 키)',
MODIFY COLUMN comp_name varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '회사명',
MODIFY COLUMN bizn_numb varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '사업자등록번호',
MODIFY COLUMN need_appr tinyint NOT NULL DEFAULT '0' COMMENT '회사 가입 승인 필요 여부(0:아니오, 1:예)',
MODIFY COLUMN mail_doma varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '허용 이메일 도메인',
MODIFY COLUMN link_yesn tinyint NOT NULL DEFAULT '1' COMMENT '링크 초대 허용 여부(0:아니오, 1:예)',
MODIFY COLUMN mail_yesn tinyint NOT NULL DEFAULT '0' COMMENT '이메일 초대 허용 여부(0:아니오, 1:예)',
MODIFY COLUMN crea_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
MODIFY COLUMN modi_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정 일시';

/* =========================================================
COAPP_CORE_FILE_LINK
파일-도메인 엔티티 연결 정보
- 파일을 각 도메인 엔티티에 연결
- 용도 / 정렬 순서 / 소프트 삭제 상태 관리
========================================================= */
-- 테이블 코멘트
ALTER TABLE COAPP_CORE_FILE_LINK COMMENT = '파일과 도메인 엔티티의 연결 관계 관리 테이블';

-- 컬럼 코멘트
-- 실제 DDL과 동일한 타입 / DEFAULT / ON UPDATE 유지
ALTER TABLE COAPP_CORE_FILE_LINK MODIFY COLUMN comp_idno int NOT NULL COMMENT '회사 ID (테넌트 키)',
MODIFY COLUMN file_idno int NOT NULL COMMENT '파일 ID',
MODIFY COLUMN refe_type enum (
    'sale_info',
    'client',
    'promise',
    'order',
    'delivery'
) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '파일 연결 대상 엔티티 유형',
MODIFY COLUMN refe_idno int NOT NULL COMMENT '파일 연결 대상 엔티티 ID',
MODIFY COLUMN purp_type enum (
    'general',
    'sale_audio',
    'sale_image',
    'contract',
    'quote'
) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '파일 용도 유형',
MODIFY COLUMN sort_orde int NOT NULL DEFAULT '0' COMMENT '표시 정렬 순서',
MODIFY COLUMN dele_yesn int NOT NULL DEFAULT '0' COMMENT '링크 삭제 여부(0:유지, 1:삭제)',
MODIFY COLUMN dele_date timestamp NULL DEFAULT NULL COMMENT '링크 삭제 일시',
MODIFY COLUMN crea_idno int NOT NULL COMMENT '생성 사용자 ID',
MODIFY COLUMN crea_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
MODIFY COLUMN modi_idno int DEFAULT NULL COMMENT '수정 사용자 ID',
MODIFY COLUMN modi_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정 일시';

/* =========================================================
COAPP_CORE_FILE
파일 메타데이터 저장
- 업로드된 파일 정보 관리
- 스토리지 위치 및 무결성 정보 저장
========================================================= */
-- 테이블 코멘트
ALTER TABLE COAPP_CORE_FILE COMMENT = '업로드 파일 메타데이터 관리 테이블';

-- 컬럼 코멘트
-- 실제 DDL과 동일한 타입 / DEFAULT / ON UPDATE 유지
ALTER TABLE COAPP_CORE_FILE MODIFY COLUMN file_idno int NOT NULL AUTO_INCREMENT COMMENT '파일 ID',
MODIFY COLUMN comp_idno int NOT NULL COMMENT '회사 ID (테넌트 키)',
MODIFY COLUMN upld_idno int NOT NULL COMMENT '업로드 사용자 ID',
MODIFY COLUMN file_name varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '원본 파일명',
MODIFY COLUMN file_extn varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '파일 확장자',
MODIFY COLUMN mime_type varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '파일 MIME 타입',
MODIFY COLUMN file_size int DEFAULT NULL COMMENT '파일 크기(byte)',
MODIFY COLUMN file_hash varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '파일 해시값',
MODIFY COLUMN stor_drve varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT 's3' COMMENT '스토리지 드라이버',
MODIFY COLUMN file_path varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '스토리지 파일 경로',
MODIFY COLUMN file_addr text COLLATE utf8mb4_unicode_ci COMMENT '파일 접근 URL',
MODIFY COLUMN dura_secs int DEFAULT NULL COMMENT '음성 또는 영상 길이(초)',
MODIFY COLUMN dele_yesn int NOT NULL DEFAULT '0' COMMENT '삭제 여부(0:정상,1:삭제)',
MODIFY COLUMN dele_date timestamp NULL DEFAULT NULL COMMENT '삭제 처리 시각',
MODIFY COLUMN drop_date timestamp NULL DEFAULT NULL COMMENT '스토리지 실제 삭제 예정 시각',
MODIFY COLUMN crea_idno int NOT NULL COMMENT '생성 사용자 ID',
MODIFY COLUMN crea_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시각',
MODIFY COLUMN modi_idno int DEFAULT NULL COMMENT '수정 사용자 ID',
MODIFY COLUMN modi_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정 시각';

/* =========================================================
COAPP_CORE_USER
사용자 마스터
- 서비스 전체 사용자 계정 정보
- 로그인 식별자 / 인증 방식 / 시스템 권한 관리
========================================================= */
-- 테이블 코멘트
ALTER TABLE COAPP_CORE_USER COMMENT = '서비스 사용자 계정 마스터 테이블';

-- 컬럼 코멘트
-- 실제 DDL과 동일한 타입 / DEFAULT / ON UPDATE 유지
ALTER TABLE COAPP_CORE_USER MODIFY COLUMN user_idno int NOT NULL AUTO_INCREMENT COMMENT '사용자 ID',
MODIFY COLUMN open_idno varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '외부 인증 식별자',
MODIFY COLUMN user_name varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '사용자 표시 이름',
MODIFY COLUMN mail_idno varchar(320) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '사용자 이메일 주소',
MODIFY COLUMN pass_hash varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '비밀번호 해시',
MODIFY COLUMN logi_mthd varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '로그인 방식',
MODIFY COLUMN user_auth varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user' COMMENT '시스템 권한 코드',
MODIFY COLUMN last_sign timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '마지막 로그인 시각',
MODIFY COLUMN crea_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
MODIFY COLUMN modi_date timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정 일시';