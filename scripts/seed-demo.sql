-- =================================================================
-- bizai Demo Seed Data
-- 6 companies × industry, enterprise plan, multi-user
-- Password for all accounts: 1234
-- =================================================================

-- ── comp_idno=1 CRM 테스트 데이터 정리 ───────────────────────────
DELETE FROM COAPP_CRM_SHIPMENT      WHERE comp_idno = 1;
DELETE FROM COAPP_CRM_ORDER         WHERE comp_idno = 1;
DELETE FROM COAPP_CRM_SALE_AUDIO_JOB WHERE comp_idno = 1;
DELETE FROM COAPP_CRM_SALE          WHERE comp_idno = 1;
DELETE FROM COAPP_CRM_SCHEDULE      WHERE comp_idno = 1;
DELETE FROM COAPP_CRM_EXPENSE       WHERE comp_idno = 1;
DELETE FROM COAPP_CRM_CLIENT_CONT   WHERE comp_idno = 1;
DELETE FROM COAPP_CRM_CLIENT        WHERE comp_idno = 1;

-- ── 기존 데모 데이터 정리(재실행 안전) ──────────────────────────
DELETE FROM COAPP_CRM_SHIPMENT      WHERE comp_idno IN (SELECT comp_idno FROM COAPP_CORE_COMPANY WHERE bizn_numb IN ('1008145231','2018034512','1308092341','1158047823','2078134592','1118045672'));
DELETE FROM COAPP_CRM_ORDER         WHERE comp_idno IN (SELECT comp_idno FROM COAPP_CORE_COMPANY WHERE bizn_numb IN ('1008145231','2018034512','1308092341','1158047823','2078134592','1118045672'));
DELETE FROM COAPP_CRM_SALE_AUDIO_JOB WHERE comp_idno IN (SELECT comp_idno FROM COAPP_CORE_COMPANY WHERE bizn_numb IN ('1008145231','2018034512','1308092341','1158047823','2078134592','1118045672'));
DELETE FROM COAPP_CRM_SALE          WHERE comp_idno IN (SELECT comp_idno FROM COAPP_CORE_COMPANY WHERE bizn_numb IN ('1008145231','2018034512','1308092341','1158047823','2078134592','1118045672'));
DELETE FROM COAPP_CRM_SCHEDULE      WHERE comp_idno IN (SELECT comp_idno FROM COAPP_CORE_COMPANY WHERE bizn_numb IN ('1008145231','2018034512','1308092341','1158047823','2078134592','1118045672'));
DELETE FROM COAPP_CRM_EXPENSE       WHERE comp_idno IN (SELECT comp_idno FROM COAPP_CORE_COMPANY WHERE bizn_numb IN ('1008145231','2018034512','1308092341','1158047823','2078134592','1118045672'));
DELETE FROM COAPP_CRM_CLIENT_CONT   WHERE comp_idno IN (SELECT comp_idno FROM COAPP_CORE_COMPANY WHERE bizn_numb IN ('1008145231','2018034512','1308092341','1158047823','2078134592','1118045672'));
DELETE FROM COAPP_CRM_CLIENT        WHERE comp_idno IN (SELECT comp_idno FROM COAPP_CORE_COMPANY WHERE bizn_numb IN ('1008145231','2018034512','1308092341','1158047823','2078134592','1118045672'));
DELETE FROM COAPP_BILLING_SUBSCRIPTION WHERE comp_idno IN (SELECT comp_idno FROM COAPP_CORE_COMPANY WHERE bizn_numb IN ('1008145231','2018034512','1308092341','1158047823','2078134592','1118045672'));
DELETE FROM COAPP_CORE_COMPANY_USER    WHERE user_idno IN (SELECT user_idno FROM COAPP_CORE_USER WHERE mail_idno IN ('ceo@ind.co.kr','sales@ind.co.kr','acct@ind.co.kr','ceo@sol.co.kr','lead@sol.co.kr','sales@sol.co.kr','acct@sol.co.kr','ceo@space.co.kr','acct@space.co.kr','ceo@food.co.kr','ceo@eco.co.kr','mgr@eco.co.kr','ceo@uni.co.kr','sales@uni.co.kr'));
DELETE FROM COAPP_CORE_USER            WHERE mail_idno IN ('ceo@ind.co.kr','sales@ind.co.kr','acct@ind.co.kr','ceo@sol.co.kr','lead@sol.co.kr','sales@sol.co.kr','acct@sol.co.kr','ceo@space.co.kr','acct@space.co.kr','ceo@food.co.kr','ceo@eco.co.kr','mgr@eco.co.kr','ceo@uni.co.kr','sales@uni.co.kr');
DELETE FROM COAPP_CORE_COMPANY         WHERE bizn_numb IN ('1008145231','2018034512','1308092341','1158047823','2078134592','1118045672');

-- =================================================================
-- COMPANY 1: 한국산업기계(주) — 제조/유통
-- 사장(대표): 강민준 — 현황 보고 위주, 직접 입력 거의 없음
-- 영업사원:  이준혁 — 영업일지·일정 담당
-- 경리:      박소연 — 수주·납품·지출 담당
-- =================================================================

INSERT INTO COAPP_CORE_COMPANY (comp_name, bizn_numb, need_appr, link_yesn, mail_yesn, crea_date)
VALUES ('한국산업기계(주)', '1008145231', 0, 1, 0, '2024-09-02 09:00:00');
SET @ko1 = LAST_INSERT_ID();

INSERT INTO COAPP_CORE_USER (open_idno, user_name, mail_idno, pass_hash, logi_mthd, user_auth, crea_date)
VALUES ('local:ceo@ind.co.kr',   '강민준', 'ceo@ind.co.kr',   '$2b$10$I46TB4EhdCy.iw6JREGXLOsICv4cJem4e.TiYLSmgX4gLsz8rA.P6', 'email', 'user', '2024-09-02 09:00:00');
SET @ku1 = LAST_INSERT_ID();
INSERT INTO COAPP_CORE_USER (open_idno, user_name, mail_idno, pass_hash, logi_mthd, user_auth, crea_date)
VALUES ('local:sales@ind.co.kr', '이준혁', 'sales@ind.co.kr', '$2b$10$I46TB4EhdCy.iw6JREGXLOsICv4cJem4e.TiYLSmgX4gLsz8rA.P6', 'email', 'user', '2024-09-02 09:10:00');
SET @ku2 = LAST_INSERT_ID();
INSERT INTO COAPP_CORE_USER (open_idno, user_name, mail_idno, pass_hash, logi_mthd, user_auth, crea_date)
VALUES ('local:acct@ind.co.kr',  '박소연', 'acct@ind.co.kr',  '$2b$10$I46TB4EhdCy.iw6JREGXLOsICv4cJem4e.TiYLSmgX4gLsz8rA.P6', 'email', 'user', '2024-09-02 09:20:00');
SET @ku3 = LAST_INSERT_ID();

INSERT INTO COAPP_CORE_COMPANY_USER (comp_idno, user_idno, comp_role, memb_stat, crea_idno) VALUES
(@ko1, @ku1, 'owner',  'active', @ku1),
(@ko1, @ku2, 'member', 'active', @ku1),
(@ko1, @ku3, 'member', 'active', @ku1);

INSERT INTO COAPP_BILLING_SUBSCRIPTION (comp_idno, plan_idno, subs_stat, star_date, ends_date, crea_idno)
VALUES (@ko1, 4, 'active', '2024-09-02', '2027-12-31', @ku1);

-- 거래처
INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, '(주)현대정밀부품',  '1048193201', 'sales', '제조업',   '경기도 화성시 향남읍 발안공단로 89', '주력 거래처. 프레스 금형 부품 정기 공급', 1, @ku2, '2024-09-05 10:00:00');
SET @k1c1 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, '삼성중공업 협력사', '2078045123', 'sales', '중공업',   '경남 거제시 옥포2동 산업단지로 35', '대형 기계 부품 납품. 연 2-3회 대형 수주', 1, @ku2, '2024-09-10 11:00:00');
SET @k1c2 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, '(주)동양자동화',    '1108023451', 'sales', '자동화설비', '인천시 남동구 논현동 산업단지 201', '자동화 라인 부품 교체 수요 있음', 1, @ku2, '2024-10-03 09:00:00');
SET @k1c3 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, '코리아패키징',      '1198123041', 'sales', '포장기계',  '충남 천안시 서북구 성환읍 농공단지 55', NULL, 1, @ku2, '2024-11-12 10:00:00');
SET @k1c4 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, '(주)한진물류',      '1048092341', 'sales', '물류/운송', '서울시 중구 청계천로 100 한진빌딩',    '물류 컨베이어 벨트 부품 납품', 1, @ku2, '2025-01-08 09:00:00');
SET @k1c5 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, '성원철강자재',      '1308145231', 'purchase', '철강/자재', '경기도 안산시 단원구 공단로 310', '주요 원자재 공급사. 월 정기 발주', 1, @ku3, '2024-09-03 09:00:00');
SET @k1c6 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, '(주)서울공구',      '1108203451', 'purchase', '공구/소모품', '서울시 영등포구 문래동 공구상가 45', NULL, 1, @ku3, '2024-09-15 10:00:00');
SET @k1c7 = LAST_INSERT_ID();

-- 담당자
INSERT INTO COAPP_CRM_CLIENT_CONT (comp_idno, clie_idno, cont_name, cont_role, cont_tele, cont_mail, main_yesn, enab_yesn, crea_idno) VALUES
(@ko1, @k1c1, '윤재호', '구매팀장', '010-3312-8821', 'jh.yoon@hdprecision.co.kr', 1, 1, @ku2),
(@ko1, @k1c1, '김나영', '구매담당', '010-5534-1190', 'ny.kim@hdprecision.co.kr',  0, 1, @ku2),
(@ko1, @k1c2, '이상민', '자재팀 과장', '010-7782-3341', 'sm.lee@shi-partner.co.kr', 1, 1, @ku2),
(@ko1, @k1c3, '최진우', '생산기술팀장', '010-9901-4412', 'jw.choi@dongyang-auto.co.kr', 1, 1, @ku2),
(@ko1, @k1c4, '박기현', '설비담당', '010-2234-5561', 'kh.park@koreapkg.co.kr', 1, 1, @ku2),
(@ko1, @k1c5, '정수환', '물류설비팀', '010-8845-2231', 'sh.jung@hanjin-logi.co.kr', 1, 1, @ku2),
(@ko1, @k1c6, '한대현', '영업부장', '010-4456-7712', 'dh.han@swsteel.co.kr', 1, 1, @ku3),
(@ko1, @k1c7, '오길수', '대표', '010-3312-0023', NULL, 1, 1, @ku3);

-- 영업일지 (이준혁 owne_idno=@ku2)
INSERT INTO COAPP_CRM_SALE (comp_idno, owne_idno, clie_idno, clie_name, cont_name, vist_date, orig_memo, aiex_summ, aiex_done, aiex_stat, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, @ku2, @k1c1, '(주)현대정밀부품', '윤재호', '2024-09-18 10:00:00',
 '현대정밀부품 구매팀장 윤재호 씨 방문. 4분기 프레스 금형 부품 추가 발주 논의. 기존 단가 유지 요청. 납기 최대 3주 이내로 맞춰줄 것.',
 '현대정밀부품 윤재호 팀장과 4분기 금형 부품 추가 발주 논의. 기존 단가 유지, 납기 3주 이내 조건 확인.',
 1, 'completed', 1, @ku2, '2024-09-18 11:00:00'),

(@ko1, @ku2, @k1c1, '(주)현대정밀부품', '윤재호', '2024-10-25 14:00:00',
 '윤재호 팀장 후속 미팅. 발주 수량 확정. 총 2,800만원 규모. 계약서 초안 검토 완료.',
 '현대정밀부품 4분기 금형 부품 발주 확정. 총 2,800만원. 계약서 초안 합의.',
 1, 'completed', 1, @ku2, '2024-10-25 15:00:00'),

(@ko1, @ku2, @k1c1, '(주)현대정밀부품', '윤재호', '2025-01-15 10:00:00',
 '신년 방문. 1분기 발주 계획 확인. 올해 라인 증설 예정이라 물량 20% 증가 예상. 3월 중 신규 품목 샘플 요청.',
 '1분기 발주 계획 논의. 라인 증설로 연간 물량 20% 증가 예상. 3월 신규 품목 샘플 제출 요청.',
 1, 'completed', 1, @ku2, '2025-01-15 11:00:00'),

(@ko1, @ku2, @k1c1, '(주)현대정밀부품', '김나영', '2025-03-20 11:00:00',
 '김나영 담당자와 샘플 검토 미팅. 신규 품목 2종 테스트 결과 양호. 2분기부터 정식 발주 진행 예정.',
 '신규 부품 샘플 2종 테스트 통과. 2분기부터 정식 발주 예정.',
 1, 'completed', 1, @ku2, '2025-03-20 12:00:00'),

(@ko1, @ku2, @k1c1, '(주)현대정밀부품', '윤재호', '2025-06-10 10:00:00',
 '반기 리뷰 미팅. 납품 품질 전반적으로 만족. 하반기 물량 협의. 단가 인상 요청 있었으나 5% 수준에서 협의 중.',
 '상반기 납품 품질 만족. 하반기 물량 협의. 단가 5% 인상 협상 진행 중.',
 1, 'completed', 1, @ku2, '2025-06-10 11:00:00'),

(@ko1, @ku2, @k1c2, '삼성중공업 협력사', '이상민', '2024-10-08 14:00:00',
 '이상민 과장 첫 방문. 해양플랜트용 대형 볼트/너트류 견적 요청. 규격 복잡함. 도면 수령하여 검토 후 2주 내 견적 제출 약속.',
 '삼성중공업 협력사 해양플랜트용 대형 체결부품 견적 요청. 도면 검토 후 2주 내 견적 제출 예정.',
 1, 'completed', 1, @ku2, '2024-10-08 15:00:00'),

(@ko1, @ku2, @k1c2, '삼성중공업 협력사', '이상민', '2024-11-05 10:00:00',
 '견적서 제출 후 검토 미팅. 단가 30% 인하 요청. 협의 끝에 15% 할인 조건 합의. 총 계약금 1억 2천만원.',
 '견적 협상 완료. 15% 할인 조건으로 총 1억 2천만원 계약 합의.',
 1, 'completed', 1, @ku2, '2024-11-05 11:00:00'),

(@ko1, @ku2, @k1c2, '삼성중공업 협력사', '이상민', '2025-04-22 10:00:00',
 '2차 대형 발주 논의. 모듈 2호기 착공 관련 체결부품 발주 예정. 규모 약 8천만원. 5월 초 견적 제출 요청.',
 '2호기 모듈 착공 관련 체결부품 8천만원 규모 발주 논의. 5월 초 견적 제출 예정.',
 1, 'completed', 1, @ku2, '2025-04-22 11:00:00'),

(@ko1, @ku2, @k1c3, '(주)동양자동화', '최진우', '2024-10-15 11:00:00',
 '생산기술팀장 최진우 씨와 컨베이어 부품 교체 논의. 노후 설비 부품 약 45종. 단납기 가능 여부 확인 요청. 2주 내 가능.',
 '동양자동화 노후 컨베이어 부품 45종 교체 논의. 2주 납기 가능 확인.',
 1, 'completed', 1, @ku2, '2024-10-15 12:00:00'),

(@ko1, @ku2, @k1c3, '(주)동양자동화', '최진우', '2025-02-18 10:00:00',
 '연간 유지보수 부품 공급 계약 논의. 월 500만원 고정 발주 조건. 납품 일정 15일 주기.',
 '동양자동화 연간 유지보수 부품 공급 계약 논의. 월 500만원, 15일 주기 납품 조건.',
 1, 'completed', 1, @ku2, '2025-02-18 11:00:00'),

(@ko1, @ku2, @k1c4, '코리아패키징', '박기현', '2024-12-03 10:00:00',
 '설비 담당 박기현 씨 미팅. 포장라인 증설 프로젝트 관련 부품 견적 의뢰. 내년 1분기 발주 예정.',
 '코리아패키징 포장라인 증설 관련 부품 견적 의뢰. 1분기 발주 예정.',
 1, 'completed', 1, @ku2, '2024-12-03 11:00:00'),

(@ko1, @ku2, @k1c4, '코리아패키징', '박기현', '2025-03-05 11:00:00',
 '포장라인 증설 최종 확정. 발주 금액 3,500만원. 3월 말 착수 예정.',
 '포장라인 증설 발주 3,500만원 확정. 3월 말 착수.',
 1, 'completed', 1, @ku2, '2025-03-05 12:00:00'),

(@ko1, @ku2, @k1c5, '(주)한진물류', '정수환', '2025-01-20 14:00:00',
 '물류설비팀 정수환 씨 미팅. 자동분류 컨베이어 부품 노후화로 전면 교체 검토 중. 현장 실사 요청.',
 '한진물류 자동분류 컨베이어 부품 전면 교체 논의. 현장 실사 일정 잡기로.',
 1, 'completed', 1, @ku2, '2025-01-20 15:00:00'),

(@ko1, @ku2, @k1c5, '(주)한진물류', '정수환', '2025-02-10 10:00:00',
 '현장 실사 완료. 교체 필요 부품 70종 목록 작성. 견적 제출. 약 6,200만원 규모.',
 '현장 실사 후 교체 부품 70종 목록 작성 완료. 견적 6,200만원 제출.',
 1, 'completed', 1, @ku2, '2025-02-10 11:00:00'),

(@ko1, @ku2, @k1c5, '(주)한진물류', '정수환', '2025-03-25 10:00:00',
 '한진물류 최종 계약 확정. 분할 납품 조건. 4월, 5월, 6월 3회 분할.',
 '한진물류 6,200만원 계약 확정. 4-6월 3회 분할 납품.',
 1, 'completed', 1, @ku2, '2025-03-25 11:00:00'),

(@ko1, @ku2, @k1c1, '(주)현대정밀부품', '윤재호', '2025-08-14 10:00:00',
 '하반기 발주 확정 미팅. 연간 최대 발주. 3분기 3,200만원, 4분기 예상 3,000만원.',
 '하반기 발주 확정. 3분기 3,200만원, 4분기 3,000만원 예상.',
 1, 'completed', 1, @ku2, '2025-08-14 11:00:00'),

(@ko1, @ku2, @k1c3, '(주)동양자동화', '최진우', '2025-09-10 11:00:00',
 '월간 정기 방문. 이번 달 납품 현황 확인. 특이사항 없음. 내달 추가 발주 예정 물량 문의.',
 '동양자동화 정기 방문. 납품 현황 이상 없음. 10월 추가 발주 물량 파악.',
 1, 'completed', 1, @ku2, '2025-09-10 12:00:00'),

(@ko1, @ku2, @k1c1, '(주)현대정밀부품', '윤재호', '2025-11-20 10:00:00',
 '연말 결산 방문. 내년도 공급 계약 갱신 논의. 단가 3% 인상 합의. 연 발주 규모 12억 예상.',
 '연간 공급 계약 갱신. 단가 3% 인상, 연 12억 예상 발주.',
 1, 'completed', 1, @ku2, '2025-11-20 11:00:00'),

(@ko1, @ku2, @k1c2, '삼성중공업 협력사', '이상민', '2025-12-08 10:00:00',
 '연말 방문. 내년도 프로젝트 일정 공유. 상반기 2건 대형 발주 예정.',
 '삼성중공업 내년 상반기 대형 발주 2건 예정 확인.',
 1, 'completed', 1, @ku2, '2025-12-08 11:00:00'),

(@ko1, @ku2, @k1c5, '(주)한진물류', '정수환', '2026-02-05 10:00:00',
 '신규 물류센터 오픈 관련 설비 부품 납품 논의. 규모 약 4,500만원. 3월 착수 예정.',
 '한진물류 신규 센터 설비 부품 4,500만원 규모. 3월 착수 논의.',
 1, 'completed', 1, @ku2, '2026-02-05 11:00:00'),

(@ko1, @ku2, @k1c4, '코리아패키징', '박기현', '2026-03-15 11:00:00',
 '2분기 발주 사전 협의. 하절기 증산 대비 예비 부품 재고 확보 요청. 4월 초 발주 예정.',
 '코리아패키징 2분기 예비 부품 확보 논의. 4월 초 발주 예정.',
 0, 'pending', 1, @ku2, '2026-03-15 12:00:00');

-- 수주 (박소연 owne_idno=@ku3)
INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, @ku3, @k1c1, '(주)현대정밀부품', '4분기 프레스 금형 부품 공급', 28000000, 'confirmed', '2024-10-28', '2024-11-20', 1, @ku3, '2024-10-28 09:00:00');
SET @ko1_ord1 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, @ku3, @k1c2, '삼성중공업 협력사', '해양플랜트 체결부품 공급', 120000000, 'confirmed', '2024-11-08', '2025-01-31', 1, @ku3, '2024-11-08 09:00:00');
SET @ko1_ord2 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, @ku3, @k1c3, '(주)동양자동화', '컨베이어 노후 부품 교체 공급', 18500000, 'confirmed', '2024-10-22', '2024-11-10', 1, @ku3, '2024-10-22 09:00:00');
SET @ko1_ord3 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, @ku3, @k1c3, '(주)동양자동화', '연간 유지보수 부품 공급 계약 (1분기)', 15000000, 'confirmed', '2025-03-01', '2025-03-31', 1, @ku3, '2025-03-01 09:00:00');
SET @ko1_ord4 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, @ku3, @k1c4, '코리아패키징', '포장라인 증설 부품 납품', 35000000, 'confirmed', '2025-03-10', '2025-04-10', 1, @ku3, '2025-03-10 09:00:00');
SET @ko1_ord5 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, @ku3, @k1c5, '(주)한진물류', '자동분류 컨베이어 부품 교체', 62000000, 'confirmed', '2025-04-01', '2025-06-30', 1, @ku3, '2025-04-01 09:00:00');
SET @ko1_ord6 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, @ku3, @k1c1, '(주)현대정밀부품', '상반기 금형 부품 공급 (1차)', 32000000, 'confirmed', '2025-04-05', '2025-04-30', 1, @ku3, '2025-04-05 09:00:00');
SET @ko1_ord7 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, @ku3, @k1c2, '삼성중공업 협력사', '2호기 모듈 체결부품 공급', 80000000, 'negotiation', NULL, '2025-07-31', 1, @ku3, '2025-04-28 10:00:00');
SET @ko1_ord8 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, @ku3, @k1c5, '(주)한진물류', '신규 물류센터 설비 부품 납품', 45000000, 'proposal', NULL, '2026-04-30', 1, @ku3, '2026-02-10 10:00:00');
SET @ko1_ord9 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, @ku3, @k1c1, '(주)현대정밀부품', '3분기 금형 부품 공급', 32000000, 'confirmed', '2025-07-10', '2025-08-15', 1, @ku3, '2025-07-10 09:00:00');
SET @ko1_ord10 = LAST_INSERT_ID();

-- 납품
INSERT INTO COAPP_CRM_SHIPMENT (comp_idno, owne_idno, orde_idno, clie_idno, clie_name, ship_stat, ship_date, invc_date, paid_date, ship_pric, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, @ku3, @ko1_ord1, @k1c1, '(주)현대정밀부품', 'paid', '2024-11-18', '2024-11-25', '2024-12-05', 28000000, 1, @ku3, '2024-11-18 09:00:00'),
(@ko1, @ku3, @ko1_ord2, @k1c2, '삼성중공업 협력사', 'paid', '2025-01-28', '2025-02-05', '2025-02-20', 120000000, 1, @ku3, '2025-01-28 09:00:00'),
(@ko1, @ku3, @ko1_ord3, @k1c3, '(주)동양자동화', 'paid', '2024-11-08', '2024-11-15', '2024-11-28', 18500000, 1, @ku3, '2024-11-08 09:00:00'),
(@ko1, @ku3, @ko1_ord4, @k1c3, '(주)동양자동화', 'paid', '2025-03-28', '2025-04-05', '2025-04-18', 15000000, 1, @ku3, '2025-03-28 09:00:00'),
(@ko1, @ku3, @ko1_ord5, @k1c4, '코리아패키징', 'paid', '2025-04-08', '2025-04-15', '2025-04-30', 35000000, 1, @ku3, '2025-04-08 09:00:00'),
(@ko1, @ku3, @ko1_ord6, @k1c5, '(주)한진물류', 'paid', '2025-04-28', '2025-05-05', '2025-05-20', 21000000, 1, @ku3, '2025-04-28 09:00:00'),
(@ko1, @ku3, @ko1_ord6, @k1c5, '(주)한진물류', 'paid', '2025-05-28', '2025-06-05', '2025-06-20', 21000000, 1, @ku3, '2025-05-28 09:00:00'),
(@ko1, @ku3, @ko1_ord6, @k1c5, '(주)한진물류', 'paid', '2025-06-25', '2025-07-02', '2025-07-18', 20000000, 1, @ku3, '2025-06-25 09:00:00'),
(@ko1, @ku3, @ko1_ord7, @k1c1, '(주)현대정밀부품', 'paid', '2025-04-28', '2025-05-05', '2025-05-20', 32000000, 1, @ku3, '2025-04-28 09:00:00'),
(@ko1, @ku3, @ko1_ord10, @k1c1, '(주)현대정밀부품', 'invoiced', '2025-08-12', '2025-08-20', NULL, 32000000, 1, @ku3, '2025-08-12 09:00:00');

-- 일정 (이준혁 + 강민준)
INSERT INTO COAPP_CRM_SCHEDULE (comp_idno, owne_idno, clie_idno, clie_name, sche_name, sche_desc, sche_date, sche_stat, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, @ku2, @k1c1, '(주)현대정밀부품', '2분기 발주 협의 미팅', '연간 공급 계약 2분기 물량 확정', '2025-04-10 10:00:00', 'completed', 1, @ku2, '2025-04-07 09:00:00'),
(@ko1, @ku2, @k1c2, '삼성중공업 협력사', '2호기 견적 제출', '체결부품 견적서 전달 및 협의', '2025-05-08 10:00:00', 'completed', 1, @ku2, '2025-04-28 09:00:00'),
(@ko1, @ku2, @k1c3, '(주)동양자동화', '2분기 유지보수 부품 납기 확인', NULL, '2025-06-05 11:00:00', 'completed', 1, @ku2, '2025-06-01 09:00:00'),
(@ko1, @ku2, @k1c4, '코리아패키징', '3분기 발주 사전 미팅', '하절기 증산 대비 예비 부품', '2025-07-15 10:00:00', 'completed', 1, @ku2, '2025-07-10 09:00:00'),
(@ko1, @ku2, @k1c5, '(주)한진물류', '분기 납품 완료 보고', '3차 분할 납품 완료 확인', '2025-07-02 11:00:00', 'completed', 1, @ku2, '2025-06-28 09:00:00'),
(@ko1, @ku2, @k1c1, '(주)현대정밀부품', '3분기 납품 현황 방문', NULL, '2025-08-20 10:00:00', 'completed', 1, @ku2, '2025-08-15 09:00:00'),
(@ko1, @ku2, @k1c2, '삼성중공업 협력사', '2호기 계약 최종 협의', NULL, '2025-09-15 10:00:00', 'completed', 1, @ku2, '2025-09-10 09:00:00'),
(@ko1, @ku2, @k1c1, '(주)현대정밀부품', '연말 계약 갱신 방문', '내년도 단가/물량 협의', '2025-11-20 10:00:00', 'completed', 1, @ku2, '2025-11-15 09:00:00'),
(@ko1, @ku1, @k1c2, '삼성중공업 협력사', '대표 동행 미팅', '대형 거래처 관계 강화', '2025-12-10 14:00:00', 'completed', 1, @ku1, '2025-12-05 09:00:00'),
(@ko1, @ku2, @k1c5, '(주)한진물류', '신규 센터 현장 실사', '부품 교체 범위 확인', '2026-02-20 10:00:00', 'completed', 1, @ku2, '2026-02-15 09:00:00'),
(@ko1, @ku2, @k1c4, '코리아패키징', '4월 발주 최종 확정 미팅', NULL, '2026-04-10 10:00:00', 'scheduled', 1, @ku2, '2026-04-01 09:00:00'),
(@ko1, @ku2, @k1c1, '(주)현대정밀부품', '1분기 발주 계약 서명', NULL, '2026-04-15 10:00:00', 'scheduled', 1, @ku2, '2026-04-07 09:00:00'),
(@ko1, @ku2, @k1c2, '삼성중공업 협력사', '상반기 2차 발주 견적 미팅', NULL, '2026-04-22 14:00:00', 'scheduled', 1, @ku2, '2026-04-07 09:00:00');

-- 지출 (박소연 owne_idno=@ku3)
INSERT INTO COAPP_CRM_EXPENSE (comp_idno, clie_idno, clie_name, expe_name, expe_date, expe_amnt, expe_type, paym_meth, recr_type, enab_yesn, crea_idno, crea_date) VALUES
(@ko1, @k1c6, '성원철강자재', '10월 원자재 매입', '2024-10-20 00:00:00', 12500000, 'receipt', 'transfer', 'monthly', 1, @ku3, '2024-10-21 09:00:00'),
(@ko1, @k1c6, '성원철강자재', '11월 원자재 매입', '2024-11-20 00:00:00', 13200000, 'receipt', 'transfer', 'monthly', 1, @ku3, '2024-11-21 09:00:00'),
(@ko1, @k1c6, '성원철강자재', '12월 원자재 매입', '2024-12-20 00:00:00', 11800000, 'receipt', 'transfer', 'monthly', 1, @ku3, '2024-12-21 09:00:00'),
(@ko1, @k1c6, '성원철강자재', '1월 원자재 매입', '2025-01-20 00:00:00', 14300000, 'receipt', 'transfer', 'monthly', 1, @ku3, '2025-01-21 09:00:00'),
(@ko1, @k1c6, '성원철강자재', '2월 원자재 매입', '2025-02-20 00:00:00', 13900000, 'receipt', 'transfer', 'monthly', 1, @ku3, '2025-02-21 09:00:00'),
(@ko1, @k1c7, '(주)서울공구', '2분기 공구/소모품 구매', '2025-04-08 00:00:00', 1850000, 'receipt', 'card', 'none', 1, @ku3, '2025-04-08 10:00:00'),
(@ko1, @k1c7, '(주)서울공구', '3분기 공구/소모품 구매', '2025-07-10 00:00:00', 2100000, 'receipt', 'card', 'none', 1, @ku3, '2025-07-10 10:00:00'),
(@ko1, @k1c6, '성원철강자재', '8월 원자재 매입', '2025-08-20 00:00:00', 15600000, 'receipt', 'transfer', 'monthly', 1, @ku3, '2025-08-21 09:00:00'),
(@ko1, @k1c7, '(주)서울공구', '4분기 공구/소모품 구매', '2025-10-08 00:00:00', 1980000, 'receipt', 'card', 'none', 1, @ku3, '2025-10-08 10:00:00'),
(@ko1, @k1c6, '성원철강자재', '3월 원자재 매입', '2026-03-20 00:00:00', 16200000, 'receipt', 'transfer', 'monthly', 1, @ku3, '2026-03-21 09:00:00');


-- =================================================================
-- COMPANY 2: 넥스트솔루션(주) — IT/솔루션
-- 사장:     윤태현 — 전체 현황 열람
-- 영업팀장: 김성준 — 주요 고객 관리, 계약 주도
-- 영업사원: 최지훈 — 영업일지·일정 다수 입력
-- 경리:     정미라 — 수주·납품·지출 전담
-- =================================================================

INSERT INTO COAPP_CORE_COMPANY (comp_name, bizn_numb, need_appr, link_yesn, mail_yesn, crea_date)
VALUES ('넥스트솔루션(주)', '2018034512', 0, 1, 0, '2024-09-01 09:00:00');
SET @ko2 = LAST_INSERT_ID();

INSERT INTO COAPP_CORE_USER (open_idno, user_name, mail_idno, pass_hash, logi_mthd, user_auth, crea_date)
VALUES ('local:ceo@sol.co.kr',   '윤태현', 'ceo@sol.co.kr',   '$2b$10$I46TB4EhdCy.iw6JREGXLOsICv4cJem4e.TiYLSmgX4gLsz8rA.P6', 'email', 'user', '2024-09-01 09:00:00');
SET @ku4 = LAST_INSERT_ID();
INSERT INTO COAPP_CORE_USER (open_idno, user_name, mail_idno, pass_hash, logi_mthd, user_auth, crea_date)
VALUES ('local:lead@sol.co.kr',  '김성준', 'lead@sol.co.kr',  '$2b$10$I46TB4EhdCy.iw6JREGXLOsICv4cJem4e.TiYLSmgX4gLsz8rA.P6', 'email', 'user', '2024-09-01 09:10:00');
SET @ku5 = LAST_INSERT_ID();
INSERT INTO COAPP_CORE_USER (open_idno, user_name, mail_idno, pass_hash, logi_mthd, user_auth, crea_date)
VALUES ('local:sales@sol.co.kr', '최지훈', 'sales@sol.co.kr', '$2b$10$I46TB4EhdCy.iw6JREGXLOsICv4cJem4e.TiYLSmgX4gLsz8rA.P6', 'email', 'user', '2024-09-01 09:20:00');
SET @ku6 = LAST_INSERT_ID();
INSERT INTO COAPP_CORE_USER (open_idno, user_name, mail_idno, pass_hash, logi_mthd, user_auth, crea_date)
VALUES ('local:acct@sol.co.kr',  '정미라', 'acct@sol.co.kr',  '$2b$10$I46TB4EhdCy.iw6JREGXLOsICv4cJem4e.TiYLSmgX4gLsz8rA.P6', 'email', 'user', '2024-09-01 09:30:00');
SET @ku7 = LAST_INSERT_ID();

INSERT INTO COAPP_CORE_COMPANY_USER (comp_idno, user_idno, comp_role, memb_stat, crea_idno) VALUES
(@ko2, @ku4, 'owner',  'active', @ku4),
(@ko2, @ku5, 'admin',  'active', @ku4),
(@ko2, @ku6, 'member', 'active', @ku4),
(@ko2, @ku7, 'member', 'active', @ku4);

INSERT INTO COAPP_BILLING_SUBSCRIPTION (comp_idno, plan_idno, subs_stat, star_date, ends_date, crea_idno)
VALUES (@ko2, 4, 'active', '2024-09-01', '2027-12-31', @ku4);

-- 거래처
INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, '(주)한국화재보험', '1018023451', 'sales', '금융/보험', '서울시 종로구 종로 1 교보빌딩 15층', '전사 IT인프라 고도화 프로젝트 진행 중', 1, @ku5, '2024-09-05 09:00:00');
SET @k2c1 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, '세종병원그룹', '2098034512', 'sales', '의료/병원', '경기도 부천시 조마루로 17 세종병원', '의료정보시스템 납품 및 유지보수', 1, @ku6, '2024-09-12 10:00:00');
SET @k2c2 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, '서울교통공사', '1038012341', 'sales', '공공기관', '서울시 성동구 왕십리로 245', '전산 인프라 유지보수 연간 계약', 1, @ku6, '2024-10-01 09:00:00');
SET @k2c3 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, '신한캐피탈(주)', '1048124512', 'sales', '금융', '서울시 중구 세종대로 136 신한금융빌딩', NULL, 1, @ku6, '2024-11-05 10:00:00');
SET @k2c4 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, '(주)한국전자부품', '2018124312', 'sales', '제조업', '경기도 수원시 팔달구 인계로 178', '공장 스마트 모니터링 시스템', 1, @ku6, '2025-01-10 09:00:00');
SET @k2c5 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, '인천국제공항공사', '1508023451', 'sales', '공공기관', '인천시 중구 공항로 272 인천국제공항', '보안시스템 소프트웨어 유지보수', 1, @ku6, '2025-02-15 10:00:00');
SET @k2c6 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, '마이크로소프트 코리아', '1108045231', 'purchase', '소프트웨어', '서울시 강남구 테헤란로 152 강남파이낸스센터', 'MS 라이선스 공급사', 1, @ku7, '2024-09-03 09:00:00');
SET @k2c7 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, '클라우드허브코리아', '2108034512', 'purchase', 'IT인프라', '서울시 강남구 역삼동 634 클라우드빌딩', 'AWS 리셀러 공급사', 1, @ku7, '2024-09-10 10:00:00');
SET @k2c8 = LAST_INSERT_ID();

-- 담당자
INSERT INTO COAPP_CRM_CLIENT_CONT (comp_idno, clie_idno, cont_name, cont_role, cont_tele, cont_mail, main_yesn, enab_yesn, crea_idno) VALUES
(@ko2, @k2c1, '이정훈', 'IT전략팀장', '010-4412-8823', 'jh.lee@koreafi.co.kr', 1, 1, @ku5),
(@ko2, @k2c1, '홍미선', 'IT구매담당', '010-7712-3341', 'ms.hong@koreafi.co.kr', 0, 1, @ku5),
(@ko2, @k2c2, '서현경', '의료정보팀장', '010-3345-8812', 'hk.seo@sejong-hosp.co.kr', 1, 1, @ku6),
(@ko2, @k2c3, '김도영', '전산운영팀장', '010-9901-2234', 'dy.kim@seoulmetro.co.kr', 1, 1, @ku6),
(@ko2, @k2c4, '박준혁', 'IT기획팀 차장', '010-5523-9901', 'jh.park@shincap.co.kr', 1, 1, @ku6),
(@ko2, @k2c5, '강태욱', '스마트팩토리담당', '010-8834-5512', 'tw.kang@hkelectronics.co.kr', 1, 1, @ku6),
(@ko2, @k2c6, '조재원', '보안시스템팀', '010-2231-7789', 'jw.cho@airport.co.kr', 1, 1, @ku6),
(@ko2, @k2c7, '이현정', '파트너채널팀', '010-6678-1123', 'hj.lee@microsoft.com', 1, 1, @ku7),
(@ko2, @k2c8, '문성철', '클라우드영업', '010-4456-3312', 'sc.moon@cloudhub.co.kr', 1, 1, @ku7);

-- 영업일지 (최지훈 @ku6 주로, 김성준 @ku5 일부)
INSERT INTO COAPP_CRM_SALE (comp_idno, owne_idno, clie_idno, clie_name, cont_name, vist_date, orig_memo, aiex_summ, aiex_done, aiex_stat, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, @ku5, @k2c1, '(주)한국화재보험', '이정훈', '2024-09-10 10:00:00',
 '이정훈 팀장 첫 미팅. 전사 IT 인프라 고도화 프로젝트 RFP 설명. 서버 가상화, 네트워크 재구축 포함. 예산 규모 약 15억 예정.',
 '한국화재보험 IT 인프라 고도화 RFP 수령. 서버 가상화·네트워크 재구축 포함 예산 약 15억.',
 1, 'completed', 1, @ku5, '2024-09-10 11:00:00'),

(@ko2, @ku5, @k2c1, '(주)한국화재보험', '이정훈', '2024-10-15 14:00:00',
 '제안서 제출 후 미팅. 경쟁사 3곳과 비교 검토 중. 가격과 기술지원 역량이 핵심. 11월 초 최종 결정 예정.',
 '한국화재보험 제안서 경쟁 PT 완료. 가격·기술지원 역량이 핵심. 11월 초 결정.',
 1, 'completed', 1, @ku5, '2024-10-15 15:00:00'),

(@ko2, @ku5, @k2c1, '(주)한국화재보험', '이정훈', '2024-11-20 10:00:00',
 '우선협상대상자 선정 통보. 계약 조건 협의 진행. 납기 6개월, 유지보수 3년 포함 조건. 계약 금액 12억 5천.',
 '한국화재보험 우선협상대상자 선정. 납기 6개월, 유지보수 3년, 계약 12억 5천.',
 1, 'completed', 1, @ku5, '2024-11-20 11:00:00'),

(@ko2, @ku6, @k2c2, '세종병원그룹', '서현경', '2024-09-18 11:00:00',
 '서현경 팀장 미팅. 의료정보시스템(EMR) 연동 솔루션 도입 논의. 3개 병원 통합 관리 필요. 약 3억 규모 예상.',
 '세종병원그룹 EMR 연동 솔루션 도입 논의. 3개 병원 통합 3억 규모.',
 1, 'completed', 1, @ku6, '2024-09-18 12:00:00'),

(@ko2, @ku6, @k2c2, '세종병원그룹', '서현경', '2024-11-12 10:00:00',
 '2차 기술 제안. 커스터마이징 범위 확인. HL7 FHIR 표준 준수 요건 추가. 개발 기간 4개월 예상.',
 '세종병원 EMR 연동 기술 제안 2차. HL7 FHIR 표준 적용, 개발 4개월.',
 1, 'completed', 1, @ku6, '2024-11-12 11:00:00'),

(@ko2, @ku6, @k2c2, '세종병원그룹', '서현경', '2024-12-18 10:00:00',
 '계약 협의 완료. 1월 착수 예정. 총 2억 8천만원. 단계별 검수 조건.',
 '세종병원 EMR 연동 계약 완료. 2억 8천, 1월 착수.',
 1, 'completed', 1, @ku6, '2024-12-18 11:00:00'),

(@ko2, @ku6, @k2c3, '서울교통공사', '김도영', '2024-10-08 14:00:00',
 '전산운영팀장 김도영 씨 미팅. 연간 서버/네트워크 유지보수 계약 갱신 논의. 현행 유지 기준 연 8,500만원.',
 '서울교통공사 IT 유지보수 계약 갱신 논의. 연 8,500만원 기준.',
 1, 'completed', 1, @ku6, '2024-10-08 15:00:00'),

(@ko2, @ku6, @k2c3, '서울교통공사', '김도영', '2024-12-05 10:00:00',
 '갱신 계약 최종 합의. 5% 인상된 8,925만원으로 내년도 계약 체결.',
 '서울교통공사 IT 유지보수 계약 갱신 완료. 연 8,925만원.',
 1, 'completed', 1, @ku6, '2024-12-05 11:00:00'),

(@ko2, @ku6, @k2c4, '신한캐피탈(주)', '박준혁', '2025-01-14 10:00:00',
 '박준혁 차장 첫 미팅. 데이터센터 서버 증설 프로젝트 견적 요청. HP 서버 30대 포함 구성. 예산 5억 이내.',
 '신한캐피탈 데이터센터 서버 30대 증설. 예산 5억 이내 견적 요청.',
 1, 'completed', 1, @ku6, '2025-01-14 11:00:00'),

(@ko2, @ku6, @k2c4, '신한캐피탈(주)', '박준혁', '2025-02-20 14:00:00',
 '견적서 제출 및 기술 PT. 총 4억 7천. 추가 스토리지 옵션 협의 중.',
 '신한캐피탈 서버 증설 견적 4억 7천 제출. 스토리지 옵션 추가 협의.',
 1, 'completed', 1, @ku6, '2025-02-20 15:00:00'),

(@ko2, @ku6, @k2c5, '(주)한국전자부품', '강태욱', '2025-01-22 11:00:00',
 '스마트 모니터링 시스템 도입 초기 상담. 생산라인 IoT 센서 20개 + 중앙 모니터링 대시보드. 개발비 포함 약 1억 5천 예상.',
 '한국전자부품 스마트 모니터링 도입 상담. IoT 센서 20개 + 대시보드, 약 1억 5천.',
 1, 'completed', 1, @ku6, '2025-01-22 12:00:00'),

(@ko2, @ku6, @k2c5, '(주)한국전자부품', '강태욱', '2025-03-15 10:00:00',
 '2차 제안 발표. 데모 시연 호평. 4월 시범 도입 1개 라인 진행 후 전체 확대 결정.',
 '한국전자부품 스마트 모니터링 데모 호평. 4월 1개 라인 시범 도입 후 확대.',
 1, 'completed', 1, @ku6, '2025-03-15 11:00:00'),

(@ko2, @ku6, @k2c6, '인천국제공항공사', '조재원', '2025-02-18 10:00:00',
 '보안시스템 소프트웨어 유지보수 계약 논의. 기존 업체 교체 의향. 연 6,500만원 규모.',
 '인천공항 보안시스템 유지보수 계약 논의. 기존 업체 교체 의향, 연 6,500만원.',
 1, 'completed', 1, @ku6, '2025-02-18 11:00:00'),

(@ko2, @ku6, @k2c6, '인천국제공항공사', '조재원', '2025-04-10 14:00:00',
 '기술 제안 발표 완료. 보안 취약점 분석 리포트 제출. 5월 계약 목표.',
 '인천공항 보안시스템 기술 제안 완료. 5월 계약 목표.',
 1, 'completed', 1, @ku6, '2025-04-10 15:00:00'),

(@ko2, @ku5, @k2c1, '(주)한국화재보험', '이정훈', '2025-05-20 10:00:00',
 '1단계 인프라 구축 완료 보고. 서버 가상화 안정화. 2단계 네트워크 재구축 일정 협의. 8월 착수 목표.',
 '한국화재보험 1단계 인프라 구축 완료. 2단계 네트워크 8월 착수 협의.',
 1, 'completed', 1, @ku5, '2025-05-20 11:00:00'),

(@ko2, @ku6, @k2c2, '세종병원그룹', '서현경', '2025-06-12 11:00:00',
 '시스템 오픈 후 1개월 운영 리뷰. 소규모 버그 5건 수정. 전반적 만족도 높음. 추가 병원 2곳 확장 논의.',
 '세종병원 EMR 연동 운영 리뷰. 안정화. 추가 2개 병원 확장 논의.',
 1, 'completed', 1, @ku6, '2025-06-12 12:00:00'),

(@ko2, @ku6, @k2c5, '(주)한국전자부품', '강태욱', '2025-07-08 10:00:00',
 '시범 도입 3개월 결과 보고. 생산효율 12% 향상 확인. 전체 라인 확대 도입 승인. 추가 계약 1억 8천.',
 '한국전자부품 시범 도입 효과 12% 생산효율 향상. 전체 확대 계약 1억 8천.',
 1, 'completed', 1, @ku6, '2025-07-08 11:00:00'),

(@ko2, @ku6, @k2c3, '서울교통공사', '김도영', '2025-10-14 10:00:00',
 '내년도 계약 갱신 사전 협의. 추가 서버 5대 증설 포함 요청. 예산 1억 1천 수준.',
 '서울교통공사 내년도 계약 갱신 + 서버 5대 추가. 예산 약 1억 1천.',
 1, 'completed', 1, @ku6, '2025-10-14 11:00:00'),

(@ko2, @ku6, @k2c4, '신한캐피탈(주)', '박준혁', '2025-11-05 14:00:00',
 '추가 DR 서버 구성 논의. 재해복구 센터 인프라 재구축. 2억 5천 예산 배정됨.',
 '신한캐피탈 DR 서버 재구축 논의. 예산 2억 5천.',
 1, 'completed', 1, @ku6, '2025-11-05 15:00:00'),

(@ko2, @ku6, @k2c6, '인천국제공항공사', '조재원', '2026-01-20 10:00:00',
 '올해 유지보수 계약 1차 점검. 특이사항 없음. 상반기 중 시스템 업그레이드 일정 논의.',
 '인천공항 유지보수 1차 점검 완료. 이상 없음. 상반기 업그레이드 일정 논의.',
 1, 'completed', 1, @ku6, '2026-01-20 11:00:00'),

(@ko2, @ku5, @k2c1, '(주)한국화재보험', '이정훈', '2026-03-10 10:00:00',
 '전체 프로젝트 완료 보고. 인프라 고도화 마무리. 3년 유지보수 계약 개시. 추가 클라우드 전환 프로젝트 논의.',
 '한국화재보험 인프라 고도화 완료. 유지보수 개시. 클라우드 전환 후속 논의.',
 1, 'completed', 1, @ku5, '2026-03-10 11:00:00');

-- 수주 (정미라 @ku7)
INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, @ku7, @k2c1, '(주)한국화재보험', 'IT 인프라 고도화 1단계 (서버 가상화)', 480000000, 'confirmed', '2024-11-25', '2025-04-30', 1, @ku7, '2024-11-25 09:00:00');
SET @ko2_ord1 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, @ku7, @k2c2, '세종병원그룹', 'EMR 연동 솔루션 개발 및 구축', 280000000, 'confirmed', '2025-01-02', '2025-05-31', 1, @ku7, '2025-01-02 09:00:00');
SET @ko2_ord2 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, @ku7, @k2c3, '서울교통공사', '전산 인프라 유지보수 (2025년)', 89250000, 'confirmed', '2025-01-01', '2025-12-31', 1, @ku7, '2025-01-02 09:00:00');
SET @ko2_ord3 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, @ku7, @k2c4, '신한캐피탈(주)', '데이터센터 서버 증설', 470000000, 'confirmed', '2025-03-10', '2025-06-30', 1, @ku7, '2025-03-10 09:00:00');
SET @ko2_ord4 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, @ku7, @k2c6, '인천국제공항공사', '보안시스템 소프트웨어 유지보수 (2025)', 65000000, 'confirmed', '2025-05-01', '2026-04-30', 1, @ku7, '2025-05-01 09:00:00');
SET @ko2_ord5 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, @ku7, @k2c5, '(주)한국전자부품', '스마트 모니터링 시스템 전체 확대', 180000000, 'confirmed', '2025-07-15', '2025-11-30', 1, @ku7, '2025-07-15 09:00:00');
SET @ko2_ord6 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, @ku7, @k2c1, '(주)한국화재보험', 'IT 인프라 고도화 2단계 (네트워크)', 345000000, 'confirmed', '2025-08-01', '2025-12-31', 1, @ku7, '2025-08-01 09:00:00');
SET @ko2_ord7 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, @ku7, @k2c4, '신한캐피탈(주)', 'DR 서버 인프라 재구축', 250000000, 'negotiation', NULL, '2026-06-30', 1, @ku7, '2025-11-10 09:00:00');
SET @ko2_ord8 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, @ku7, @k2c3, '서울교통공사', '전산 인프라 유지보수 + 서버 증설 (2026)', 110000000, 'proposal', NULL, '2026-12-31', 1, @ku7, '2026-01-05 09:00:00');
SET @ko2_ord9 = LAST_INSERT_ID();

-- 납품
INSERT INTO COAPP_CRM_SHIPMENT (comp_idno, owne_idno, orde_idno, clie_idno, clie_name, ship_stat, ship_date, invc_date, paid_date, ship_pric, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, @ku7, @ko2_ord1, @k2c1, '(주)한국화재보험', 'paid', '2025-04-25', '2025-05-05', '2025-05-25', 480000000, 1, @ku7, '2025-04-25 09:00:00'),
(@ko2, @ku7, @ko2_ord2, @k2c2, '세종병원그룹', 'paid', '2025-05-28', '2025-06-05', '2025-06-25', 280000000, 1, @ku7, '2025-05-28 09:00:00'),
(@ko2, @ku7, @ko2_ord3, @k2c3, '서울교통공사', 'paid', '2025-06-30', '2025-07-08', '2025-07-28', 44625000, 1, @ku7, '2025-06-30 09:00:00'),
(@ko2, @ku7, @ko2_ord3, @k2c3, '서울교통공사', 'invoiced', '2025-12-30', '2026-01-08', NULL, 44625000, 1, @ku7, '2025-12-30 09:00:00'),
(@ko2, @ku7, @ko2_ord4, @k2c4, '신한캐피탈(주)', 'paid', '2025-06-28', '2025-07-05', '2025-07-25', 470000000, 1, @ku7, '2025-06-28 09:00:00'),
(@ko2, @ku7, @ko2_ord5, @k2c6, '인천국제공항공사', 'paid', '2025-05-05', '2025-05-12', '2025-06-01', 32500000, 1, @ku7, '2025-05-05 09:00:00'),
(@ko2, @ku7, @ko2_ord5, @k2c6, '인천국제공항공사', 'delivered', '2025-11-05', NULL, NULL, 32500000, 1, @ku7, '2025-11-05 09:00:00'),
(@ko2, @ku7, @ko2_ord6, @k2c5, '(주)한국전자부품', 'paid', '2025-11-28', '2025-12-05', '2025-12-25', 180000000, 1, @ku7, '2025-11-28 09:00:00'),
(@ko2, @ku7, @ko2_ord7, @k2c1, '(주)한국화재보험', 'invoiced', '2025-12-30', '2026-01-05', NULL, 345000000, 1, @ku7, '2025-12-30 09:00:00');

-- 일정 (최지훈 + 김성준)
INSERT INTO COAPP_CRM_SCHEDULE (comp_idno, owne_idno, clie_idno, clie_name, sche_name, sche_desc, sche_date, sche_stat, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, @ku5, @k2c1, '(주)한국화재보험', '우선협상대상자 선정 결과 확인', NULL, '2024-11-18 09:00:00', 'completed', 1, @ku5, '2024-11-10 09:00:00'),
(@ko2, @ku6, @k2c2, '세종병원그룹', 'EMR 연동 계약서 서명', NULL, '2024-12-20 10:00:00', 'completed', 1, @ku6, '2024-12-15 09:00:00'),
(@ko2, @ku6, @k2c3, '서울교통공사', '2025년 유지보수 계약 갱신 서명', NULL, '2024-12-20 14:00:00', 'completed', 1, @ku6, '2024-12-15 09:00:00'),
(@ko2, @ku6, @k2c4, '신한캐피탈(주)', '서버 증설 착수 킥오프', NULL, '2025-03-15 10:00:00', 'completed', 1, @ku6, '2025-03-10 09:00:00'),
(@ko2, @ku6, @k2c6, '인천국제공항공사', '보안시스템 계약 서명', NULL, '2025-04-28 14:00:00', 'completed', 1, @ku6, '2025-04-20 09:00:00'),
(@ko2, @ku5, @k2c1, '(주)한국화재보험', '1단계 완료 검수 미팅', NULL, '2025-05-20 10:00:00', 'completed', 1, @ku5, '2025-05-15 09:00:00'),
(@ko2, @ku6, @k2c5, '(주)한국전자부품', '전체 확대 계약 서명', NULL, '2025-07-15 10:00:00', 'completed', 1, @ku6, '2025-07-10 09:00:00'),
(@ko2, @ku6, @k2c2, '세종병원그룹', '추가 병원 확장 제안 발표', '2개 병원 추가 확장 제안', '2025-08-12 11:00:00', 'completed', 1, @ku6, '2025-08-05 09:00:00'),
(@ko2, @ku6, @k2c3, '서울교통공사', '하반기 유지보수 점검', NULL, '2025-09-10 14:00:00', 'completed', 1, @ku6, '2025-09-05 09:00:00'),
(@ko2, @ku5, @k2c1, '(주)한국화재보험', '2단계 중간 보고', NULL, '2025-10-20 10:00:00', 'completed', 1, @ku5, '2025-10-15 09:00:00'),
(@ko2, @ku6, @k2c4, '신한캐피탈(주)', 'DR 재구축 프로젝트 제안 발표', NULL, '2025-11-15 14:00:00', 'completed', 1, @ku6, '2025-11-10 09:00:00'),
(@ko2, @ku6, @k2c6, '인천국제공항공사', '보안시스템 상반기 업그레이드 협의', NULL, '2026-02-10 10:00:00', 'completed', 1, @ku6, '2026-02-05 09:00:00'),
(@ko2, @ku5, @k2c1, '(주)한국화재보험', '유지보수 계약 개시 + 클라우드 전환 논의', NULL, '2026-03-15 10:00:00', 'completed', 1, @ku5, '2026-03-10 09:00:00'),
(@ko2, @ku6, @k2c3, '서울교통공사', '2026년 계약 갱신 최종 협의', NULL, '2026-04-15 10:00:00', 'scheduled', 1, @ku6, '2026-04-01 09:00:00'),
(@ko2, @ku6, @k2c4, '신한캐피탈(주)', 'DR 재구축 계약 서명 목표', NULL, '2026-04-20 14:00:00', 'scheduled', 1, @ku6, '2026-04-01 09:00:00');

-- 지출 (정미라 @ku7)
INSERT INTO COAPP_CRM_EXPENSE (comp_idno, clie_idno, clie_name, expe_name, expe_date, expe_amnt, expe_type, paym_meth, recr_type, enab_yesn, crea_idno, crea_date) VALUES
(@ko2, @k2c7, '마이크로소프트 코리아', 'MS 365 라이선스 (연간)', '2025-01-15 00:00:00', 8400000, 'receipt', 'transfer', 'none', 1, @ku7, '2025-01-15 10:00:00'),
(@ko2, @k2c7, '마이크로소프트 코리아', 'Visual Studio Enterprise 라이선스', '2025-01-15 00:00:00', 3200000, 'receipt', 'transfer', 'none', 1, @ku7, '2025-01-15 10:00:00'),
(@ko2, @k2c8, '클라우드허브코리아', 'AWS 사용료 1월', '2025-01-31 00:00:00', 2150000, 'receipt', 'card', 'monthly', 1, @ku7, '2025-02-03 09:00:00'),
(@ko2, @k2c8, '클라우드허브코리아', 'AWS 사용료 2월', '2025-02-28 00:00:00', 2380000, 'receipt', 'card', 'monthly', 1, @ku7, '2025-03-03 09:00:00'),
(@ko2, @k2c8, '클라우드허브코리아', 'AWS 사용료 3월', '2025-03-31 00:00:00', 2290000, 'receipt', 'card', 'monthly', 1, @ku7, '2025-04-03 09:00:00'),
(@ko2, @k2c8, '클라우드허브코리아', 'AWS 사용료 4월', '2025-04-30 00:00:00', 2510000, 'receipt', 'card', 'monthly', 1, @ku7, '2025-05-05 09:00:00'),
(@ko2, @k2c8, '클라우드허브코리아', 'AWS 사용료 5월', '2025-05-31 00:00:00', 2680000, 'receipt', 'card', 'monthly', 1, @ku7, '2025-06-03 09:00:00'),
(@ko2, @k2c7, '마이크로소프트 코리아', 'MS 365 라이선스 (연간 갱신)', '2026-01-15 00:00:00', 9100000, 'receipt', 'transfer', 'none', 1, @ku7, '2026-01-15 10:00:00'),
(@ko2, @k2c8, '클라우드허브코리아', 'AWS 사용료 2월', '2026-02-28 00:00:00', 3100000, 'receipt', 'card', 'monthly', 1, @ku7, '2026-03-03 09:00:00'),
(@ko2, @k2c8, '클라우드허브코리아', 'AWS 사용료 3월', '2026-03-31 00:00:00', 3250000, 'receipt', 'card', 'monthly', 1, @ku7, '2026-04-03 09:00:00');


-- =================================================================
-- COMPANY 3: 더스페이스디자인 — 건설/인테리어
-- 사장(장현우): 영업 전담, 일정 관리
-- 경리(오가영): 수주·납품·지출 담당
-- =================================================================

INSERT INTO COAPP_CORE_COMPANY (comp_name, bizn_numb, need_appr, link_yesn, mail_yesn, crea_date)
VALUES ('더스페이스디자인', '1308092341', 0, 1, 0, '2024-10-01 09:00:00');
SET @ko3 = LAST_INSERT_ID();

INSERT INTO COAPP_CORE_USER (open_idno, user_name, mail_idno, pass_hash, logi_mthd, user_auth, crea_date)
VALUES ('local:ceo@space.co.kr',  '장현우', 'ceo@space.co.kr',  '$2b$10$I46TB4EhdCy.iw6JREGXLOsICv4cJem4e.TiYLSmgX4gLsz8rA.P6', 'email', 'user', '2024-10-01 09:00:00');
SET @ku8 = LAST_INSERT_ID();
INSERT INTO COAPP_CORE_USER (open_idno, user_name, mail_idno, pass_hash, logi_mthd, user_auth, crea_date)
VALUES ('local:acct@space.co.kr', '오가영', 'acct@space.co.kr', '$2b$10$I46TB4EhdCy.iw6JREGXLOsICv4cJem4e.TiYLSmgX4gLsz8rA.P6', 'email', 'user', '2024-10-01 09:10:00');
SET @ku9 = LAST_INSERT_ID();

INSERT INTO COAPP_CORE_COMPANY_USER (comp_idno, user_idno, comp_role, memb_stat, crea_idno) VALUES
(@ko3, @ku8, 'owner',  'active', @ku8),
(@ko3, @ku9, 'member', 'active', @ku8);

INSERT INTO COAPP_BILLING_SUBSCRIPTION (comp_idno, plan_idno, subs_stat, star_date, ends_date, crea_idno)
VALUES (@ko3, 4, 'active', '2024-10-01', '2027-12-31', @ku8);

-- 거래처
INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, '(주)GS리테일 시설팀', '1078023451', 'sales', '유통/리테일', '서울시 강남구 논현로 508 GS타워', '편의점·슈퍼 리모델링 프로젝트 다수', 1, @ku8, '2024-10-05 09:00:00');
SET @k3c1 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, '제이앤파트너스(주)', '2108012341', 'sales', '오피스', '서울시 강남구 역삼동 813-3 J빌딩', '오피스 인테리어 전문 발주처', 1, @ku8, '2024-10-15 10:00:00');
SET @k3c2 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, '모아건설(주)', '1148034512', 'sales', '건설', '경기도 성남시 분당구 황새울로 336', '신규 오피스텔 공용부 인테리어', 1, @ku8, '2024-11-20 09:00:00');
SET @k3c3 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, '스타벅스 코리아 시설', '2018023451', 'sales', '외식/카페', '서울시 중구 소공로 63 웨스틴조선 B1', '카페 인테리어 리뉴얼', 1, @ku8, '2025-01-12 10:00:00');
SET @k3c4 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, '힐링스파앤리조트', '1208045231', 'sales', '숙박/레저', '강원도 춘천시 동면 순환대로 902', '로비·객실 대규모 리뉴얼', 1, @ku8, '2025-03-05 09:00:00');
SET @k3c5 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, '(주)한국인테리어자재', '1148123041', 'purchase', '건자재', '경기도 고양시 덕양구 화중로 130 건자재상가 301', '주요 마감재/목재 공급사', 1, @ku9, '2024-10-03 09:00:00');
SET @k3c6 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, '신한조명(주)', '1308134512', 'purchase', '조명', '서울시 성동구 성수이로 75 신한조명', '조명 기기 공급 및 설치 자재', 1, @ku9, '2024-10-10 09:00:00');
SET @k3c7 = LAST_INSERT_ID();

-- 담당자
INSERT INTO COAPP_CRM_CLIENT_CONT (comp_idno, clie_idno, cont_name, cont_role, cont_tele, cont_mail, main_yesn, enab_yesn, crea_idno) VALUES
(@ko3, @k3c1, '이민재', '시설개발팀장', '010-3312-7782', 'mj.lee@gsretail.com', 1, 1, @ku8),
(@ko3, @k3c2, '홍성원', '대표', '010-9912-3341', 'sw.hong@jnpartners.co.kr', 1, 1, @ku8),
(@ko3, @k3c3, '서태준', '분양팀장', '010-5523-8812', 'tj.seo@moacon.co.kr', 1, 1, @ku8),
(@ko3, @k3c4, '김효진', '시설관리팀', '010-7734-5512', 'hj.kim@starbucks.co.kr', 1, 1, @ku8),
(@ko3, @k3c5, '박민석', '총지배인', '010-2231-4456', 'ms.park@healingspa.co.kr', 1, 1, @ku8),
(@ko3, @k3c6, '강진수', '영업팀장', '010-8845-3312', 'js.kang@hkinterior.co.kr', 1, 1, @ku9),
(@ko3, @k3c7, '윤형석', '대표', '010-4456-9901', NULL, 1, 1, @ku9);

-- 영업일지 (장현우 @ku8)
INSERT INTO COAPP_CRM_SALE (comp_idno, owne_idno, clie_idno, clie_name, cont_name, vist_date, orig_memo, aiex_summ, aiex_done, aiex_stat, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, @ku8, @k3c1, '(주)GS리테일 시설팀', '이민재', '2024-10-10 10:00:00',
 '이민재 팀장 미팅. 강남 지역 편의점 5개소 동시 리모델링. 매장당 2,200만원 수준. 12월 착수 목표.',
 'GS리테일 강남 편의점 5개소 리모델링. 매장당 2,200만원, 12월 착수.',
 1, 'completed', 1, @ku8, '2024-10-10 11:00:00'),

(@ko3, @ku8, @k3c1, '(주)GS리테일 시설팀', '이민재', '2024-11-15 14:00:00',
 '편의점 리모델링 계약 확정. 총 1억 1천. 12월 5일 첫 매장 착수.',
 'GS리테일 편의점 리모델링 계약 확정. 총 1억 1천.',
 1, 'completed', 1, @ku8, '2024-11-15 15:00:00'),

(@ko3, @ku8, @k3c2, '제이앤파트너스(주)', '홍성원', '2024-10-22 11:00:00',
 '홍성원 대표 미팅. 역삼동 신규 오피스 3개 층 인테리어. 총 4억 5천 규모. 1층 로비, 2-3층 사무공간.',
 'J앤파트너스 신규 오피스 3개층 인테리어. 총 4억 5천.',
 1, 'completed', 1, @ku8, '2024-10-22 12:00:00'),

(@ko3, @ku8, @k3c2, '제이앤파트너스(주)', '홍성원', '2024-12-03 10:00:00',
 '포트폴리오 PT 발표. 유사 사례 공유. 계약 진행 의사 확인. 내주 최종 계약 협의 예정.',
 'J앤파트너스 PT 완료. 계약 진행 의사 확인. 다음 주 최종 협의.',
 1, 'completed', 1, @ku8, '2024-12-03 11:00:00'),

(@ko3, @ku8, @k3c3, '모아건설(주)', '서태준', '2024-11-08 10:00:00',
 '서태준 팀장 미팅. 분당 오피스텔 로비·복도·엘리베이터 공용부 인테리어. 총 3억 수준. 내년 2월 입주 일정.',
 '모아건설 오피스텔 공용부 인테리어 3억. 2월 입주 일정.',
 1, 'completed', 1, @ku8, '2024-11-08 11:00:00'),

(@ko3, @ku8, @k3c3, '모아건설(주)', '서태준', '2024-12-18 10:00:00',
 '계약 완료. 착수 1월 초. 총 2억 8천으로 최종 합의.',
 '모아건설 공용부 인테리어 계약 완료. 총 2억 8천, 1월 착수.',
 1, 'completed', 1, @ku8, '2024-12-18 11:00:00'),

(@ko3, @ku8, @k3c4, '스타벅스 코리아 시설', '김효진', '2025-01-20 14:00:00',
 '김효진 씨 미팅. 서울 내 리뉴얼 대상 카페 8곳. 매장당 1,800-2,500만원. 분기별 순차 진행.',
 '스타벅스 서울 8개점 리뉴얼. 매장당 1,800-2,500만원, 분기별 진행.',
 1, 'completed', 1, @ku8, '2025-01-20 15:00:00'),

(@ko3, @ku8, @k3c4, '스타벅스 코리아 시설', '김효진', '2025-02-25 10:00:00',
 '1분기 2개점 계약 확정. 총 4,500만원. 3월 착수.',
 '스타벅스 1분기 2개점 인테리어 계약. 4,500만원, 3월 착수.',
 1, 'completed', 1, @ku8, '2025-02-25 11:00:00'),

(@ko3, @ku8, @k3c1, '(주)GS리테일 시설팀', '이민재', '2025-03-10 10:00:00',
 '리모델링 완료 5개소 품질 검수 및 추가 발주 논의. 올해 수도권 10개소 추가 예정.',
 'GS리테일 1차 완료 검수. 2025년 10개소 추가 발주 예정.',
 1, 'completed', 1, @ku8, '2025-03-10 11:00:00'),

(@ko3, @ku8, @k3c5, '힐링스파앤리조트', '박민석', '2025-03-12 11:00:00',
 '총지배인 박민석 씨 첫 미팅. 로비·레스토랑·객실 80개 리뉴얼 대형 프로젝트. 총 15억 예산. 5월 착수 목표.',
 '힐링스파 대형 리뉴얼 프로젝트. 로비·레스토랑·객실 80개, 15억, 5월 착수.',
 1, 'completed', 1, @ku8, '2025-03-12 12:00:00'),

(@ko3, @ku8, @k3c5, '힐링스파앤리조트', '박민석', '2025-04-15 10:00:00',
 '힐링스파 2차 미팅. 컨셉 디자인 발표 호평. 계약 조건 협의. 총 12억 5천으로 조율.',
 '힐링스파 컨셉 발표 호평. 계약 12억 5천 협의 중.',
 1, 'completed', 1, @ku8, '2025-04-15 11:00:00'),

(@ko3, @ku8, @k3c4, '스타벅스 코리아 시설', '김효진', '2025-05-20 14:00:00',
 '2분기 3개점 추가 계약. 총 7,200만원.',
 '스타벅스 2분기 3개점 계약. 7,200만원.',
 1, 'completed', 1, @ku8, '2025-05-20 15:00:00'),

(@ko3, @ku8, @k3c5, '힐링스파앤리조트', '박민석', '2025-08-05 10:00:00',
 '힐링스파 1단계(로비·레스토랑) 완료 검수. 만족. 2단계 객실 공사 착수 승인.',
 '힐링스파 1단계 완료 검수. 2단계 객실 공사 착수.',
 1, 'completed', 1, @ku8, '2025-08-05 11:00:00'),

(@ko3, @ku8, @k3c1, '(주)GS리테일 시설팀', '이민재', '2025-09-12 10:00:00',
 '하반기 추가 10개소 발주 협의. 단가 소폭 인상 요청. 기존 단가+2%로 합의.',
 'GS리테일 하반기 10개소 추가. 단가 2% 인상 합의.',
 1, 'completed', 1, @ku8, '2025-09-12 11:00:00'),

(@ko3, @ku8, @k3c5, '힐링스파앤리조트', '박민석', '2025-12-10 10:00:00',
 '힐링스파 전체 완공. 최종 검수 완료. 내년 봄 리조트 2호점 인테리어 논의 시작.',
 '힐링스파 전체 완공. 2호점 인테리어 논의 시작.',
 1, 'completed', 1, @ku8, '2025-12-10 11:00:00'),

(@ko3, @ku8, @k3c4, '스타벅스 코리아 시설', '김효진', '2026-01-15 14:00:00',
 '2026년 분기 계획 수신. 1분기 2개점, 총 4,800만원 예정.',
 '스타벅스 2026년 1분기 2개점 계획. 4,800만원.',
 1, 'completed', 1, @ku8, '2026-01-15 15:00:00'),

(@ko3, @ku8, @k3c1, '(주)GS리테일 시설팀', '이민재', '2026-03-20 10:00:00',
 '1분기 5개소 착수 확인. 추가 예산 배정 논의. 연간 20개소 목표.',
 'GS리테일 1분기 5개소 착수. 연간 20개소 목표 논의.',
 0, 'pending', 1, @ku8, '2026-03-20 11:00:00');

-- 수주 (오가영 @ku9)
INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, @ku9, @k3c1, '(주)GS리테일 시설팀', '편의점 5개소 리모델링', 110000000, 'confirmed', '2024-11-18', '2025-01-31', 1, @ku9, '2024-11-18 09:00:00');
SET @ko3_ord1 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, @ku9, @k3c2, '제이앤파트너스(주)', '역삼동 오피스 3개층 인테리어', 430000000, 'confirmed', '2024-12-10', '2025-04-30', 1, @ku9, '2024-12-10 09:00:00');
SET @ko3_ord2 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, @ku9, @k3c3, '모아건설(주)', '오피스텔 공용부 인테리어', 280000000, 'confirmed', '2024-12-20', '2025-02-15', 1, @ku9, '2024-12-20 09:00:00');
SET @ko3_ord3 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, @ku9, @k3c4, '스타벅스 코리아 시설', '카페 리뉴얼 1분기 2개점', 45000000, 'confirmed', '2025-02-28', '2025-04-30', 1, @ku9, '2025-02-28 09:00:00');
SET @ko3_ord4 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, @ku9, @k3c5, '힐링스파앤리조트', '리조트 로비·레스토랑·객실 대규모 리뉴얼', 1250000000, 'confirmed', '2025-04-25', '2025-12-31', 1, @ku9, '2025-04-25 09:00:00');
SET @ko3_ord5 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, @ku9, @k3c4, '스타벅스 코리아 시설', '카페 리뉴얼 2분기 3개점', 72000000, 'confirmed', '2025-05-20', '2025-07-31', 1, @ku9, '2025-05-20 09:00:00');
SET @ko3_ord6 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, @ku9, @k3c1, '(주)GS리테일 시설팀', '편의점 하반기 10개소', 242000000, 'confirmed', '2025-09-20', '2026-02-28', 1, @ku9, '2025-09-20 09:00:00');
SET @ko3_ord7 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, @ku9, @k3c4, '스타벅스 코리아 시설', '카페 리뉴얼 2026 1분기 2개점', 48000000, 'proposal', NULL, '2026-04-30', 1, @ku9, '2026-01-20 09:00:00');
SET @ko3_ord8 = LAST_INSERT_ID();

-- 납품
INSERT INTO COAPP_CRM_SHIPMENT (comp_idno, owne_idno, orde_idno, clie_idno, clie_name, ship_stat, ship_date, invc_date, paid_date, ship_pric, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, @ku9, @ko3_ord1, @k3c1, '(주)GS리테일 시설팀', 'paid', '2025-01-28', '2025-02-05', '2025-02-20', 110000000, 1, @ku9, '2025-01-28 09:00:00'),
(@ko3, @ku9, @ko3_ord2, @k3c2, '제이앤파트너스(주)', 'paid', '2025-04-25', '2025-05-05', '2025-05-25', 430000000, 1, @ku9, '2025-04-25 09:00:00'),
(@ko3, @ku9, @ko3_ord3, @k3c3, '모아건설(주)', 'paid', '2025-02-12', '2025-02-20', '2025-03-10', 280000000, 1, @ku9, '2025-02-12 09:00:00'),
(@ko3, @ku9, @ko3_ord4, @k3c4, '스타벅스 코리아 시설', 'paid', '2025-04-28', '2025-05-05', '2025-05-25', 45000000, 1, @ku9, '2025-04-28 09:00:00'),
(@ko3, @ku9, @ko3_ord5, @k3c5, '힐링스파앤리조트', 'paid', '2025-08-01', '2025-08-10', '2025-08-30', 600000000, 1, @ku9, '2025-08-01 09:00:00'),
(@ko3, @ku9, @ko3_ord5, @k3c5, '힐링스파앤리조트', 'paid', '2025-12-08', '2025-12-15', '2026-01-10', 650000000, 1, @ku9, '2025-12-08 09:00:00'),
(@ko3, @ku9, @ko3_ord6, @k3c4, '스타벅스 코리아 시설', 'paid', '2025-07-28', '2025-08-05', '2025-08-25', 72000000, 1, @ku9, '2025-07-28 09:00:00'),
(@ko3, @ku9, @ko3_ord7, @k3c1, '(주)GS리테일 시설팀', 'invoiced', '2026-02-25', '2026-03-05', NULL, 242000000, 1, @ku9, '2026-02-25 09:00:00');

-- 일정 (장현우 @ku8)
INSERT INTO COAPP_CRM_SCHEDULE (comp_idno, owne_idno, clie_idno, clie_name, sche_name, sche_desc, sche_date, sche_stat, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, @ku8, @k3c2, '제이앤파트너스(주)', '오피스 인테리어 계약 서명', NULL, '2024-12-10 10:00:00', 'completed', 1, @ku8, '2024-12-05 09:00:00'),
(@ko3, @ku8, @k3c3, '모아건설(주)', '오피스텔 착수 킥오프', NULL, '2025-01-06 10:00:00', 'completed', 1, @ku8, '2024-12-28 09:00:00'),
(@ko3, @ku8, @k3c4, '스타벅스 코리아 시설', '1분기 현장 착수 확인', NULL, '2025-03-05 14:00:00', 'completed', 1, @ku8, '2025-03-01 09:00:00'),
(@ko3, @ku8, @k3c5, '힐링스파앤리조트', '리조트 현장 실사', '컨셉 기획 전 현장 확인', '2025-03-18 10:00:00', 'completed', 1, @ku8, '2025-03-15 09:00:00'),
(@ko3, @ku8, @k3c5, '힐링스파앤리조트', '리조트 컨셉 PT 발표', NULL, '2025-04-15 10:00:00', 'completed', 1, @ku8, '2025-04-10 09:00:00'),
(@ko3, @ku8, @k3c5, '힐링스파앤리조트', '계약 서명', NULL, '2025-04-25 14:00:00', 'completed', 1, @ku8, '2025-04-20 09:00:00'),
(@ko3, @ku8, @k3c4, '스타벅스 코리아 시설', '2분기 착수 현장 점검', NULL, '2025-06-02 10:00:00', 'completed', 1, @ku8, '2025-05-28 09:00:00'),
(@ko3, @ku8, @k3c5, '힐링스파앤리조트', '1단계 완료 검수', NULL, '2025-08-05 10:00:00', 'completed', 1, @ku8, '2025-07-30 09:00:00'),
(@ko3, @ku8, @k3c1, '(주)GS리테일 시설팀', '하반기 추가 발주 협의', NULL, '2025-09-12 10:00:00', 'completed', 1, @ku8, '2025-09-08 09:00:00'),
(@ko3, @ku8, @k3c5, '힐링스파앤리조트', '전체 완공 최종 검수', NULL, '2025-12-10 10:00:00', 'completed', 1, @ku8, '2025-12-05 09:00:00'),
(@ko3, @ku8, @k3c4, '스타벅스 코리아 시설', '2026년 계획 수신 미팅', NULL, '2026-01-15 14:00:00', 'completed', 1, @ku8, '2026-01-12 09:00:00'),
(@ko3, @ku8, @k3c1, '(주)GS리테일 시설팀', '1분기 5개소 착수 확인', NULL, '2026-03-25 10:00:00', 'completed', 1, @ku8, '2026-03-20 09:00:00'),
(@ko3, @ku8, @k3c4, '스타벅스 코리아 시설', '1분기 계약 최종 서명', NULL, '2026-04-10 14:00:00', 'scheduled', 1, @ku8, '2026-04-01 09:00:00'),
(@ko3, @ku8, @k3c5, '힐링스파앤리조트', '2호점 기획 미팅', '춘천 2호점 오픈 논의', '2026-04-20 10:00:00', 'scheduled', 1, @ku8, '2026-04-05 09:00:00');

-- 지출 (오가영 @ku9)
INSERT INTO COAPP_CRM_EXPENSE (comp_idno, clie_idno, clie_name, expe_name, expe_date, expe_amnt, expe_type, paym_meth, recr_type, enab_yesn, crea_idno, crea_date) VALUES
(@ko3, @k3c6, '(주)한국인테리어자재', '편의점 리모델링 마감재', '2024-12-05 00:00:00', 18500000, 'receipt', 'transfer', 'none', 1, @ku9, '2024-12-05 10:00:00'),
(@ko3, @k3c7, '신한조명(주)', '편의점 조명기구', '2024-12-10 00:00:00', 6800000, 'receipt', 'transfer', 'none', 1, @ku9, '2024-12-10 10:00:00'),
(@ko3, @k3c6, '(주)한국인테리어자재', '오피스 마감재·목재류', '2025-01-08 00:00:00', 52000000, 'receipt', 'transfer', 'none', 1, @ku9, '2025-01-08 10:00:00'),
(@ko3, @k3c7, '신한조명(주)', '오피스 조명 납품', '2025-01-15 00:00:00', 14800000, 'receipt', 'transfer', 'none', 1, @ku9, '2025-01-15 10:00:00'),
(@ko3, @k3c6, '(주)한국인테리어자재', '카페 리뉴얼 자재 (1분기)', '2025-03-08 00:00:00', 9200000, 'receipt', 'transfer', 'none', 1, @ku9, '2025-03-08 10:00:00'),
(@ko3, @k3c7, '신한조명(주)', '카페 조명 (1분기)', '2025-03-10 00:00:00', 5500000, 'receipt', 'card', 'none', 1, @ku9, '2025-03-10 10:00:00'),
(@ko3, @k3c6, '(주)한국인테리어자재', '리조트 대규모 자재 1차', '2025-05-10 00:00:00', 145000000, 'receipt', 'transfer', 'none', 1, @ku9, '2025-05-10 10:00:00'),
(@ko3, @k3c7, '신한조명(주)', '리조트 조명 전체', '2025-05-20 00:00:00', 38000000, 'receipt', 'transfer', 'none', 1, @ku9, '2025-05-20 10:00:00'),
(@ko3, @k3c6, '(주)한국인테리어자재', '카페 리뉴얼 자재 (2분기)', '2025-06-05 00:00:00', 14800000, 'receipt', 'transfer', 'none', 1, @ku9, '2025-06-05 10:00:00'),
(@ko3, @k3c6, '(주)한국인테리어자재', 'GS편의점 하반기 자재', '2025-10-05 00:00:00', 38500000, 'receipt', 'transfer', 'none', 1, @ku9, '2025-10-05 10:00:00'),
(@ko3, @k3c7, '신한조명(주)', 'GS편의점 하반기 조명', '2025-10-10 00:00:00', 12200000, 'receipt', 'card', 'none', 1, @ku9, '2025-10-10 10:00:00');


-- =================================================================
-- COMPANY 4: 청원식자재유통(주) — 식품/소모성 유통
-- 사장(신동철) 혼자 모든 업무 담당
-- =================================================================

INSERT INTO COAPP_CORE_COMPANY (comp_name, bizn_numb, need_appr, link_yesn, mail_yesn, crea_date)
VALUES ('청원식자재유통(주)', '1158047823', 0, 1, 0, '2024-10-15 09:00:00');
SET @ko4 = LAST_INSERT_ID();

INSERT INTO COAPP_CORE_USER (open_idno, user_name, mail_idno, pass_hash, logi_mthd, user_auth, crea_date)
VALUES ('local:ceo@food.co.kr', '신동철', 'ceo@food.co.kr', '$2b$10$I46TB4EhdCy.iw6JREGXLOsICv4cJem4e.TiYLSmgX4gLsz8rA.P6', 'email', 'user', '2024-10-15 09:00:00');
SET @ku10 = LAST_INSERT_ID();

INSERT INTO COAPP_CORE_COMPANY_USER (comp_idno, user_idno, comp_role, memb_stat, crea_idno) VALUES
(@ko4, @ku10, 'owner', 'active', @ku10);

INSERT INTO COAPP_BILLING_SUBSCRIPTION (comp_idno, plan_idno, subs_stat, star_date, ends_date, crea_idno)
VALUES (@ko4, 4, 'active', '2024-10-15', '2027-12-31', @ku10);

-- 거래처
INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko4, '(주)대성급식', '1088023451', 'sales', '단체급식', '서울시 강서구 마곡중앙로 161', '학교·기업 급식 식자재 정기 납품', 1, @ku10, '2024-10-18 09:00:00');
SET @k4c1 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko4, '행복한학교식당', '1208034512', 'sales', '학교/교육', '경기도 용인시 기흥구 동백중앙로 191', '학교 급식 전용 식자재 납품처', 1, @ku10, '2024-10-25 10:00:00');
SET @k4c2 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko4, '편한세상카페(주)', '1068045231', 'sales', '카페/음식점', '서울시 마포구 홍익로 25', '카페 소모성 식자재. 주 2회 납품', 1, @ku10, '2024-11-05 09:00:00');
SET @k4c3 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko4, '힘찬마트(주)', '2088034512', 'sales', '유통/마트', '경기도 파주시 문산읍 마장로 12', '소형 마트 신선식품 납품', 1, @ku10, '2024-12-10 09:00:00');
SET @k4c4 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko4, '(주)한국농수산물', '1108045231', 'purchase', '농수산물', '경기도 이천시 마장면 농공단지로 55', '채소·과일 주요 공급사', 1, @ku10, '2024-10-16 09:00:00');
SET @k4c5 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko4, '신선축산(주)', '1248034512', 'purchase', '축산물', '경기도 안성시 공도읍 만정리 축산농공', '육류·가공육 공급', 1, @ku10, '2024-10-16 09:00:00');
SET @k4c6 = LAST_INSERT_ID();

-- 담당자
INSERT INTO COAPP_CRM_CLIENT_CONT (comp_idno, clie_idno, cont_name, cont_role, cont_tele, cont_mail, main_yesn, enab_yesn, crea_idno) VALUES
(@ko4, @k4c1, '최영철', '구매팀장', '010-3312-8823', 'yc.choi@daesung-fs.co.kr', 1, 1, @ku10),
(@ko4, @k4c2, '이수민', '영양교사', '010-5534-2231', 'sm.lee@happyschool.co.kr', 1, 1, @ku10),
(@ko4, @k4c3, '강현준', '대표', '010-7782-5512', 'hj.kang@pycafe.co.kr', 1, 1, @ku10),
(@ko4, @k4c4, '박성훈', '구매담당', '010-9901-3312', 'sh.park@himchanmart.co.kr', 1, 1, @ku10),
(@ko4, @k4c5, '정대호', '영업팀장', '010-4456-7712', 'dh.jung@hkagri.co.kr', 1, 1, @ku10),
(@ko4, @k4c6, '오성진', '영업담당', '010-2231-4490', NULL, 1, 1, @ku10);

-- 영업일지 + 수주 + 납품 + 일정 + 지출 (신동철 혼자)
INSERT INTO COAPP_CRM_SALE (comp_idno, owne_idno, clie_idno, clie_name, cont_name, vist_date, orig_memo, aiex_summ, aiex_done, aiex_stat, enab_yesn, crea_idno, crea_date) VALUES
(@ko4, @ku10, @k4c1, '(주)대성급식', '최영철', '2024-10-22 10:00:00',
 '최영철 팀장 미팅. 11월부터 신선채소 정기 납품 시작. 주 3회, 회당 약 180만원.',
 '대성급식 신선채소 정기 납품 계약. 주 3회, 회당 180만원.',
 1, 'completed', 1, @ku10, '2024-10-22 11:00:00'),

(@ko4, @ku10, @k4c2, '행복한학교식당', '이수민', '2024-11-01 11:00:00',
 '이수민 영양교사 미팅. 내년 3월 학기 시작부터 학교 급식 식자재 납품. 월 약 850만원.',
 '행복한학교식당 3월부터 급식 식자재 납품. 월 850만원.',
 1, 'completed', 1, @ku10, '2024-11-01 12:00:00'),

(@ko4, @ku10, @k4c3, '편한세상카페(주)', '강현준', '2024-11-15 14:00:00',
 '강현준 대표 미팅. 매주 월·목 커피원두·디저트재료 납품. 주 약 45만원.',
 '편한세상카페 커피원두·디저트재료 주 2회 납품. 주 45만원.',
 1, 'completed', 1, @ku10, '2024-11-15 15:00:00'),

(@ko4, @ku10, @k4c1, '(주)대성급식', '최영철', '2025-01-08 10:00:00',
 '1분기 메뉴 변경 사항 공유. 신규 품목 3종 추가. 단가 협의 완료.',
 '대성급식 1분기 신규 품목 3종 추가 협의 완료.',
 1, 'completed', 1, @ku10, '2025-01-08 11:00:00'),

(@ko4, @ku10, @k4c4, '힘찬마트(주)', '박성훈', '2025-02-10 10:00:00',
 '박성훈 씨 미팅. 신선 과일·채소 주 2회 납품 요청. 월 약 320만원 규모.',
 '힘찬마트 신선 과일·채소 납품 계약. 월 320만원.',
 1, 'completed', 1, @ku10, '2025-02-10 11:00:00'),

(@ko4, @ku10, @k4c2, '행복한학교식당', '이수민', '2025-03-05 11:00:00',
 '학기 시작 납품 개시 확인. 수량 및 메뉴 조율 완료. 큰 이슈 없음.',
 '행복한학교식당 학기 납품 개시. 수량·메뉴 조율 완료.',
 1, 'completed', 1, @ku10, '2025-03-05 12:00:00'),

(@ko4, @ku10, @k4c1, '(주)대성급식', '최영철', '2025-05-20 10:00:00',
 '여름철 신선도 관리 강화 논의. 아이스팩 추가 비용 단가 반영 합의.',
 '대성급식 여름철 신선도 관리 아이스팩 단가 조정 합의.',
 1, 'completed', 1, @ku10, '2025-05-20 11:00:00'),

(@ko4, @ku10, @k4c3, '편한세상카페(주)', '강현준', '2025-07-08 14:00:00',
 '카페 여름 메뉴 재료 추가 발주. 망고·복숭아 퓨레 월 30만원 추가.',
 '편한세상카페 여름 메뉴 재료 추가. 월 30만원 증가.',
 1, 'completed', 1, @ku10, '2025-07-08 15:00:00'),

(@ko4, @ku10, @k4c4, '힘찬마트(주)', '박성훈', '2025-09-15 10:00:00',
 '추석 명절 특수 과일 박스 추가 발주. 사과·배·포도 세트 200박스.',
 '힘찬마트 추석 과일 세트 200박스 추가 발주.',
 1, 'completed', 1, @ku10, '2025-09-15 11:00:00'),

(@ko4, @ku10, @k4c2, '행복한학교식당', '이수민', '2025-11-10 11:00:00',
 '2학기 급식 운영 점검. 잔반률 감소 위해 메뉴 다양화 요청. 12월 새 메뉴 도입 예정.',
 '행복한학교식당 잔반 감소 위해 12월 메뉴 다양화. 신규 품목 논의.',
 1, 'completed', 1, @ku10, '2025-11-10 12:00:00'),

(@ko4, @ku10, @k4c1, '(주)대성급식', '최영철', '2026-01-10 10:00:00',
 '내년 공급 계약 갱신. 단가 2.5% 인상 합의. 신규 거점 1개소 추가.',
 '대성급식 연간 계약 갱신. 단가 2.5% 인상, 거점 1개소 추가.',
 1, 'completed', 1, @ku10, '2026-01-10 11:00:00'),

(@ko4, @ku10, @k4c3, '편한세상카페(주)', '강현준', '2026-03-15 14:00:00',
 '봄 신메뉴 재료 협의. 딸기·체리 관련 납품 추가. 4월부터 적용.',
 '편한세상카페 봄 신메뉴 딸기·체리 재료 4월부터 추가 납품.',
 0, 'pending', 1, @ku10, '2026-03-15 15:00:00');

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko4, @ku10, @k4c1, '(주)대성급식', '신선채소 정기 납품 (2024 4분기)', 21600000, 'confirmed', '2024-10-25', '2024-12-31', 1, @ku10, '2024-10-25 09:00:00');
SET @ko4_ord1 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko4, @ku10, @k4c2, '행복한학교식당', '학교급식 식자재 정기 납품 (2025 1학기)', 8500000, 'confirmed', '2025-02-20', '2025-06-30', 1, @ku10, '2025-02-20 09:00:00');
SET @ko4_ord2 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko4, @ku10, @k4c3, '편한세상카페(주)', '카페 식자재 정기 납품 (월)', 1800000, 'confirmed', '2024-11-18', '2025-11-17', 1, @ku10, '2024-11-18 09:00:00');
SET @ko4_ord3 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko4, @ku10, @k4c4, '힘찬마트(주)', '신선 과일·채소 정기 납품 (월)', 3200000, 'confirmed', '2025-02-15', '2026-02-14', 1, @ku10, '2025-02-15 09:00:00');
SET @ko4_ord4 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko4, @ku10, @k4c1, '(주)대성급식', '신선채소 정기 납품 (2025)', 88200000, 'confirmed', '2025-01-02', '2025-12-31', 1, @ku10, '2025-01-02 09:00:00');
SET @ko4_ord5 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko4, @ku10, @k4c4, '힘찬마트(주)', '추석 과일 세트 200박스', 4800000, 'confirmed', '2025-09-15', '2025-09-25', 1, @ku10, '2025-09-15 09:00:00');
SET @ko4_ord6 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_SHIPMENT (comp_idno, owne_idno, orde_idno, clie_idno, clie_name, ship_stat, ship_date, invc_date, paid_date, ship_pric, enab_yesn, crea_idno, crea_date) VALUES
(@ko4, @ku10, @ko4_ord1, @k4c1, '(주)대성급식', 'paid', '2024-12-31', '2025-01-05', '2025-01-20', 21600000, 1, @ku10, '2024-12-31 09:00:00'),
(@ko4, @ku10, @ko4_ord2, @k4c2, '행복한학교식당', 'paid', '2025-06-30', '2025-07-05', '2025-07-25', 8500000, 1, @ku10, '2025-06-30 09:00:00'),
(@ko4, @ku10, @ko4_ord5, @k4c1, '(주)대성급식', 'paid', '2025-06-30', '2025-07-05', '2025-07-25', 44100000, 1, @ku10, '2025-06-30 09:00:00'),
(@ko4, @ku10, @ko4_ord5, @k4c1, '(주)대성급식', 'invoiced', '2025-12-31', '2026-01-05', NULL, 44100000, 1, @ku10, '2025-12-31 09:00:00'),
(@ko4, @ku10, @ko4_ord6, @k4c4, '힘찬마트(주)', 'paid', '2025-09-24', '2025-09-25', '2025-10-05', 4800000, 1, @ku10, '2025-09-24 09:00:00');

INSERT INTO COAPP_CRM_SCHEDULE (comp_idno, owne_idno, clie_idno, clie_name, sche_name, sche_desc, sche_date, sche_stat, enab_yesn, crea_idno, crea_date) VALUES
(@ko4, @ku10, @k4c1, '(주)대성급식', '11월 납품 개시 확인', NULL, '2024-11-04 09:00:00', 'completed', 1, @ku10, '2024-10-30 09:00:00'),
(@ko4, @ku10, @k4c2, '행복한학교식당', '3월 학기 납품 개시', NULL, '2025-03-03 08:00:00', 'completed', 1, @ku10, '2025-02-25 09:00:00'),
(@ko4, @ku10, @k4c4, '힘찬마트(주)', '첫 납품 확인', NULL, '2025-02-17 09:00:00', 'completed', 1, @ku10, '2025-02-15 09:00:00'),
(@ko4, @ku10, @k4c1, '(주)대성급식', '계약 갱신 미팅', NULL, '2026-01-10 10:00:00', 'completed', 1, @ku10, '2026-01-05 09:00:00'),
(@ko4, @ku10, @k4c2, '행복한학교식당', '2025 2학기 계약 연장 확인', NULL, '2025-08-25 11:00:00', 'completed', 1, @ku10, '2025-08-20 09:00:00'),
(@ko4, @ku10, @k4c3, '편한세상카페(주)', '봄 신메뉴 재료 추가 납품 시작', NULL, '2026-04-07 09:00:00', 'scheduled', 1, @ku10, '2026-03-20 09:00:00'),
(@ko4, @ku10, @k4c1, '(주)대성급식', '4월 납품 현황 점검', NULL, '2026-04-15 10:00:00', 'scheduled', 1, @ku10, '2026-04-01 09:00:00');

INSERT INTO COAPP_CRM_EXPENSE (comp_idno, clie_idno, clie_name, expe_name, expe_date, expe_amnt, expe_type, paym_meth, recr_type, enab_yesn, crea_idno, crea_date) VALUES
(@ko4, @k4c5, '(주)한국농수산물', '10-12월 채소 매입', '2024-12-31 00:00:00', 14800000, 'receipt', 'transfer', 'none', 1, @ku10, '2024-12-31 10:00:00'),
(@ko4, @k4c6, '신선축산(주)', '10-12월 육류 매입', '2024-12-31 00:00:00', 8200000, 'receipt', 'transfer', 'none', 1, @ku10, '2024-12-31 10:00:00'),
(@ko4, @k4c5, '(주)한국농수산물', '1분기 채소·과일 매입', '2025-03-31 00:00:00', 22500000, 'receipt', 'transfer', 'monthly', 1, @ku10, '2025-03-31 10:00:00'),
(@ko4, @k4c6, '신선축산(주)', '1분기 육류 매입', '2025-03-31 00:00:00', 12800000, 'receipt', 'transfer', 'monthly', 1, @ku10, '2025-03-31 10:00:00'),
(@ko4, @k4c5, '(주)한국농수산물', '2분기 채소·과일 매입', '2025-06-30 00:00:00', 24100000, 'receipt', 'transfer', 'monthly', 1, @ku10, '2025-06-30 10:00:00'),
(@ko4, @k4c5, '(주)한국농수산물', '추석 과일 매입', '2025-09-10 00:00:00', 3200000, 'receipt', 'transfer', 'none', 1, @ku10, '2025-09-10 10:00:00'),
(@ko4, @k4c5, '(주)한국농수산물', '4분기 채소·과일 매입', '2025-12-31 00:00:00', 23500000, 'receipt', 'transfer', 'monthly', 1, @ku10, '2025-12-31 10:00:00'),
(@ko4, @k4c6, '신선축산(주)', '4분기 육류 매입', '2025-12-31 00:00:00', 13400000, 'receipt', 'transfer', 'monthly', 1, @ku10, '2025-12-31 10:00:00'),
(@ko4, @k4c5, '(주)한국농수산물', '1분기 채소·과일 매입', '2026-03-31 00:00:00', 25200000, 'receipt', 'transfer', 'monthly', 1, @ku10, '2026-03-31 10:00:00');


-- =================================================================
-- COMPANY 5: 에코클린서비스 — 청소업체
-- 사장(배정호): 영업, 일정, 현장 관리
-- 관리실장(황수현): 일정 보조, 지출 관리
-- =================================================================

INSERT INTO COAPP_CORE_COMPANY (comp_name, bizn_numb, need_appr, link_yesn, mail_yesn, crea_date)
VALUES ('에코클린서비스', '2078134592', 0, 1, 0, '2024-11-01 09:00:00');
SET @ko5 = LAST_INSERT_ID();

INSERT INTO COAPP_CORE_USER (open_idno, user_name, mail_idno, pass_hash, logi_mthd, user_auth, crea_date)
VALUES ('local:ceo@eco.co.kr', '배정호', 'ceo@eco.co.kr', '$2b$10$I46TB4EhdCy.iw6JREGXLOsICv4cJem4e.TiYLSmgX4gLsz8rA.P6', 'email', 'user', '2024-11-01 09:00:00');
SET @ku11 = LAST_INSERT_ID();
INSERT INTO COAPP_CORE_USER (open_idno, user_name, mail_idno, pass_hash, logi_mthd, user_auth, crea_date)
VALUES ('local:mgr@eco.co.kr', '황수현', 'mgr@eco.co.kr', '$2b$10$I46TB4EhdCy.iw6JREGXLOsICv4cJem4e.TiYLSmgX4gLsz8rA.P6', 'email', 'user', '2024-11-01 09:10:00');
SET @ku12 = LAST_INSERT_ID();

INSERT INTO COAPP_CORE_COMPANY_USER (comp_idno, user_idno, comp_role, memb_stat, crea_idno) VALUES
(@ko5, @ku11, 'owner',  'active', @ku11),
(@ko5, @ku12, 'member', 'active', @ku11);

INSERT INTO COAPP_BILLING_SUBSCRIPTION (comp_idno, plan_idno, subs_stat, star_date, ends_date, crea_idno)
VALUES (@ko5, 4, 'active', '2024-11-01', '2027-12-31', @ku11);

-- 거래처
INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko5, '(주)위례오피스파크', '1088023451', 'sales', '오피스빌딩', '경기도 성남시 수정구 위례광장로 77', '주 3회 건물 전체 청소. 핵심 계약처', 1, @ku11, '2024-11-05 09:00:00');
SET @k5c1 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko5, '신흥아파트관리단', '1208045231', 'sales', '공동주택', '경기도 하남시 미사강변대로 45', '지하주차장·공용부 월 2회 청소', 1, @ku11, '2024-11-15 10:00:00');
SET @k5c2 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko5, '(주)판교테크센터', '2018034512', 'sales', '산업단지', '경기도 성남시 분당구 판교역로 235', '공장·사무동 주 1회 산업청소', 1, @ku11, '2024-12-03 09:00:00');
SET @k5c3 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko5, '서울성모병원 청소구역', '1038012341', 'sales', '의료/병원', '서울시 서초구 반포대로 222', '병원 외래·복도 전문 위생 청소', 1, @ku11, '2025-02-10 09:00:00');
SET @k5c4 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko5, '한샘청소용품(주)', '1148023451', 'purchase', '청소용품', '경기도 부천시 원미구 원미로 55', '세제·청소도구 정기 구매', 1, @ku12, '2024-11-03 09:00:00');
SET @k5c5 = LAST_INSERT_ID();

-- 담당자
INSERT INTO COAPP_CRM_CLIENT_CONT (comp_idno, clie_idno, cont_name, cont_role, cont_tele, cont_mail, main_yesn, enab_yesn, crea_idno) VALUES
(@ko5, @k5c1, '문재현', '시설관리팀장', '010-3312-8812', 'jh.moon@wirye-op.co.kr', 1, 1, @ku11),
(@ko5, @k5c2, '이진호', '관리사무소장', '010-5523-3341', 'jh.lee@shinheung-apt.co.kr', 1, 1, @ku11),
(@ko5, @k5c3, '김영수', '총무팀장', '010-7782-9901', 'ys.kim@pangyo-tech.co.kr', 1, 1, @ku11),
(@ko5, @k5c4, '박정희', '환경미화팀장', '010-9901-2234', 'jh.park@cmcseoul.co.kr', 1, 1, @ku11),
(@ko5, @k5c5, '강동민', '영업담당', '010-4456-5512', 'dm.kang@hansam-clean.co.kr', 1, 1, @ku12);

-- 영업일지 (배정호 @ku11)
INSERT INTO COAPP_CRM_SALE (comp_idno, owne_idno, clie_idno, clie_name, cont_name, vist_date, orig_memo, aiex_summ, aiex_done, aiex_stat, enab_yesn, crea_idno, crea_date) VALUES
(@ko5, @ku11, @k5c1, '(주)위례오피스파크', '문재현', '2024-11-08 09:00:00',
 '문재현 팀장 미팅. 주 3회 전체 건물 청소 계약. B1-10층 총 4,200평. 월 380만원.',
 '위례오피스파크 주 3회 전체 청소 계약. 4,200평, 월 380만원.',
 1, 'completed', 1, @ku11, '2024-11-08 10:00:00'),

(@ko5, @ku11, @k5c2, '신흥아파트관리단', '이진호', '2024-11-20 10:00:00',
 '소장 이진호 씨 미팅. 지하주차장 1-2층 + 복도 공용부 월 2회 청소. 월 145만원.',
 '신흥아파트 지하주차장·공용부 월 2회 청소. 월 145만원.',
 1, 'completed', 1, @ku11, '2024-11-20 11:00:00'),

(@ko5, @ku11, @k5c3, '(주)판교테크센터', '김영수', '2024-12-05 11:00:00',
 '김영수 팀장 미팅. 공장동 2개소+사무동 1개소 주 1회 산업청소. 월 280만원.',
 '판교테크센터 공장·사무동 3개소 주 1회 산업청소. 월 280만원.',
 1, 'completed', 1, @ku11, '2024-12-05 12:00:00'),

(@ko5, @ku11, @k5c1, '(주)위례오피스파크', '문재현', '2025-03-10 09:00:00',
 '분기 점검 방문. 청소 품질 만족도 높음. 하반기 주차장 구역 추가 요청. 월 45만원 추가.',
 '위례오피스파크 품질 만족. 주차장 추가 구역 월 45만원 추가 계약.',
 1, 'completed', 1, @ku11, '2025-03-10 10:00:00'),

(@ko5, @ku11, @k5c4, '서울성모병원 청소구역', '박정희', '2025-02-18 10:00:00',
 '박정희 팀장 미팅. 외래 3-6층 복도·대기실·화장실 주 5회 위생 청소. 월 620만원. 병원 특성상 위생 기준 엄격.',
 '성모병원 외래 복도·화장실 주 5회 위생 청소. 월 620만원, 엄격한 위생 기준.',
 1, 'completed', 1, @ku11, '2025-02-18 11:00:00'),

(@ko5, @ku11, @k5c4, '서울성모병원 청소구역', '박정희', '2025-07-10 10:00:00',
 '병원 상반기 만족도 평가. 우수 등급. 계약 연장 및 병동 1개 층 추가 논의. 월 150만원 추가.',
 '성모병원 상반기 청소 우수 평가. 병동 1개층 추가 월 150만원.',
 1, 'completed', 1, @ku11, '2025-07-10 11:00:00'),

(@ko5, @ku11, @k5c2, '신흥아파트관리단', '이진호', '2025-09-05 10:00:00',
 '이진호 소장 미팅. 엘리베이터 내부 청소 추가 요청. 월 25만원 추가. 계약 갱신 논의.',
 '신흥아파트 엘리베이터 청소 추가 월 25만원. 계약 갱신 진행.',
 1, 'completed', 1, @ku11, '2025-09-05 11:00:00'),

(@ko5, @ku11, @k5c3, '(주)판교테크센터', '김영수', '2025-11-12 11:00:00',
 '연말 연간 계약 갱신. 단가 3% 인상 합의. 내년도 계약 체결.',
 '판교테크센터 연간 계약 갱신. 단가 3% 인상 합의.',
 1, 'completed', 1, @ku11, '2025-11-12 12:00:00'),

(@ko5, @ku11, @k5c1, '(주)위례오피스파크', '문재현', '2026-02-15 09:00:00',
 '신규 임차인 입주로 청소 구역 확대. 월 60만원 추가. 3월부터 적용.',
 '위례오피스파크 임차인 증가로 청소 확대. 월 60만원 추가, 3월 적용.',
 1, 'completed', 1, @ku11, '2026-02-15 10:00:00'),

(@ko5, @ku11, @k5c4, '서울성모병원 청소구역', '박정희', '2026-03-20 10:00:00',
 '병원 상반기 계획 공유. 응급실 구역 추가 위탁 논의 중. 협의 필요.',
 '성모병원 응급실 청소 추가 위탁 협의 예정.',
 0, 'pending', 1, @ku11, '2026-03-20 11:00:00');

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko5, @ku11, @k5c1, '(주)위례오피스파크', '건물 정기 청소 용역 (2024 4분기)', 11400000, 'confirmed', '2024-11-10', '2024-12-31', 1, @ku11, '2024-11-10 09:00:00');
SET @ko5_ord1 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko5, @ku11, @k5c2, '신흥아파트관리단', '공용부 정기 청소 용역 (2025)', 2040000, 'confirmed', '2024-11-22', '2025-11-21', 1, @ku11, '2024-11-22 09:00:00');
SET @ko5_ord2 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko5, @ku11, @k5c3, '(주)판교테크센터', '산업청소 정기 용역 (2025)', 3360000, 'confirmed', '2024-12-10', '2025-12-09', 1, @ku11, '2024-12-10 09:00:00');
SET @ko5_ord3 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko5, @ku11, @k5c1, '(주)위례오피스파크', '건물 정기 청소 용역 (2025 연간)', 51000000, 'confirmed', '2025-01-01', '2025-12-31', 1, @ku11, '2025-01-01 09:00:00');
SET @ko5_ord4 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko5, @ku11, @k5c4, '서울성모병원 청소구역', '병원 위생 청소 용역 (2025)', 93600000, 'confirmed', '2025-03-01', '2026-02-28', 1, @ku11, '2025-03-01 09:00:00');
SET @ko5_ord5 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_SHIPMENT (comp_idno, owne_idno, orde_idno, clie_idno, clie_name, ship_stat, ship_date, invc_date, paid_date, ship_pric, enab_yesn, crea_idno, crea_date) VALUES
(@ko5, @ku11, @ko5_ord1, @k5c1, '(주)위례오피스파크', 'paid', '2024-12-31', '2025-01-05', '2025-01-20', 11400000, 1, @ku11, '2024-12-31 09:00:00'),
(@ko5, @ku11, @ko5_ord4, @k5c1, '(주)위례오피스파크', 'paid', '2025-06-30', '2025-07-05', '2025-07-25', 25500000, 1, @ku11, '2025-06-30 09:00:00'),
(@ko5, @ku11, @ko5_ord4, @k5c1, '(주)위례오피스파크', 'invoiced', '2025-12-31', '2026-01-05', NULL, 25500000, 1, @ku11, '2025-12-31 09:00:00'),
(@ko5, @ku11, @ko5_ord5, @k5c4, '서울성모병원 청소구역', 'paid', '2025-06-30', '2025-07-05', '2025-07-25', 46800000, 1, @ku11, '2025-06-30 09:00:00'),
(@ko5, @ku11, @ko5_ord5, @k5c4, '서울성모병원 청소구역', 'delivered', '2025-12-31', NULL, NULL, 46800000, 1, @ku11, '2025-12-31 09:00:00');

INSERT INTO COAPP_CRM_SCHEDULE (comp_idno, owne_idno, clie_idno, clie_name, sche_name, sche_desc, sche_date, sche_stat, enab_yesn, crea_idno, crea_date) VALUES
(@ko5, @ku11, @k5c1, '(주)위례오피스파크', '서비스 개시 현장 점검', NULL, '2024-11-12 09:00:00', 'completed', 1, @ku11, '2024-11-10 09:00:00'),
(@ko5, @ku12, @k5c1, '(주)위례오피스파크', '12월 운영 점검', NULL, '2024-12-20 09:00:00', 'completed', 1, @ku12, '2024-12-15 09:00:00'),
(@ko5, @ku11, @k5c4, '서울성모병원 청소구역', '병원 첫 투입 점검', '위생 기준 확인', '2025-03-03 08:00:00', 'completed', 1, @ku11, '2025-02-28 09:00:00'),
(@ko5, @ku12, @k5c3, '(주)판교테크센터', '2분기 품질 점검', NULL, '2025-06-05 10:00:00', 'completed', 1, @ku12, '2025-06-01 09:00:00'),
(@ko5, @ku11, @k5c4, '서울성모병원 청소구역', '상반기 만족도 평가 방문', NULL, '2025-07-10 10:00:00', 'completed', 1, @ku11, '2025-07-05 09:00:00'),
(@ko5, @ku12, @k5c2, '신흥아파트관리단', '엘리베이터 추가 구역 확인', NULL, '2025-09-10 09:00:00', 'completed', 1, @ku12, '2025-09-05 09:00:00'),
(@ko5, @ku11, @k5c1, '(주)위례오피스파크', '추가 구역 투입 확인', '3월 확대 구역 점검', '2026-03-05 09:00:00', 'completed', 1, @ku11, '2026-03-01 09:00:00'),
(@ko5, @ku11, @k5c4, '서울성모병원 청소구역', '응급실 구역 추가 협의', NULL, '2026-04-08 10:00:00', 'scheduled', 1, @ku11, '2026-03-25 09:00:00'),
(@ko5, @ku12, @k5c1, '(주)위례오피스파크', '4월 정기 품질 점검', NULL, '2026-04-14 09:00:00', 'scheduled', 1, @ku12, '2026-04-01 09:00:00');

INSERT INTO COAPP_CRM_EXPENSE (comp_idno, clie_idno, clie_name, expe_name, expe_date, expe_amnt, expe_type, paym_meth, recr_type, enab_yesn, crea_idno, crea_date) VALUES
(@ko5, @k5c5, '한샘청소용품(주)', '12월 청소 소모품 구매', '2024-12-10 00:00:00', 1250000, 'receipt', 'card', 'monthly', 1, @ku12, '2024-12-10 10:00:00'),
(@ko5, @k5c5, '한샘청소용품(주)', '1월 청소 소모품', '2025-01-10 00:00:00', 1380000, 'receipt', 'card', 'monthly', 1, @ku12, '2025-01-10 10:00:00'),
(@ko5, @k5c5, '한샘청소용품(주)', '2월 청소 소모품', '2025-02-10 00:00:00', 1290000, 'receipt', 'card', 'monthly', 1, @ku12, '2025-02-10 10:00:00'),
(@ko5, @k5c5, '한샘청소용품(주)', '병원 전용 위생소모품', '2025-03-05 00:00:00', 2150000, 'receipt', 'card', 'none', 1, @ku12, '2025-03-05 10:00:00'),
(@ko5, @k5c5, '한샘청소용품(주)', '4월 청소 소모품', '2025-04-10 00:00:00', 1680000, 'receipt', 'card', 'monthly', 1, @ku12, '2025-04-10 10:00:00'),
(@ko5, @k5c5, '한샘청소용품(주)', '7월 소모품 (여름철 대량)', '2025-07-10 00:00:00', 2340000, 'receipt', 'card', 'monthly', 1, @ku12, '2025-07-10 10:00:00'),
(@ko5, @k5c5, '한샘청소용품(주)', '10월 소모품', '2025-10-10 00:00:00', 1580000, 'receipt', 'card', 'monthly', 1, @ku12, '2025-10-10 10:00:00'),
(@ko5, @k5c5, '한샘청소용품(주)', '3월 소모품 (구역 확대)', '2026-03-10 00:00:00', 2080000, 'receipt', 'card', 'monthly', 1, @ku12, '2026-03-10 10:00:00');


-- =================================================================
-- COMPANY 6: 유니폼플러스 — 복장업체
-- 사장(류혜진): 전체 현황 보고 위주
-- 영업사원(조현민): 영업·수주·일정 전담
-- =================================================================

INSERT INTO COAPP_CORE_COMPANY (comp_name, bizn_numb, need_appr, link_yesn, mail_yesn, crea_date)
VALUES ('유니폼플러스', '1118045672', 0, 1, 0, '2024-10-20 09:00:00');
SET @ko6 = LAST_INSERT_ID();

INSERT INTO COAPP_CORE_USER (open_idno, user_name, mail_idno, pass_hash, logi_mthd, user_auth, crea_date)
VALUES ('local:ceo@uni.co.kr',   '류혜진', 'ceo@uni.co.kr',   '$2b$10$I46TB4EhdCy.iw6JREGXLOsICv4cJem4e.TiYLSmgX4gLsz8rA.P6', 'email', 'user', '2024-10-20 09:00:00');
SET @ku13 = LAST_INSERT_ID();
INSERT INTO COAPP_CORE_USER (open_idno, user_name, mail_idno, pass_hash, logi_mthd, user_auth, crea_date)
VALUES ('local:sales@uni.co.kr', '조현민', 'sales@uni.co.kr', '$2b$10$I46TB4EhdCy.iw6JREGXLOsICv4cJem4e.TiYLSmgX4gLsz8rA.P6', 'email', 'user', '2024-10-20 09:10:00');
SET @ku14 = LAST_INSERT_ID();

INSERT INTO COAPP_CORE_COMPANY_USER (comp_idno, user_idno, comp_role, memb_stat, crea_idno) VALUES
(@ko6, @ku13, 'owner',  'active', @ku13),
(@ko6, @ku14, 'member', 'active', @ku13);

INSERT INTO COAPP_BILLING_SUBSCRIPTION (comp_idno, plan_idno, subs_stat, star_date, ends_date, crea_idno)
VALUES (@ko6, 4, 'active', '2024-10-20', '2027-12-31', @ku13);

-- 거래처
INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, '(주)현대호텔앤리조트', '1088034512', 'sales', '호텔/리조트', '서울시 강남구 삼성동 159 코엑스', '프론트·룸서비스·주방 유니폼 연간 계약', 1, @ku14, '2024-10-25 09:00:00');
SET @k6c1 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, '대한항공 지상직팀', '1048023451', 'sales', '항공/운송', '서울시 강서구 하늘길 260 대한항공 본사', '지상직·탑승구 직원 유니폼 납품', 1, @ku14, '2024-11-10 10:00:00');
SET @k6c2 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, '(주)GS25 운영지원', '1078012341', 'sales', '유통/편의점', '서울시 강남구 논현로 508 GS타워', '편의점 아르바이트 유니폼 대량 납품', 1, @ku14, '2024-12-05 09:00:00');
SET @k6c3 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, '신한은행 지점운영', '1028034512', 'sales', '금융/은행', '서울시 중구 세종대로 20 신한은행 본점', '전국 영업점 직원 유니폼 연간 계약', 1, @ku14, '2025-01-20 09:00:00');
SET @k6c4 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, '에이스병원그룹', '2068023451', 'sales', '의료/병원', '경기도 수원시 팔달구 중부대로 56 에이스병원', '의사·간호사·원무과 유니폼', 1, @ku14, '2025-03-12 10:00:00');
SET @k6c5 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, '한국원단(주)', '1148034512', 'purchase', '원단/섬유', '경기도 광명시 하안로 30 한국원단', '주요 원단 공급사', 1, @ku14, '2024-10-22 09:00:00');
SET @k6c6 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_CLIENT (comp_idno, clie_name, bizn_numb, clie_type, indu_type, clie_addr, clie_memo, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, '봉제라인(주)', '2108023451', 'purchase', '봉제/제조', '경기도 시흥시 봉제공단로 88', '유니폼 봉제 위탁 공장', 1, @ku14, '2024-10-22 09:00:00');
SET @k6c7 = LAST_INSERT_ID();

-- 담당자
INSERT INTO COAPP_CRM_CLIENT_CONT (comp_idno, clie_idno, cont_name, cont_role, cont_tele, cont_mail, main_yesn, enab_yesn, crea_idno) VALUES
(@ko6, @k6c1, '김서연', '시설·물품팀장', '010-3312-8823', 'sy.kim@hyundaihotel.co.kr', 1, 1, @ku14),
(@ko6, @k6c2, '이민준', '유니폼관리팀', '010-5534-3341', 'mj.lee@koreanair.com', 1, 1, @ku14),
(@ko6, @k6c3, '장현아', '운영지원팀', '010-7782-5512', 'ha.jang@gs25.co.kr', 1, 1, @ku14),
(@ko6, @k6c4, '박태영', '총무팀 과장', '010-9901-4456', 'ty.park@shinhan.com', 1, 1, @ku14),
(@ko6, @k6c5, '오수지', '원무팀장', '010-2231-8812', 'sj.oh@ace-hosp.co.kr', 1, 1, @ku14),
(@ko6, @k6c6, '홍성민', '영업담당', '010-4456-2231', 'sm.hong@hkfabric.co.kr', 1, 1, @ku14),
(@ko6, @k6c7, '최재훈', '생산팀장', '010-8845-9901', NULL, 1, 1, @ku14);

-- 영업일지 (조현민 @ku14)
INSERT INTO COAPP_CRM_SALE (comp_idno, owne_idno, clie_idno, clie_name, cont_name, vist_date, orig_memo, aiex_summ, aiex_done, aiex_stat, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, @ku14, @k6c1, '(주)현대호텔앤리조트', '김서연', '2024-10-28 10:00:00',
 '김서연 팀장 미팅. 프론트·룸서비스·주방 직원 유니폼 연간 계약. 직원 320명 분. 총 4,800만원.',
 '현대호텔 직원 320명 유니폼 연간 계약 논의. 4,800만원.',
 1, 'completed', 1, @ku14, '2024-10-28 11:00:00'),

(@ko6, @ku14, @k6c1, '(주)현대호텔앤리조트', '김서연', '2024-11-20 10:00:00',
 '샘플 품평회. 디자인 2종 중 베이지 계열 선택. 계약서 초안 전달.',
 '현대호텔 샘플 품평 완료. 베이지 계열 선정. 계약 초안 전달.',
 1, 'completed', 1, @ku14, '2024-11-20 11:00:00'),

(@ko6, @ku14, @k6c2, '대한항공 지상직팀', '이민준', '2024-11-08 14:00:00',
 '이민준 씨 미팅. 지상직 직원 220명 여름·겨울 유니폼 납품. 연 2회 납품. 총 3,800만원.',
 '대한항공 지상직 220명 계절별 유니폼 납품. 연 2회, 3,800만원.',
 1, 'completed', 1, @ku14, '2024-11-08 15:00:00'),

(@ko6, @ku14, @k6c3, '(주)GS25 운영지원', '장현아', '2024-12-10 10:00:00',
 '아르바이트 유니폼 대량 발주 논의. 연 1회 전국 통합 발주. 3,000벌 예상. 벌당 15,000원.',
 'GS25 아르바이트 유니폼 전국 3,000벌 연 1회 발주. 단가 15,000원.',
 1, 'completed', 1, @ku14, '2024-12-10 11:00:00'),

(@ko6, @ku14, @k6c3, '(주)GS25 운영지원', '장현아', '2025-01-15 10:00:00',
 '발주 확정. 3,200벌. 납기 3월 말. 총 4,800만원.',
 'GS25 유니폼 3,200벌 발주 확정. 납기 3월 말, 4,800만원.',
 1, 'completed', 1, @ku14, '2025-01-15 11:00:00'),

(@ko6, @ku14, @k6c4, '신한은행 지점운영', '박태영', '2025-01-22 10:00:00',
 '박태영 과장 미팅. 전국 600개 지점 직원 유니폼 리뉴얼. 여성 400명, 남성 180명. 예산 1억 2천.',
 '신한은행 전국 지점 유니폼 리뉴얼. 580명, 예산 1억 2천.',
 1, 'completed', 1, @ku14, '2025-01-22 11:00:00'),

(@ko6, @ku14, @k6c4, '신한은행 지점운영', '박태영', '2025-03-05 14:00:00',
 '신한은행 디자인 시안 2차 확정. 봄 색상으로 최종 결정. 4월 납품 일정 확인.',
 '신한은행 유니폼 디자인 최종 확정. 4월 납품 예정.',
 1, 'completed', 1, @ku14, '2025-03-05 15:00:00'),

(@ko6, @ku14, @k6c1, '(주)현대호텔앤리조트', '김서연', '2025-04-10 10:00:00',
 '현대호텔 납품 완료 검수. 만족. 여름 시즌 추가 주방 유니폼 발주. 50벌 추가.',
 '현대호텔 유니폼 납품 완료. 주방 유니폼 50벌 추가 발주.',
 1, 'completed', 1, @ku14, '2025-04-10 11:00:00'),

(@ko6, @ku14, @k6c5, '에이스병원그룹', '오수지', '2025-03-18 11:00:00',
 '오수지 팀장 미팅. 의사 80명, 간호사 150명, 원무과 40명 유니폼. 총 3,200만원 예산.',
 '에이스병원 의료진 270명 유니폼 납품 논의. 3,200만원.',
 1, 'completed', 1, @ku14, '2025-03-18 12:00:00'),

(@ko6, @ku14, @k6c5, '에이스병원그룹', '오수지', '2025-05-12 10:00:00',
 '병원 유니폼 계약 완료. 6월 납품. 의사 가운 별도 추가 100만원.',
 '에이스병원 유니폼 계약 완료. 6월 납품, 의사 가운 추가 100만원.',
 1, 'completed', 1, @ku14, '2025-05-12 11:00:00'),

(@ko6, @ku14, @k6c2, '대한항공 지상직팀', '이민준', '2025-06-10 14:00:00',
 '하반기 동복 발주 확정. 220명 분. 납기 9월. 총 1,950만원.',
 '대한항공 동복 220명 발주 확정. 9월 납기, 1,950만원.',
 1, 'completed', 1, @ku14, '2025-06-10 15:00:00'),

(@ko6, @ku14, @k6c4, '신한은행 지점운영', '박태영', '2025-09-15 10:00:00',
 '납품 후 만족도 조사 공유. 우수 평가. 내년도 연간 계약 갱신 논의 시작.',
 '신한은행 유니폼 만족도 우수. 내년 계약 갱신 논의.',
 1, 'completed', 1, @ku14, '2025-09-15 11:00:00'),

(@ko6, @ku14, @k6c3, '(주)GS25 운영지원', '장현아', '2025-11-20 10:00:00',
 '2026년 유니폼 발주 계획 수신. 3,500벌 예정. 디자인 소폭 변경 요청.',
 'GS25 2026년 3,500벌 발주 예정. 디자인 변경 논의.',
 1, 'completed', 1, @ku14, '2025-11-20 11:00:00'),

(@ko6, @ku14, @k6c1, '(주)현대호텔앤리조트', '김서연', '2025-12-10 10:00:00',
 '연간 계약 갱신. 단가 2% 인상. 직원 340명으로 증가. 총 5,100만원.',
 '현대호텔 계약 갱신. 340명, 단가 2% 인상, 5,100만원.',
 1, 'completed', 1, @ku14, '2025-12-10 11:00:00'),

(@ko6, @ku14, @k6c5, '에이스병원그룹', '오수지', '2026-02-20 11:00:00',
 '병원 2026년 유니폼 추가 발주. 신규 스태프 30명 추가. 총 720만원.',
 '에이스병원 신규 스태프 30명 유니폼 추가. 720만원.',
 1, 'completed', 1, @ku14, '2026-02-20 12:00:00'),

(@ko6, @ku14, @k6c3, '(주)GS25 운영지원', '장현아', '2026-03-25 10:00:00',
 '2026 유니폼 발주 최종 확정. 3,500벌. 단가 16,500원. 총 5,775만원. 5월 납품.',
 'GS25 2026년 3,500벌 5,775만원 확정. 5월 납품.',
 0, 'pending', 1, @ku14, '2026-03-25 11:00:00');

-- 수주
INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, @ku14, @k6c1, '(주)현대호텔앤리조트', '호텔 직원 유니폼 (2025)', 48000000, 'confirmed', '2024-11-25', '2025-02-28', 1, @ku14, '2024-11-25 09:00:00');
SET @ko6_ord1 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, @ku14, @k6c3, '(주)GS25 운영지원', 'GS25 아르바이트 유니폼 3,200벌', 48000000, 'confirmed', '2025-01-18', '2025-03-31', 1, @ku14, '2025-01-18 09:00:00');
SET @ko6_ord2 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, @ku14, @k6c4, '신한은행 지점운영', '전국 지점 직원 유니폼 리뉴얼', 116800000, 'confirmed', '2025-03-10', '2025-04-30', 1, @ku14, '2025-03-10 09:00:00');
SET @ko6_ord3 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, @ku14, @k6c5, '에이스병원그룹', '병원 의료진 유니폼 납품', 33000000, 'confirmed', '2025-05-15', '2025-06-30', 1, @ku14, '2025-05-15 09:00:00');
SET @ko6_ord4 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, @ku14, @k6c2, '대한항공 지상직팀', '지상직 동복 유니폼 220명', 19500000, 'confirmed', '2025-06-15', '2025-09-15', 1, @ku14, '2025-06-15 09:00:00');
SET @ko6_ord5 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, @ku14, @k6c1, '(주)현대호텔앤리조트', '호텔 직원 유니폼 (2026)', 51000000, 'confirmed', '2025-12-15', '2026-03-31', 1, @ku14, '2025-12-15 09:00:00');
SET @ko6_ord6 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, @ku14, @k6c5, '에이스병원그룹', '병원 신규 스태프 추가 유니폼', 7200000, 'confirmed', '2026-02-25', '2026-04-15', 1, @ku14, '2026-02-25 09:00:00');
SET @ko6_ord7 = LAST_INSERT_ID();

INSERT INTO COAPP_CRM_ORDER (comp_idno, owne_idno, clie_idno, clie_name, prod_serv, orde_pric, orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, @ku14, @k6c3, '(주)GS25 운영지원', 'GS25 아르바이트 유니폼 2026 3,500벌', 57750000, 'proposal', NULL, '2026-05-31', 1, @ku14, '2026-03-28 09:00:00');
SET @ko6_ord8 = LAST_INSERT_ID();

-- 납품
INSERT INTO COAPP_CRM_SHIPMENT (comp_idno, owne_idno, orde_idno, clie_idno, clie_name, ship_stat, ship_date, invc_date, paid_date, ship_pric, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, @ku14, @ko6_ord1, @k6c1, '(주)현대호텔앤리조트', 'paid', '2025-02-25', '2025-03-05', '2025-03-25', 48000000, 1, @ku14, '2025-02-25 09:00:00'),
(@ko6, @ku14, @ko6_ord2, @k6c3, '(주)GS25 운영지원', 'paid', '2025-03-28', '2025-04-05', '2025-04-25', 48000000, 1, @ku14, '2025-03-28 09:00:00'),
(@ko6, @ku14, @ko6_ord3, @k6c4, '신한은행 지점운영', 'paid', '2025-04-28', '2025-05-05', '2025-05-25', 116800000, 1, @ku14, '2025-04-28 09:00:00'),
(@ko6, @ku14, @ko6_ord4, @k6c5, '에이스병원그룹', 'paid', '2025-06-28', '2025-07-05', '2025-07-25', 33000000, 1, @ku14, '2025-06-28 09:00:00'),
(@ko6, @ku14, @ko6_ord5, @k6c2, '대한항공 지상직팀', 'paid', '2025-09-12', '2025-09-20', '2025-10-10', 19500000, 1, @ku14, '2025-09-12 09:00:00'),
(@ko6, @ku14, @ko6_ord6, @k6c1, '(주)현대호텔앤리조트', 'delivered', '2026-03-28', NULL, NULL, 51000000, 1, @ku14, '2026-03-28 09:00:00'),
(@ko6, @ku14, @ko6_ord7, @k6c5, '에이스병원그룹', 'pending', NULL, NULL, NULL, 7200000, 1, @ku14, '2026-02-25 09:00:00');

-- 일정 (조현민 @ku14)
INSERT INTO COAPP_CRM_SCHEDULE (comp_idno, owne_idno, clie_idno, clie_name, sche_name, sche_desc, sche_date, sche_stat, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, @ku14, @k6c1, '(주)현대호텔앤리조트', '샘플 품평회', NULL, '2024-11-20 10:00:00', 'completed', 1, @ku14, '2024-11-15 09:00:00'),
(@ko6, @ku14, @k6c2, '대한항공 지상직팀', '유니폼 사이즈 측정', NULL, '2024-11-25 09:00:00', 'completed', 1, @ku14, '2024-11-20 09:00:00'),
(@ko6, @ku14, @k6c3, '(주)GS25 운영지원', '발주 수량 최종 확정', NULL, '2025-01-15 10:00:00', 'completed', 1, @ku14, '2025-01-10 09:00:00'),
(@ko6, @ku14, @k6c4, '신한은행 지점운영', '디자인 시안 발표', NULL, '2025-02-10 14:00:00', 'completed', 1, @ku14, '2025-02-05 09:00:00'),
(@ko6, @ku14, @k6c1, '(주)현대호텔앤리조트', '납품 완료 검수', NULL, '2025-02-26 10:00:00', 'completed', 1, @ku14, '2025-02-20 09:00:00'),
(@ko6, @ku14, @k6c4, '신한은행 지점운영', '납품 현장 검수', NULL, '2025-04-29 10:00:00', 'completed', 1, @ku14, '2025-04-25 09:00:00'),
(@ko6, @ku14, @k6c5, '에이스병원그룹', '병원 의료진 사이즈 측정', NULL, '2025-05-20 10:00:00', 'completed', 1, @ku14, '2025-05-15 09:00:00'),
(@ko6, @ku14, @k6c2, '대한항공 지상직팀', '동복 납품 완료 확인', NULL, '2025-09-15 10:00:00', 'completed', 1, @ku14, '2025-09-10 09:00:00'),
(@ko6, @ku14, @k6c4, '신한은행 지점운영', '계약 갱신 논의', NULL, '2025-10-15 14:00:00', 'completed', 1, @ku14, '2025-10-10 09:00:00'),
(@ko6, @ku14, @k6c3, '(주)GS25 운영지원', '2026 디자인 변경 시안 전달', NULL, '2025-12-10 10:00:00', 'completed', 1, @ku14, '2025-12-05 09:00:00'),
(@ko6, @ku14, @k6c1, '(주)현대호텔앤리조트', '2026 유니폼 납품 일정 확인', NULL, '2026-03-10 10:00:00', 'completed', 1, @ku14, '2026-03-05 09:00:00'),
(@ko6, @ku14, @k6c5, '에이스병원그룹', '추가 유니폼 납품 일정 확인', NULL, '2026-04-08 10:00:00', 'scheduled', 1, @ku14, '2026-04-01 09:00:00'),
(@ko6, @ku14, @k6c3, '(주)GS25 운영지원', '2026 최종 발주 계약 서명', NULL, '2026-04-15 14:00:00', 'scheduled', 1, @ku14, '2026-04-07 09:00:00');

-- 지출 (조현민 @ku14)
INSERT INTO COAPP_CRM_EXPENSE (comp_idno, clie_idno, clie_name, expe_name, expe_date, expe_amnt, expe_type, paym_meth, recr_type, enab_yesn, crea_idno, crea_date) VALUES
(@ko6, @k6c6, '한국원단(주)', '호텔 유니폼 원단 구매', '2024-12-05 00:00:00', 9800000, 'receipt', 'transfer', 'none', 1, @ku14, '2024-12-05 10:00:00'),
(@ko6, @k6c7, '봉제라인(주)', '호텔 유니폼 봉제 위탁', '2024-12-20 00:00:00', 14400000, 'receipt', 'transfer', 'none', 1, @ku14, '2024-12-20 10:00:00'),
(@ko6, @k6c6, '한국원단(주)', 'GS25 유니폼 원단 구매', '2025-01-25 00:00:00', 19200000, 'receipt', 'transfer', 'none', 1, @ku14, '2025-01-25 10:00:00'),
(@ko6, @k6c7, '봉제라인(주)', 'GS25 유니폼 봉제 위탁', '2025-02-10 00:00:00', 14400000, 'receipt', 'transfer', 'none', 1, @ku14, '2025-02-10 10:00:00'),
(@ko6, @k6c6, '한국원단(주)', '신한은행 유니폼 원단', '2025-03-15 00:00:00', 32000000, 'receipt', 'transfer', 'none', 1, @ku14, '2025-03-15 10:00:00'),
(@ko6, @k6c7, '봉제라인(주)', '신한은행 유니폼 봉제', '2025-03-25 00:00:00', 35000000, 'receipt', 'transfer', 'none', 1, @ku14, '2025-03-25 10:00:00'),
(@ko6, @k6c6, '한국원단(주)', '병원·항공 유니폼 원단', '2025-05-20 00:00:00', 10800000, 'receipt', 'transfer', 'none', 1, @ku14, '2025-05-20 10:00:00'),
(@ko6, @k6c7, '봉제라인(주)', '병원·항공 유니폼 봉제', '2025-05-28 00:00:00', 15600000, 'receipt', 'transfer', 'none', 1, @ku14, '2025-05-28 10:00:00'),
(@ko6, @k6c6, '한국원단(주)', '2026 호텔 유니폼 원단', '2026-01-10 00:00:00', 10500000, 'receipt', 'transfer', 'none', 1, @ku14, '2026-01-10 10:00:00'),
(@ko6, @k6c7, '봉제라인(주)', '2026 호텔 유니폼 봉제', '2026-01-20 00:00:00', 15300000, 'receipt', 'transfer', 'none', 1, @ku14, '2026-01-20 10:00:00'),
(@ko6, @k6c6, '한국원단(주)', 'GS25 2026 원단', '2026-04-05 00:00:00', 21000000, 'receipt', 'transfer', 'none', 1, @ku14, '2026-04-05 10:00:00');

-- =================================================================
-- 완료
-- =================================================================
-- 계정 목록:
-- [제조/유통] ceo@ind.co.kr / sales@ind.co.kr / acct@ind.co.kr
-- [IT/솔루션] ceo@sol.co.kr / lead@sol.co.kr / sales@sol.co.kr / acct@sol.co.kr
-- [건설/인테리어] ceo@space.co.kr / acct@space.co.kr
-- [식품/소모성] ceo@food.co.kr
-- [청소업체] ceo@eco.co.kr / mgr@eco.co.kr
-- [복장업체] ceo@uni.co.kr / sales@uni.co.kr
-- 모든 계정 비밀번호: Demo1234!
-- =================================================================
