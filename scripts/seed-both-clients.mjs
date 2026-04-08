// scripts/seed-both-clients.mjs
// 겸용 거래처(매출+매입) 테스트 데이터 시드
// - 기존 sales 거래처 중 2곳을 clie_type='both'로 변경
// - 해당 거래처에서 매입한 것처럼 지출 데이터 추가
// - 매출(수주/납품) 이력은 이미 있는 것 활용

import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const now = new Date("2026-04-07T12:00:00+09:00");

function daysAgo(d) {
  const t = new Date(now);
  t.setDate(t.getDate() - d);
  t.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60));
  return t;
}

// ─── 현재 DB 상태 확인 ─────────────────────────────────────────────────────
// 거래처 목록 (매출처 중 수주 이력 있는 것)
const [clients] = await conn.execute(`
  SELECT c.clie_idno, c.clie_name, c.clie_type, c.comp_idno,
         COUNT(DISTINCT o.orde_idno) AS order_cnt,
         COUNT(DISTINCT s.ship_idno) AS ship_cnt
  FROM COAPP_CRM_CLIENT c
  LEFT JOIN COAPP_CRM_ORDER o ON o.clie_idno = c.clie_idno AND o.enab_yesn = 1
  LEFT JOIN COAPP_CRM_SHIPMENT s ON s.clie_idno = c.clie_idno AND s.enab_yesn = 1
  WHERE c.enab_yesn = 1 AND c.clie_type = 'sales'
  GROUP BY c.clie_idno
  HAVING order_cnt > 0
  ORDER BY order_cnt DESC
  LIMIT 3
`);

if (!clients.length) {
  console.log("❌ 수주 이력이 있는 매출처가 없습니다. 먼저 기본 시드 데이터를 넣어주세요.");
  await conn.end();
  process.exit(1);
}

console.log("\n📋 겸용으로 전환할 거래처:");
clients.forEach(c => console.log(`  - [${c.clie_idno}] ${c.clie_name} (수주 ${c.order_cnt}건, 납품 ${c.ship_cnt}건)`));

// 상위 2곳을 겸용으로 전환
const targets = clients.slice(0, 2);

// ─── 회사 유저 조회 (지출 등록용) ─────────────────────────────────────────
const compIdno = targets[0].comp_idno;
const [users] = await conn.execute(
  `SELECT cu.user_idno FROM COAPP_COMPANY_USER cu WHERE cu.comp_idno = ? AND cu.enab_yesn = 1 LIMIT 3`,
  [compIdno]
);
const userIds = users.map(u => u.user_idno);
const uid = () => userIds[Math.floor(Math.random() * userIds.length)];

// ─── 1. clie_type → 'both' 업데이트 ──────────────────────────────────────
for (const c of targets) {
  await conn.execute(
    `UPDATE COAPP_CRM_CLIENT SET clie_type = 'both', modi_date = NOW() WHERE clie_idno = ?`,
    [c.clie_idno]
  );
  console.log(`\n✅ ${c.clie_name} → clie_type='both' 변경`);
}

// ─── 2. 매입 지출 데이터 추가 ─────────────────────────────────────────────
// 각 겸용 거래처에서 "우리가 구매한" 매입 지출 이력 생성
const PURCHASE_TEMPLATES = {
  // 첫 번째 거래처: IT/소프트웨어 계열 느낌 (구독/라이선스/개발 외주)
  0: [
    { name: "개발 외주 용역비",         categ: "외주비",     amnt: 3200000,  meth: "transfer", type: "invoice", dAgo: 5  },
    { name: "소프트웨어 라이선스 구입", categ: "소프트웨어", amnt: 850000,   meth: "card",     type: "invoice", dAgo: 12 },
    { name: "UI 디자인 외주",           categ: "외주비",     amnt: 1800000,  meth: "transfer", type: "invoice", dAgo: 18 },
    { name: "클라우드 서비스 이용료",   categ: "소프트웨어", amnt: 420000,   meth: "card",     type: "invoice", dAgo: 25 },
    { name: "개발 외주 용역비 (2월)",   categ: "외주비",     amnt: 2900000,  meth: "transfer", type: "invoice", dAgo: 42 },
    { name: "유지보수 계약 (분기)",     categ: "외주비",     amnt: 1500000,  meth: "transfer", type: "invoice", dAgo: 55 },
    { name: "소프트웨어 업그레이드",    categ: "소프트웨어", amnt: 650000,   meth: "card",     type: "invoice", dAgo: 68 },
    { name: "API 연동 개발 외주",       categ: "외주비",     amnt: 2100000,  meth: "transfer", type: "invoice", dAgo: 75 },
  ],
  // 두 번째 거래처: 제조/유통 계열 느낌 (원자재/부품 매입)
  1: [
    { name: "원자재 구매 (1차)",        categ: "매입",       amnt: 5400000,  meth: "transfer", type: "invoice", dAgo: 3  },
    { name: "부품 납품 대금",           categ: "매입",       amnt: 2800000,  meth: "transfer", type: "invoice", dAgo: 9  },
    { name: "포장재 일괄 구매",         categ: "매입",       amnt: 780000,   meth: "card",     type: "receipt", dAgo: 15 },
    { name: "원자재 구매 (2차)",        categ: "매입",       amnt: 4100000,  meth: "transfer", type: "invoice", dAgo: 28 },
    { name: "부품 단가 계약 매입",      categ: "매입",       amnt: 3300000,  meth: "transfer", type: "invoice", dAgo: 35 },
    { name: "특수 소재 구입",           categ: "매입",       amnt: 1950000,  meth: "transfer", type: "invoice", dAgo: 47 },
    { name: "원자재 구매 (3차)",        categ: "매입",       amnt: 6200000,  meth: "transfer", type: "invoice", dAgo: 60 },
    { name: "물류/납품 비용",           categ: "물류",       amnt: 450000,   meth: "card",     type: "receipt", dAgo: 72 },
  ],
};

for (let i = 0; i < targets.length; i++) {
  const c = targets[i];
  const items = PURCHASE_TEMPLATES[i] ?? PURCHASE_TEMPLATES[0];

  console.log(`\n📦 ${c.clie_name} 매입 지출 ${items.length}건 추가 중...`);

  for (const item of items) {
    await conn.execute(
      `INSERT INTO COAPP_CRM_EXPENSE
        (comp_idno, clie_idno, clie_name, expe_name, expe_date, expe_amnt, expe_type, paym_meth,
         recr_type, ai_categ, enab_yesn, crea_idno, crea_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'none', ?, 1, ?, NOW())`,
      [compIdno, c.clie_idno, c.clie_name, item.name, daysAgo(item.dAgo), item.amnt, item.type, item.meth, item.categ, uid()]
    );
  }
  console.log(`  ✅ 완료`);
}

// ─── 3. 결과 요약 ─────────────────────────────────────────────────────────
console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("✅ 겸용 거래처 시드 완료");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
for (let i = 0; i < targets.length; i++) {
  const c = targets[i];
  const items = PURCHASE_TEMPLATES[i] ?? PURCHASE_TEMPLATES[0];
  console.log(`\n📌 ${c.clie_name}`);
  console.log(`   타입: sales → both`);
  console.log(`   기존 매출(수주): ${c.order_cnt}건`);
  console.log(`   매입 지출 추가: ${items.length}건`);
}
console.log("\n💡 이제 거래처 상세에서 매출/매입 탭을 모두 확인할 수 있습니다.");

await conn.end();
