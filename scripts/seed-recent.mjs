// scripts/seed-recent.mjs
// 최근 데이터 보충: 2025-11 ~ 2026-05 (현재 기준 -5개월 ~ +1개월)
// 실행: node scripts/seed-recent.mjs

import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

function d(y, m, day, h = 10, min = 0) {
  return new Date(y, m - 1, day, h, min, 0)
    .toISOString().slice(0, 19).replace("T", " ");
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── 회사 정보 ─────────────────────────────────────────────────────
const IND   = { cid: 7,  uid: 19, name: "한국산업기계" };
const SOL_L = { cid: 8,  uid: 22, name: "넥스트솔루션-팀장" };
const SOL_S = { cid: 8,  uid: 23, name: "넥스트솔루션-사원" };
const SPC   = { cid: 9,  uid: 25, name: "더스페이스디자인" };
const FOOD  = { cid: 10, uid: 27, name: "청원식자재유통" };
const ECO   = { cid: 11, uid: 28, name: "에코클린서비스" };
const UNI   = { cid: 12, uid: 31, name: "유니폼플러스" };

// ── 거래처 ────────────────────────────────────────────────────────
const CLIENTS = {
  ind:  [22,23,24,25,26,27,28],
  sol:  [29,30,31,32,33,34,35,36],
  spc:  [37,38,39,40,41,42,43],
  food: [44,45,46,47,48,49],
  eco:  [50,51,52,53,54],
  uni:  [55,56,57,58,59,60,61],
};

const CLIENT_NAMES = {
  22:"(주)현대정밀부품",23:"삼성중공업 협력사",24:"(주)동양자동화",
  25:"코리아패키징",26:"(주)한진물류",27:"성원철강자재",28:"(주)서울공구",
  29:"(주)한국화재보험",30:"세종병원그룹",31:"서울교통공사",32:"신한캐피탈(주)",
  33:"(주)한국전자부품",34:"인천국제공항공사",35:"마이크로소프트 코리아",36:"클라우드허브코리아",
  37:"(주)GS리테일 시설팀",38:"제이앤파트너스(주)",39:"모아건설(주)",
  40:"스타벅스 코리아 시설",41:"힐링스파앤리조트",42:"(주)한국인테리어자재",43:"신한조명(주)",
  44:"(주)대성급식",45:"행복한학교식당",46:"편한세상카페(주)",
  47:"힘찬마트(주)",48:"(주)한국농수산물",49:"신선축산(주)",
  50:"(주)위례오피스파크",51:"신흥아파트관리단",52:"(주)판교테크센터",
  53:"서울성모병원 청소구역",54:"한샘청소용품(주)",
  55:"(주)현대호텔앤리조트",56:"대한항공 지상직팀",57:"(주)GS25 운영지원",
  58:"신한은행 지점운영",59:"에이스병원그룹",60:"한국원단(주)",61:"봉제라인(주)",
};

// ── 영업일지 내용 ─────────────────────────────────────────────────
const SALE_NOTES = {
  ind: [
    "(주)현대정밀부품 방문. 정기 부품 발주 물량 확인. 프레스 금형 부품 200세트 추가 발주 협의. 다음 주 견적서 제출 예정.",
    "코리아패키징 현장 방문. 포장기계 부품 마모 확인. 교체 부품 리스트 수령. 납기 2주 요청.",
    "삼성중공업 협력사 미팅. 대형 프레스 설비 부품 교체 건 논의. 견적가 3,200만원 제시.",
    "(주)동양자동화 방문. 자동화 라인 소모품 교체 주기 점검. 정기 공급 계약 갱신 협의.",
    "(주)한진물류 창고 방문. 컨베이어 벨트 부품 상태 점검. 2개월치 소모품 선발주 요청.",
    "성원철강자재 방문. 절단 설비 부품 문의. 신규 품목 견적서 제출. 다음 달 발주 예상.",
    "(주)서울공구 방문. 금형 부품 재고 점검. 연간 공급 계약 재검토. 단가 조정 협의.",
    "(주)현대정밀부품 긴급 출장. 불량 부품 클레임 처리. 현장 확인 후 무상 교체 결정.",
    "코리아패키징 전화 통화 후 방문. 신규 라인 증설 관련 부품 사전 발주 요청.",
    "(주)동양자동화 영업 미팅. 내년 설비 교체 예산 파악. 사전 견적서 제출 완료.",
  ],
  sol: [
    "세종병원그룹 IT 인프라 점검 방문. 네트워크 장비 노후화 확인. 교체 제안서 준비 예정.",
    "신한캐피탈 클라우드 마이그레이션 제안 미팅. 하이브리드 클라우드 전환 방안 발표.",
    "서울교통공사 유지보수 계약 갱신 협의. 연간 1.8억 규모. 조건 협의 중.",
    "(주)한국전자부품 보안 솔루션 제안. EDR/NAC 도입 검토 요청. 기술 PoC 일정 협의.",
    "인천국제공항공사 스마트 운영 플랫폼 도입 미팅. RFP 검토 후 제안서 작성 예정.",
    "마이크로소프트 코리아 파트너 미팅. M365 대형 고객 공동 영업 기회 발굴.",
    "클라우드허브코리아 기술 미팅. 멀티클라우드 관리 솔루션 공동 제안 협의.",
    "(주)한국화재보험 DX 프로젝트 제안. 보험 업무 자동화 솔루션 데모 진행.",
    "세종병원그룹 2차 미팅. EMR 연동 IT 인프라 고도화 계약 최종 협의.",
    "신한캐피탈 계약서 검토 미팅. 클라우드 이전 작업 일정 확정. 착수 예정.",
  ],
  spc: [
    "스타벅스 코리아 시설팀 방문. 신규 매장 3곳 인테리어 리뉴얼 협의. 예산 5,000만원.",
    "(주)GS리테일 시설팀 점포 리뉴얼 미팅. 매장 20개 표준 인테리어 패키지 제안.",
    "힐링스파앤리조트 현장 방문. 로비 및 객실 리노베이션 공사 견적 협의. 3억 규모 예상.",
    "제이앤파트너스 오피스 인테리어 현장 점검. 공사 진행 상황 보고. 마감재 변경 처리.",
    "모아건설 협력 미팅. 신축 건물 인테리어 하도급 계약 논의. 공사 범위 확정 예정.",
    "(주)한국인테리어자재 자재 단가 협의. 신규 자재 샘플 검토. 원가 절감 방안 논의.",
    "신한조명 신제품 쇼룸 방문. 상업공간 조명 트렌드 파악. 거래처 제안용 카탈로그 수령.",
    "스타벅스 코리아 2차 미팅. 도면 확정 후 견적서 제출. 내달 착공 협의.",
  ],
  food: [
    "(주)대성급식 방문. 4월 식자재 발주 확인. 쌀 4톤, 채소류 2톤 정기납품 계약 갱신.",
    "편한세상카페 신규 납품 협의. 디저트용 과일류 정기 공급 계약 논의. 주 2회 납품 가능.",
    "힘찬마트 방문. 신선식품 납품 단가 협의. 경쟁사 대비 가격 경쟁력 확인.",
    "행복한학교식당 방문. 학교 급식 식재료 품질 점검. 다음 학기 계약 연장 의향 확인.",
    "(주)한국농수산물 도매 단가 협의. 계절별 수급 변동 대응 방안 논의.",
    "신선축산 방문. 육류 공급 계약 갱신. 가격 조정 및 납품 규격 협의 완료.",
    "편한세상카페 납품 현황 점검. 클레임 없음 확인. 추가 품목 제안.",
    "(주)대성급식 월간 정산 미팅. 납품 물량 확인 및 다음 달 발주 계획 확정.",
  ],
  eco: [
    "(주)위례오피스파크 월간 청소 서비스 점검. 로비/엘리베이터 특수 청소 추가 요청.",
    "서울성모병원 청소구역 월례 점검. 감염관리팀 미팅. 소독 용역 추가 계약 논의.",
    "(주)판교테크센터 방문. 서버룸/클린룸 특수 청소 현황 보고. 계약 조건 재협의.",
    "신흥아파트관리단 관리사무소 방문. 공용부 청소 품질 점검. 입주민 민원 사항 처리.",
    "한샘청소용품 소모품 재고 점검. 분기별 소모품 발주 목록 확정. 단가 협의.",
    "(주)위례오피스파크 정기 청소 계약 갱신 미팅. 월 280만원 조건으로 1년 연장 합의.",
    "서울성모병원 특수 청소 용역 계약 체결 미팅. 수술실/격리병동 추가 구역 포함.",
  ],
  uni: [
    "(주)현대호텔앤리조트 유니폼 시즌 교체 미팅. 하우스키핑 120명분 하계 유니폼 발주.",
    "신한은행 지점운영팀 미팅. 전국 100개 지점 직원 유니폼 리뉴얼 프로젝트 협의.",
    "에이스병원그룹 의료진 유니폼 발주 미팅. 의사/간호사/행정직 각 규격 확인.",
    "대한항공 지상직팀 유니폼 납품 점검. 사이즈 수정 요청 처리. 추가 발주 논의.",
    "(주)GS25 운영지원 편의점 직원 유니폼 시즌 교체 협의. 하절기 소재 변경 요청.",
    "한국원단 신규 소재 샘플 검토. 기능성 원단 도입으로 원가 절감 방안 논의.",
    "봉제라인 생산 현황 점검. 납기 준수 여부 확인. 품질 이슈 없음.",
    "(주)현대호텔앤리조트 납품 완료 후 사후 관리 미팅. 수선 서비스 계약 추가.",
  ],
};

// ── 지출 항목 ─────────────────────────────────────────────────────
const EXPENSES = {
  ind: [
    { name: "출장 주유비", categ: "교통비", amnt: 89000, meth: "card" },
    { name: "고속도로 통행료", categ: "교통비", amnt: 15400, meth: "card" },
    { name: "거래처 점심 식대", categ: "식비", amnt: 78000, meth: "card" },
    { name: "부품 샘플 배송비", categ: "택배/배송", amnt: 12000, meth: "card" },
    { name: "출장 숙박비", categ: "숙박비", amnt: 95000, meth: "card" },
    { name: "팀 회식", categ: "식비", amnt: 135000, meth: "card" },
    { name: "A4 용지/사무용품", categ: "사무용품", amnt: 24000, meth: "card" },
  ],
  sol: [
    { name: "IT 세미나 참가비", categ: "교육비", amnt: 330000, meth: "transfer" },
    { name: "거래처 미팅 식대", categ: "식비", amnt: 92000, meth: "card" },
    { name: "노트북 소모품 구입", categ: "사무용품", amnt: 58000, meth: "card" },
    { name: "택시비 (고객사 방문)", categ: "교통비", amnt: 23400, meth: "card" },
    { name: "제안서 인쇄/제본", categ: "사무용품", amnt: 45000, meth: "card" },
    { name: "팀 점심 식대", categ: "식비", amnt: 68000, meth: "card" },
    { name: "클라우드 툴 구독", categ: "SW/구독", amnt: 55000, meth: "card" },
  ],
  spc: [
    { name: "인테리어 자재 샘플비", categ: "소모품", amnt: 120000, meth: "card" },
    { name: "현장 출장 교통비", categ: "교통비", amnt: 45000, meth: "card" },
    { name: "현장 미팅 식대", categ: "식비", amnt: 86000, meth: "card" },
    { name: "도면 출력비", categ: "사무용품", amnt: 35000, meth: "card" },
    { name: "현장 숙박비", categ: "숙박비", amnt: 110000, meth: "card" },
    { name: "공구/측정기 소모품", categ: "소모품", amnt: 67000, meth: "card" },
  ],
  food: [
    { name: "냉장차 유류비", categ: "교통비", amnt: 125000, meth: "card" },
    { name: "고속도로 통행료", categ: "교통비", amnt: 18600, meth: "card" },
    { name: "납품 포장재", categ: "소모품", amnt: 42000, meth: "card" },
    { name: "거래처 방문 선물", categ: "접대비", amnt: 55000, meth: "card" },
    { name: "식재료 시장조사 식비", categ: "식비", amnt: 38000, meth: "cash" },
    { name: "차량 유지비", categ: "교통비", amnt: 85000, meth: "card" },
  ],
  eco: [
    { name: "청소용품 소모품 구입", categ: "소모품", amnt: 185000, meth: "card" },
    { name: "차량 유류비", categ: "교통비", amnt: 92000, meth: "card" },
    { name: "안전용품 구입", categ: "소모품", amnt: 45000, meth: "card" },
    { name: "현장 직원 식대", categ: "식비", amnt: 56000, meth: "cash" },
    { name: "세제/소독제 대량 구입", categ: "소모품", amnt: 234000, meth: "transfer" },
    { name: "작업복 세탁비", categ: "소모품", amnt: 28000, meth: "card" },
  ],
  uni: [
    { name: "원단 샘플 구입비", categ: "소모품", amnt: 156000, meth: "card" },
    { name: "거래처 방문 교통비", categ: "교통비", amnt: 38000, meth: "card" },
    { name: "납품 택배비", categ: "택배/배송", amnt: 24000, meth: "card" },
    { name: "봉제 부자재 구입", categ: "소모품", amnt: 89000, meth: "card" },
    { name: "고객사 미팅 식대", categ: "식비", amnt: 72000, meth: "card" },
    { name: "디자인 시안 인쇄비", categ: "사무용품", amnt: 31000, meth: "card" },
  ],
};

// ── 수주 품목 ─────────────────────────────────────────────────────
const ORDER_ITEMS = {
  ind:  ["프레스 금형 부품 세트 공급", "컨베이어 벨트 부품 일식", "자동화 라인 소모품 공급", "절단기 교체 부품 납품"],
  sol:  ["IT 인프라 교체 구축", "클라우드 마이그레이션 용역", "보안 솔루션 도입 구축", "ERP 시스템 유지보수 계약", "네트워크 장비 교체"],
  spc:  ["오피스 인테리어 시공", "매장 리뉴얼 공사", "로비/공용부 인테리어 공사", "상업시설 인테리어 시공"],
  food: ["월 정기 식자재 공급 계약", "급식 재료 정기 납품", "신선식품 정기 공급 계약"],
  eco:  ["월 정기 청소 용역 계약", "특수 청소 용역 계약", "공용부 청소 용역 연장"],
  uni:  ["하계 유니폼 일괄 납품", "전직군 유니폼 리뉴얼 제작", "시즌 유니폼 발주 계약"],
};

const ORDER_PRICES = {
  ind:  [3200000, 5500000, 8800000, 12000000, 4500000],
  sol:  [45000000, 88000000, 32000000, 18000000, 120000000],
  spc:  [50000000, 120000000, 85000000, 35000000],
  food: [4200000, 3800000, 6500000],
  eco:  [2800000, 3200000, 4500000],
  uni:  [12000000, 28000000, 18000000],
};

// ── 삽입 함수 ─────────────────────────────────────────────────────
async function insertSale(cid, uid, clieId, note, visitDate, price = null) {
  const [r] = await conn.execute(
    `INSERT INTO COAPP_CRM_SALE
      (comp_idno, owne_idno, clie_idno, clie_name, vist_date, sale_pric, orig_memo,
       aiex_stat, aiex_done, enab_yesn, crea_idno, crea_date)
     VALUES (?,?,?,?,?,?,?,'completed',1,1,?,?)`,
    [cid, uid, clieId, CLIENT_NAMES[clieId], visitDate, price, note, uid, visitDate]
  );
  return r.insertId;
}

async function insertSchedule(cid, uid, clieId, saleId, name, schedDate, stat) {
  await conn.execute(
    `INSERT INTO COAPP_CRM_SCHEDULE
      (comp_idno, owne_idno, sale_idno, clie_idno, clie_name, sche_name, sche_date,
       sche_stat, enab_yesn, crea_idno, crea_date)
     VALUES (?,?,?,?,?,?,?,?,1,?,?)`,
    [cid, uid, saleId, clieId, CLIENT_NAMES[clieId], name, schedDate, stat, uid, schedDate]
  );
}

async function insertOrder(cid, uid, clieId, saleId, item, price, ctrtDate, expdDate, stat = "confirmed") {
  const [r] = await conn.execute(
    `INSERT INTO COAPP_CRM_ORDER
      (comp_idno, owne_idno, clie_idno, sale_idno, clie_name, prod_serv, orde_pric,
       orde_stat, ctrt_date, expd_date, enab_yesn, crea_idno, crea_date)
     VALUES (?,?,?,?,?,?,?,?,?,?,1,?,?)`,
    [cid, uid, clieId, saleId, CLIENT_NAMES[clieId], item, price, stat, ctrtDate, expdDate, uid, ctrtDate]
  );
  return r.insertId;
}

async function insertShipment(cid, uid, clieId, ordeId, price, shipDate, stat = "paid") {
  await conn.execute(
    `INSERT INTO COAPP_CRM_SHIPMENT
      (comp_idno, owne_idno, orde_idno, clie_idno, clie_name, ship_pric,
       ship_date, ship_stat, enab_yesn, crea_idno, crea_date)
     VALUES (?,?,?,?,?,?,?,?,1,?,?)`,
    [cid, uid, ordeId, clieId, CLIENT_NAMES[clieId], price, shipDate, stat, uid, shipDate]
  );
}

async function insertExpense(cid, uid, exp, expDate) {
  await conn.execute(
    `INSERT INTO COAPP_CRM_EXPENSE
      (comp_idno, clie_idno, expe_name, expe_amnt, expe_date, expe_type,
       paym_meth, ai_categ, enab_yesn, crea_idno, crea_date)
     VALUES (?,NULL,?,?,?,'general',?,?,1,?,?)`,
    [cid, exp.name, exp.amnt, expDate, exp.meth, exp.categ, uid, expDate]
  );
}

// ── 데이터 생성 ────────────────────────────────────────────────────
// [회사코드, comp_idno, user_idno, 클라이언트배열]
const COMPANIES_LIST = [
  ["ind",  7,  [19],     CLIENTS.ind,  SALE_NOTES.ind,  EXPENSES.ind,  ORDER_ITEMS.ind,  ORDER_PRICES.ind],
  ["sol",  8,  [22, 23], CLIENTS.sol,  SALE_NOTES.sol,  EXPENSES.sol,  ORDER_ITEMS.sol,  ORDER_PRICES.sol],
  ["spc",  9,  [25],     CLIENTS.spc,  SALE_NOTES.spc,  EXPENSES.spc,  ORDER_ITEMS.spc,  ORDER_PRICES.spc],
  ["food", 10, [27],     CLIENTS.food, SALE_NOTES.food,  EXPENSES.food, ORDER_ITEMS.food, ORDER_PRICES.food],
  ["eco",  11, [28],     CLIENTS.eco,  SALE_NOTES.eco,  EXPENSES.eco,  ORDER_ITEMS.eco,  ORDER_PRICES.eco],
  ["uni",  12, [31],     CLIENTS.uni,  SALE_NOTES.uni,  EXPENSES.uni,  ORDER_ITEMS.uni,  ORDER_PRICES.uni],
];

// 월별 데이터 계획: [year, month, saleDays, hasOrder]
const PAST_MONTHS = [
  [2025, 11, [3,5,8,11,14,17,20,24], true],
  [2025, 12, [2,4,8,10,15,18,22,26], true],
  [2026,  1, [6,8,13,15,20,22,27,29], true],
  [2026,  2, [4,6,10,13,17,20,24,27], true],
  [2026,  3, [4,7,11,13,18,21,25,28], true],
];

let totalSales = 0, totalSched = 0, totalOrders = 0, totalShip = 0, totalExp = 0;

for (const [key, cid, uids, clients, notes, exps, orderItems, orderPrices] of COMPANIES_LIST) {
  console.log(`\n[${key}] 데이터 생성 중...`);

  // ── 과거 5개월 (완료 데이터) ──────────────────────────────
  for (const [y, m, days, hasOrder] of PAST_MONTHS) {
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const uid = uids[i % uids.length];
      const clie = clients[i % clients.length];
      const note = notes[i % notes.length];
      const visitDate = d(y, m, day, 10 + (i % 4), (i * 7) % 60);
      const price = i % 3 === 0 ? pick(orderPrices) : null;

      const saleId = await insertSale(cid, uid, clie, note, visitDate, price);
      totalSales++;

      // 일정: 2건/월 (방문 후 후속)
      if (i < 2) {
        const schedDay = Math.min(day + 7, 28);
        await insertSchedule(cid, uid, clie, saleId,
          `${CLIENT_NAMES[clie]} 후속 미팅`,
          d(y, m, schedDay, 14), "completed");
        totalSched++;
      }

      // 지출: 월 6건
      if (i < 6) {
        const exp = exps[i % exps.length];
        await insertExpense(cid, uid, exp, d(y, m, day + 1, 9, 30));
        totalExp++;
      }
    }

    // 수주 1건/월
    if (hasOrder) {
      const clie = clients[m % clients.length];
      const item = pick(orderItems);
      const price = pick(orderPrices);
      const ctrtDay = days[2];
      const expDay = Math.min(ctrtDay + 21, 28);
      const ctrt = d(y, m, ctrtDay);
      const expd = d(y, m, expDay);
      const shipDay = Math.min(expDay + 5, 28);

      const ordId = await insertOrder(cid, uids[0], clie, null, item, price, ctrt, expd, "confirmed");
      totalOrders++;

      await insertShipment(cid, uids[0], clie, ordId, price, d(y, m, shipDay), "paid");
      totalShip++;
    }
  }

  // ── 2026-04 이번 달 (04-01 ~ 04-08, 진행 중) ─────────────
  const aprilDays = [2, 4, 7];
  for (let i = 0; i < aprilDays.length; i++) {
    const uid = uids[i % uids.length];
    const clie = clients[(i + 2) % clients.length];
    const note = notes[(i + 3) % notes.length];
    const saleId = await insertSale(cid, uid, clie, note, d(2026, 4, aprilDays[i], 11), null);
    totalSales++;

    // 이번달 진행 중 일정 (scheduled)
    await insertSchedule(cid, uid, clie, saleId,
      `${CLIENT_NAMES[clie]} 미팅`,
      d(2026, 4, aprilDays[i] + 5, 14), "scheduled");
    totalSched++;
  }

  // 이번달 지출 3건
  for (let i = 0; i < 3; i++) {
    await insertExpense(cid, uids[0], exps[i % exps.length], d(2026, 4, 3 + i * 2, 10));
    totalExp++;
  }

  // ── 2026-05 미래 일정 (예정) ─────────────────────────────
  const maySchedules = [
    { day: 8,  name: `${CLIENT_NAMES[clients[0]]} 정기 미팅` },
    { day: 14, name: `${CLIENT_NAMES[clients[1]]} 계약 협의` },
    { day: 20, name: `${CLIENT_NAMES[clients[2]]} 현장 방문` },
    { day: 27, name: `${CLIENT_NAMES[clients[3] ?? clients[0]]} 후속 조치` },
  ];
  for (let mi = 0; mi < maySchedules.length; mi++) {
    const { day, name } = maySchedules[mi];
    const uid = uids[0];
    const clie = clients[mi % clients.length];
    await insertSchedule(cid, uid, clie, null, name, d(2026, 5, day, 14), "scheduled");
    totalSched++;
  }

  // 이번달 수주 1건 (확정)
  {
    const clie = clients[1];
    const item = pick(orderItems);
    const price = pick(orderPrices);
    const ordId = await insertOrder(cid, uids[0], clie, null, item, price,
      d(2026, 4, 5), d(2026, 5, 15), "confirmed");
    totalOrders++;
    // 납품 예정 (pending)
    await insertShipment(cid, uids[0], clie, ordId, price, d(2026, 5, 15), "pending");
    totalShip++;
  }

  console.log(`  [${key}] 완료`);
}

await conn.end();

console.log(`
═══════════════════════════════════════
완료!
  영업일지: ${totalSales}건
  일정:     ${totalSched}건
  수주:     ${totalOrders}건
  납품:     ${totalShip}건
  지출:     ${totalExp}건
═══════════════════════════════════════`);
