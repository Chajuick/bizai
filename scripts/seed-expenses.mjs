// scripts/seed-expenses.mjs
// 테스트용 지출 데이터 시드 (최근 3개월 중심)

import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 오늘: 2026-04-07
const now = new Date("2026-04-07T12:00:00+09:00");

function daysAgo(d) {
  const t = new Date(now);
  t.setDate(t.getDate() - d);
  // 시간 약간 랜덤
  t.setHours(8 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60));
  return t;
}

// 공통 지출 항목 (탕비실/사무용품/식대/교통비)
const COMMON = [
  // 탕비실
  { name: "탕비실 커피/음료 구입",    categ: "탕비실",   amnt: 45000,  meth: "card",     type: "receipt" },
  { name: "탕비실 과자/간식 구입",    categ: "탕비실",   amnt: 32000,  meth: "card",     type: "receipt" },
  { name: "생수 정기 배달",            categ: "탕비실",   amnt: 28000,  meth: "transfer", type: "receipt" },
  { name: "종이컵/냅킨 구입",          categ: "사무용품", amnt: 15000,  meth: "card",     type: "receipt" },
  // 식대
  { name: "팀 점심 식대",              categ: "식비",     amnt: 68000,  meth: "card",     type: "receipt" },
  { name: "점심 식대",                 categ: "식비",     amnt: 52000,  meth: "card",     type: "receipt" },
  { name: "회의 다과",                 categ: "식비",     amnt: 41000,  meth: "card",     type: "receipt" },
  { name: "외부 미팅 커피",            categ: "식비",     amnt: 22500,  meth: "card",     type: "receipt" },
  // 교통비
  { name: "택시비",                    categ: "교통비",   amnt: 18400,  meth: "card",     type: "receipt" },
  { name: "고속도로 통행료",           categ: "교통비",   amnt: 9800,   meth: "card",     type: "receipt" },
  { name: "지하철/버스",               categ: "교통비",   amnt: 3200,   meth: "card",     type: "receipt" },
  { name: "KTX 출장",                  categ: "교통비",   amnt: 56000,  meth: "card",     type: "receipt" },
  // 사무용품
  { name: "A4 용지 구입",              categ: "사무용품", amnt: 24000,  meth: "card",     type: "receipt" },
  { name: "볼펜/필기류",               categ: "사무용품", amnt: 8500,   meth: "cash",     type: "receipt" },
  { name: "프린터 잉크",               categ: "사무용품", amnt: 35000,  meth: "card",     type: "receipt" },
];

// 회사별 특화 지출
const COMPANY_EXPENSES = {
  // 한국산업기계(주) — 제조/산업기계
  5: {
    users: [15, 16, 17],
    items: [
      { name: "기계 부품 구매 (모터)",       categ: "매입",       amnt: 380000,   meth: "transfer", type: "invoice" },
      { name: "유압 실린더 부품",             categ: "매입",       amnt: 520000,   meth: "transfer", type: "invoice" },
      { name: "공구 및 소모품",               categ: "소모품",     amnt: 145000,   meth: "card",     type: "receipt" },
      { name: "작업복 구입",                  categ: "복리후생",   amnt: 280000,   meth: "card",     type: "receipt" },
      { name: "산업용 윤활유",                categ: "소모품",     amnt: 95000,    meth: "card",     type: "receipt" },
      { name: "볼트/너트 부품",               categ: "소모품",     amnt: 42000,    meth: "cash",     type: "receipt" },
      { name: "작업장 청소 용역",             categ: "청소비",     amnt: 350000,   meth: "transfer", type: "invoice" },
      { name: "안전장갑/보호대",              categ: "안전용품",   amnt: 76000,    meth: "card",     type: "receipt" },
      { name: "차량 주유비",                  categ: "교통비",     amnt: 87000,    meth: "card",     type: "receipt" },
      { name: "설계 소프트웨어 구독",         categ: "소프트웨어", amnt: 220000,   meth: "card",     type: "invoice" },
      { name: "용접 소모품",                  categ: "소모품",     amnt: 63000,    meth: "cash",     type: "receipt" },
    ],
  },
  // 넥스트솔루션(주) — IT/소프트웨어
  6: {
    users: [18, 19, 20, 21],
    items: [
      { name: "AWS 클라우드 요금",            categ: "인프라",     amnt: 1240000,  meth: "card",     type: "invoice" },
      { name: "GitHub Teams 구독",           categ: "소프트웨어", amnt: 124000,   meth: "card",     type: "invoice" },
      { name: "Slack Pro 구독",              categ: "소프트웨어", amnt: 89000,    meth: "card",     type: "invoice" },
      { name: "노션 팀플랜",                  categ: "소프트웨어", amnt: 96000,    meth: "card",     type: "invoice" },
      { name: "Adobe CC 라이선스",            categ: "소프트웨어", amnt: 280000,   meth: "card",     type: "invoice" },
      { name: "사무실 인터넷 요금",           categ: "통신비",     amnt: 110000,   meth: "transfer", type: "invoice" },
      { name: "사무실 전화요금",              categ: "통신비",     amnt: 45000,    meth: "transfer", type: "invoice" },
      { name: "모니터 구입",                  categ: "장비",       amnt: 480000,   meth: "card",     type: "receipt" },
      { name: "키보드/마우스",                categ: "장비",       amnt: 128000,   meth: "card",     type: "receipt" },
      { name: "외부 교육 세미나",             categ: "교육비",     amnt: 330000,   meth: "card",     type: "receipt" },
      { name: "개발자 컨퍼런스 참가비",       categ: "교육비",     amnt: 550000,   meth: "transfer", type: "invoice" },
      { name: "사무실 청소 용역",             categ: "청소비",     amnt: 200000,   meth: "transfer", type: "invoice" },
    ],
  },
  // 더스페이스디자인 — 디자인/인테리어
  7: {
    users: [22, 23],
    items: [
      { name: "인테리어 자재 구입",           categ: "매입",       amnt: 1850000,  meth: "transfer", type: "invoice" },
      { name: "샘플 자재비",                  categ: "소모품",     amnt: 245000,   meth: "card",     type: "receipt" },
      { name: "디자인 소프트웨어 구독",       categ: "소프트웨어", amnt: 165000,   meth: "card",     type: "invoice" },
      { name: "인쇄/출력 비용",               categ: "인쇄비",     amnt: 87000,    meth: "card",     type: "receipt" },
      { name: "포스터/현수막 제작",           categ: "인쇄비",     amnt: 320000,   meth: "card",     type: "receipt" },
      { name: "차량 주유비",                  categ: "교통비",     amnt: 65000,    meth: "card",     type: "receipt" },
      { name: "현장 출장비",                  categ: "교통비",     amnt: 43000,    meth: "cash",     type: "receipt" },
      { name: "사무실 청소 용역",             categ: "청소비",     amnt: 150000,   meth: "transfer", type: "invoice" },
      { name: "스케치북/도화지",              categ: "소모품",     amnt: 18000,    meth: "cash",     type: "receipt" },
      { name: "마카/색연필 소모품",           categ: "소모품",     amnt: 35000,    meth: "card",     type: "receipt" },
    ],
  },
  // 청원식자재유통(주) — 식자재 유통
  8: {
    users: [24],
    items: [
      { name: "채소류 매입 (도매)",           categ: "매입",       amnt: 2300000,  meth: "transfer", type: "invoice" },
      { name: "육류 매입",                    categ: "매입",       amnt: 4500000,  meth: "transfer", type: "invoice" },
      { name: "수산물 매입",                  categ: "매입",       amnt: 1800000,  meth: "transfer", type: "invoice" },
      { name: "포장재 구입 (박스)",           categ: "소모품",     amnt: 380000,   meth: "card",     type: "receipt" },
      { name: "비닐팩/스티로폼",             categ: "소모품",     amnt: 145000,   meth: "card",     type: "receipt" },
      { name: "냉동/냉장 보관료",             categ: "물류",       amnt: 520000,   meth: "transfer", type: "invoice" },
      { name: "배송 차량 주유비",             categ: "교통비",     amnt: 175000,   meth: "card",     type: "receipt" },
      { name: "차량 유지보수",                categ: "차량비",     amnt: 280000,   meth: "card",     type: "receipt" },
      { name: "창고 청소 용역",               categ: "청소비",     amnt: 400000,   meth: "transfer", type: "invoice" },
      { name: "위생용품 구입",                categ: "소모품",     amnt: 65000,    meth: "card",     type: "receipt" },
      { name: "식품 안전 교육",               categ: "교육비",     amnt: 150000,   meth: "transfer", type: "invoice" },
    ],
  },
  // 에코클린서비스 — 청소/환경
  9: {
    users: [25, 26],
    items: [
      { name: "업소용 세제 매입",             categ: "매입",       amnt: 580000,   meth: "transfer", type: "invoice" },
      { name: "청소용 걸레/도구 매입",        categ: "매입",       amnt: 320000,   meth: "card",     type: "receipt" },
      { name: "청소기/장비 소모품",           categ: "소모품",     amnt: 145000,   meth: "card",     type: "receipt" },
      { name: "차량 주유비 (청소차)",         categ: "교통비",     amnt: 210000,   meth: "card",     type: "receipt" },
      { name: "보호장갑/안전용품",            categ: "안전용품",   amnt: 95000,    meth: "card",     type: "receipt" },
      { name: "작업복/유니폼",               categ: "복리후생",   amnt: 380000,   meth: "card",     type: "receipt" },
      { name: "고압세척기 부품",              categ: "소모품",     amnt: 185000,   meth: "card",     type: "receipt" },
      { name: "소독/방역 약품",               categ: "매입",       amnt: 430000,   meth: "transfer", type: "invoice" },
      { name: "쓰레기봉투 대량 구입",         categ: "소모품",     amnt: 72000,    meth: "cash",     type: "receipt" },
      { name: "차량 유지보수",                categ: "차량비",     amnt: 350000,   meth: "card",     type: "receipt" },
    ],
  },
  // 유니폼플러스 — 유니폼 제조/유통
  10: {
    users: [27, 28],
    items: [
      { name: "원단 매입 (폴리에스터)",       categ: "매입",       amnt: 2800000,  meth: "transfer", type: "invoice" },
      { name: "원단 매입 (면)",               categ: "매입",       amnt: 1500000,  meth: "transfer", type: "invoice" },
      { name: "부자재 (지퍼/단추)",           categ: "소모품",     amnt: 245000,   meth: "card",     type: "receipt" },
      { name: "자수/인쇄 외주",               categ: "외주비",     amnt: 680000,   meth: "transfer", type: "invoice" },
      { name: "포장재/비닐백",               categ: "소모품",     amnt: 180000,   meth: "card",     type: "receipt" },
      { name: "택배 발송비",                  categ: "물류",       amnt: 320000,   meth: "card",     type: "receipt" },
      { name: "재봉틀 소모품",                categ: "소모품",     amnt: 95000,    meth: "cash",     type: "receipt" },
      { name: "사무실 임차료",                categ: "임차료",     amnt: 1200000,  meth: "transfer", type: "invoice" },
      { name: "전시회 참가비",                categ: "영업비",     amnt: 450000,   meth: "card",     type: "receipt" },
      { name: "창고 청소 용역",               categ: "청소비",     amnt: 180000,   meth: "transfer", type: "invoice" },
    ],
  },
};

const rows = [];

for (const [compId, { users, items }] of Object.entries(COMPANY_EXPENSES)) {
  const cid = Number(compId);

  // ─── 최근 30일: 공통(탕비실/식대/교통비) + 회사 특화 반반 ───
  const recent30 = [];

  // 공통 소액 지출: 20~28건
  const commonCount = 20 + Math.floor(Math.random() * 8);
  for (let i = 0; i < commonCount; i++) {
    const item = COMMON[Math.floor(Math.random() * COMMON.length)];
    const uid = users[Math.floor(Math.random() * users.length)];
    const dAgo = Math.floor(Math.random() * 30); // 0~29일 전
    // 금액 ±20% 랜덤
    const amnt = Math.round(item.amnt * (0.8 + Math.random() * 0.4) / 100) * 100;
    recent30.push({ comp_idno: cid, crea_idno: uid, expe_date: daysAgo(dAgo), expe_name: item.name, expe_amnt: amnt, expe_type: item.type, paym_meth: item.meth, ai_categ: item.categ });
  }

  // 회사 특화 지출: 최근 30일 중 8~12건
  const shuffled = [...items].sort(() => Math.random() - 0.5).slice(0, 8 + Math.floor(Math.random() * 4));
  for (const item of shuffled) {
    const uid = users[Math.floor(Math.random() * users.length)];
    const dAgo = Math.floor(Math.random() * 30);
    const amnt = Math.round(item.amnt * (0.85 + Math.random() * 0.3) / 100) * 100;
    recent30.push({ comp_idno: cid, crea_idno: uid, expe_date: daysAgo(dAgo), expe_name: item.name, expe_amnt: amnt, expe_type: item.type, paym_meth: item.meth, ai_categ: item.categ });
  }

  rows.push(...recent30);

  // ─── 31~90일: 회사 특화 + 공통 섞어서 15~20건 ───
  const older = [];
  for (let i = 0; i < 15 + Math.floor(Math.random() * 6); i++) {
    const pool = [...items, ...COMMON];
    const item = pool[Math.floor(Math.random() * pool.length)];
    const uid = users[Math.floor(Math.random() * users.length)];
    const dAgo = 31 + Math.floor(Math.random() * 59);
    const amnt = Math.round(item.amnt * (0.8 + Math.random() * 0.4) / 100) * 100;
    older.push({ comp_idno: cid, crea_idno: uid, expe_date: daysAgo(dAgo), expe_name: item.name, expe_amnt: amnt, expe_type: item.type, paym_meth: item.meth, ai_categ: item.categ });
  }

  rows.push(...older);
}

console.log(`총 ${rows.length}건 삽입 예정`);

// Insert
for (const r of rows) {
  await conn.execute(
    `INSERT INTO COAPP_CRM_EXPENSE (comp_idno, expe_name, expe_date, expe_amnt, expe_type, paym_meth, recr_type, ai_categ, enab_yesn, crea_idno, crea_date)
     VALUES (?, ?, ?, ?, ?, ?, 'none', ?, 1, ?, NOW())`,
    [r.comp_idno, r.expe_name, r.expe_date, r.expe_amnt, r.expe_type, r.paym_meth, r.ai_categ, r.crea_idno]
  );
}

console.log("✅ 완료");
await conn.end();
