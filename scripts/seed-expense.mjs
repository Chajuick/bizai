/**
 * 테스트 지출 데이터 삽입 스크립트
 * Usage: node scripts/seed-expense.mjs
 */
import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 회사 & 사용자 확인
const [[company]] = await conn.execute("SELECT comp_idno FROM COAPP_CORE_COMPANY LIMIT 1");
const [[user]] = await conn.execute("SELECT user_idno FROM COAPP_CORE_USER LIMIT 1");

if (!company || !user) {
  console.error("No company or user found.");
  process.exit(1);
}

const comp_idno = company.comp_idno;
const user_idno = user.user_idno;
console.log(`comp_idno=${comp_idno}, user_idno=${user_idno}`);

// 거래처 조회 (있으면 연결)
const [clients] = await conn.execute(
  "SELECT clie_idno, clie_name FROM COAPP_CRM_CLIENT WHERE comp_idno = ? LIMIT 5",
  [comp_idno]
);

const pickClient = (i) => clients[i % clients.length] ?? null;

const now = new Date();
const d = (daysAgo) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() - daysAgo);
  return dt.toISOString().slice(0, 19).replace("T", " ");
};

const expenses = [
  {
    clie: pickClient(0),
    expe_name: "점심 식대",
    expe_date: d(1),
    expe_amnt: "28000.00",
    expe_type: "receipt",
    paym_meth: "card",
    recr_type: "none",
    ai_categ: "식비",
    ai_vendor: "한솥도시락",
    expe_memo: "팀 점심 미팅",
  },
  {
    clie: pickClient(1),
    expe_name: "사무용품 구매",
    expe_date: d(3),
    expe_amnt: "45000.00",
    expe_type: "receipt",
    paym_meth: "card",
    recr_type: "none",
    ai_categ: "사무용품",
    ai_vendor: "교보문고 핫트랙스",
    expe_memo: "볼펜, 메모지 등",
  },
  {
    clie: pickClient(0),
    expe_name: "클라우드 서버 비용",
    expe_date: d(5),
    expe_amnt: "120000.00",
    expe_type: "invoice",
    paym_meth: "transfer",
    recr_type: "monthly",
    recr_ends: null,
    ai_categ: "IT 인프라",
    ai_vendor: "AWS Korea",
    expe_memo: "EC2 + RDS 월 사용료",
  },
  {
    clie: null,
    expe_name: "교통비 (택시)",
    expe_date: d(2),
    expe_amnt: "18500.00",
    expe_type: "receipt",
    paym_meth: "card",
    recr_type: "none",
    ai_categ: "교통비",
    ai_vendor: "카카오택시",
    expe_memo: "고객사 방문",
  },
  {
    clie: pickClient(1),
    expe_name: "거래처 접대비",
    expe_date: d(7),
    expe_amnt: "210000.00",
    expe_type: "receipt",
    paym_meth: "card",
    recr_type: "none",
    ai_categ: "접대비",
    ai_vendor: "강남 한식당",
    expe_memo: "신규 계약 체결 후 저녁",
  },
  {
    clie: null,
    expe_name: "소프트웨어 라이선스",
    expe_date: d(10),
    expe_amnt: "330000.00",
    expe_type: "invoice",
    paym_meth: "transfer",
    recr_type: "yearly",
    recr_ends: null,
    ai_categ: "소프트웨어",
    ai_vendor: "Adobe Inc.",
    expe_memo: "Creative Cloud 연간 구독",
  },
  {
    clie: null,
    expe_name: "사무실 커피 구독",
    expe_date: d(0),
    expe_amnt: "59000.00",
    expe_type: "receipt",
    paym_meth: "card",
    recr_type: "monthly",
    recr_ends: null,
    ai_categ: "복리후생",
    ai_vendor: "네스프레소",
    expe_memo: "캡슐 정기배송",
  },
  {
    clie: pickClient(2),
    expe_name: "출장 교통비",
    expe_date: d(14),
    expe_amnt: "52000.00",
    expe_type: "receipt",
    paym_meth: "cash",
    recr_type: "none",
    ai_categ: "교통비",
    ai_vendor: "코레일",
    expe_memo: "부산 출장 KTX",
  },
];

let inserted = 0;
for (const e of expenses) {
  await conn.execute(
    `INSERT INTO COAPP_CRM_EXPENSE
      (comp_idno, clie_idno, clie_name, expe_name, expe_date, expe_amnt,
       expe_type, paym_meth, recr_type, recr_ends, ai_categ, ai_vendor, expe_memo,
       enab_yesn, crea_idno, crea_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, ?, NOW())`,
    [
      comp_idno,
      e.clie?.clie_idno ?? null,
      e.clie?.clie_name ?? null,
      e.expe_name,
      e.expe_date,
      e.expe_amnt,
      e.expe_type,
      e.paym_meth,
      e.recr_type,
      e.recr_ends ?? null,
      e.ai_categ,
      e.ai_vendor,
      e.expe_memo,
      user_idno,
    ]
  );
  inserted++;
  console.log(`  ✓ ${e.expe_name} (${e.expe_amnt}원)`);
}

console.log(`\n${inserted}건 삽입 완료.`);
await conn.end();
