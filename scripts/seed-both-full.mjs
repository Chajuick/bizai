// scripts/seed-both-full.mjs
// 각 계정(company)별 겸용 거래처 생성 + 전체 이력 시드
// - clie_type='both' 거래처 1~2개 생성
// - 영업일지(SALE) → 일정(SCHEDULE) → 수주(ORDER) → 납품(SHIPMENT) 체인
// - 지출(EXPENSE) 매입 이력

import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const NOW = new Date("2026-04-07T12:00:00+09:00");

// ─── 유틸 ─────────────────────────────────────────────────────────────────────
function daysAgo(d, hour = null) {
  const t = new Date(NOW);
  t.setDate(t.getDate() - d);
  t.setHours(hour ?? (9 + Math.floor(Math.random() * 8)), Math.floor(Math.random() * 60));
  return t;
}

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function insert(table, data) {
  const cols = Object.keys(data).join(", ");
  const vals = Object.values(data);
  const phs  = vals.map(() => "?").join(", ");
  const [res] = await conn.execute(`INSERT INTO ${table} (${cols}) VALUES (${phs})`, vals);
  return res.insertId;
}

// ─── 회사/유저 목록 조회 ──────────────────────────────────────────────────────
const [compRows] = await conn.execute(`SELECT comp_idno FROM COAPP_CORE_COMPANY`);
const [userRows] = await conn.execute(`
  SELECT cu.comp_idno, cu.user_idno
  FROM COAPP_CORE_COMPANY_USER cu
  WHERE cu.memb_stat = 'active'
  ORDER BY cu.comp_idno, cu.comp_role DESC
`);

// comp별 유저 맵
const compUsers = {};
for (const r of userRows) {
  (compUsers[r.comp_idno] ??= []).push(r.user_idno);
}

// ─── 겸용 거래처 데이터 정의 (2개) ───────────────────────────────────────────
const BOTH_CLIENTS = [
  {
    name: "테크브릿지솔루션(주)",
    indu: "IT 서비스/소프트웨어",
    addr: "서울시 강남구 테헤란로 152",
    memo: "매출: IT 솔루션 납품 / 매입: 개발 외주 및 라이선스 구매",
    // 매출 체인
    salesChain: [
      {
        saleInfo: {
          dAgo: 90, loc: "서울 강남 미팅룸",
          memo: "CRM 솔루션 도입 초기 미팅. 현재 엑셀 기반으로 운영 중이며 고객사 요청으로 시스템 전환 검토 중. 담당자 이창호 차장이 적극적으로 관심 표현.",
          summ: "CRM 솔루션 도입 검토 미팅. 시스템 전환 관심 높음.",
        },
        scheInfo: { dAgo: 80, name: "CRM 시스템 요구사항 분석 미팅", pric: 28000000, stat: "completed" },
        orderInfo: { dAgo: 72, prod: "CRM 시스템 구축 프로젝트", pric: 28000000, stat: "confirmed", ctrt: true },
        shipments: [
          { dAgo: 50, pric: 11200000, stat: "paid",      memo: "1차 개발 완료 납품" },
          { dAgo: 20, pric: 11200000, stat: "invoiced",  memo: "2차 개발 완료 납품" },
          { dAgo: 5,  pric: 5600000,  stat: "pending",   memo: "최종 검수 납품 예정" },
        ],
      },
      {
        saleInfo: {
          dAgo: 45, loc: "화상 미팅",
          memo: "모바일 앱 추가 개발 건으로 미팅. 기존 CRM 연동 필요. 예산 약 1,500만원 내외 희망.",
          summ: "모바일 앱 추가 개발 미팅. CRM 연동 요구사항 확인.",
        },
        scheInfo: { dAgo: 38, name: "모바일 앱 견적 협의", pric: 15000000, stat: "completed" },
        orderInfo: { dAgo: 30, prod: "모바일 CRM 앱 개발", pric: 15000000, stat: "negotiation", ctrt: false },
        shipments: [],
      },
    ],
    // 매입 지출
    expenses: [
      { dAgo: 75,  name: "UI/UX 외주 디자인 (1차)",  categ: "외주비",     amnt: 3500000,  meth: "transfer", type: "invoice" },
      { dAgo: 60,  name: "React 컴포넌트 라이브러리", categ: "소프트웨어", amnt: 980000,   meth: "card",     type: "invoice" },
      { dAgo: 52,  name: "백엔드 API 개발 외주",       categ: "외주비",     amnt: 4200000,  meth: "transfer", type: "invoice" },
      { dAgo: 40,  name: "AWS 인프라 비용 (1월)",      categ: "인프라",     amnt: 1240000,  meth: "card",     type: "invoice" },
      { dAgo: 28,  name: "UI/UX 외주 디자인 (2차)",  categ: "외주비",     amnt: 2800000,  meth: "transfer", type: "invoice" },
      { dAgo: 20,  name: "QA 테스트 외주",             categ: "외주비",     amnt: 1600000,  meth: "transfer", type: "invoice" },
      { dAgo: 12,  name: "소프트웨어 보안 감사",       categ: "외주비",     amnt: 2200000,  meth: "transfer", type: "invoice" },
      { dAgo: 5,   name: "AWS 인프라 비용 (3월)",      categ: "인프라",     amnt: 1380000,  meth: "card",     type: "invoice" },
    ],
  },
  {
    name: "한울산업자재(주)",
    indu: "산업자재/제조",
    addr: "경기도 안산시 단원구 공단로 78",
    memo: "매출: 산업기계 부품 납품 / 매입: 원자재 및 소재 구매",
    salesChain: [
      {
        saleInfo: {
          dAgo: 100, loc: "경기 안산 공장 방문",
          memo: "유압 실린더 부품 납품 건 초기 상담. 공장 생산라인 직접 방문하여 스펙 확인. 월 300개 이상 납품 가능 여부 확인 요청.",
          summ: "유압 실린더 부품 납품 건 상담. 스펙 확인 및 월 납품 수량 논의.",
        },
        scheInfo: { dAgo: 88, name: "유압 부품 샘플 납품 및 검수", pric: 18000000, stat: "completed" },
        orderInfo: { dAgo: 78, prod: "유압 실린더 부품 연간 공급 계약", pric: 18000000, stat: "confirmed", ctrt: true },
        shipments: [
          { dAgo: 65, pric: 6000000,  stat: "paid",      memo: "1분기 1차 납품 (100개)" },
          { dAgo: 35, pric: 6000000,  stat: "paid",      memo: "1분기 2차 납품 (100개)" },
          { dAgo: 8,  pric: 6000000,  stat: "delivered", memo: "1분기 3차 납품 (100개)" },
        ],
      },
      {
        saleInfo: {
          dAgo: 55, loc: "서울 영업소",
          memo: "고압 밸브 신규 납품 건 미팅. 기존 거래처에서 품질 문제로 교체 검토 중. 자사 제품 샘플 제공 및 기술 스펙 설명.",
          summ: "고압 밸브 신규 납품 미팅. 기존 거래처 교체 수요 확인.",
        },
        scheInfo: { dAgo: 48, name: "고압 밸브 기술 스펙 협의", pric: 9500000, stat: "completed" },
        orderInfo: { dAgo: 40, prod: "고압 밸브 공급 계약 (상반기)", pric: 9500000, stat: "confirmed", ctrt: true },
        shipments: [
          { dAgo: 25, pric: 4750000,  stat: "invoiced",  memo: "1차 납품 (50units)" },
          { dAgo: 3,  pric: 4750000,  stat: "pending",   memo: "2차 납품 예정" },
        ],
      },
    ],
    expenses: [
      { dAgo: 95,  name: "스테인리스 원자재 구매 (1차)", categ: "원자재",   amnt: 7200000,  meth: "transfer", type: "invoice" },
      { dAgo: 80,  name: "특수강 소재 구매",              categ: "원자재",   amnt: 4800000,  meth: "transfer", type: "invoice" },
      { dAgo: 65,  name: "스테인리스 원자재 구매 (2차)", categ: "원자재",   amnt: 6900000,  meth: "transfer", type: "invoice" },
      { dAgo: 50,  name: "가공 외주 (선반/밀링)",         categ: "외주비",   amnt: 3200000,  meth: "transfer", type: "invoice" },
      { dAgo: 42,  name: "표면처리 외주",                 categ: "외주비",   amnt: 1800000,  meth: "transfer", type: "invoice" },
      { dAgo: 30,  name: "스테인리스 원자재 구매 (3차)", categ: "원자재",   amnt: 7500000,  meth: "transfer", type: "invoice" },
      { dAgo: 18,  name: "포장재 구입",                   categ: "소모품",   amnt: 650000,   meth: "card",     type: "receipt" },
      { dAgo: 8,   name: "가공 외주 (2차)",               categ: "외주비",   amnt: 2900000,  meth: "transfer", type: "invoice" },
    ],
  },
];

// ─── 각 계정에 시드 ───────────────────────────────────────────────────────────
let totalClients = 0, totalSales = 0, totalScheds = 0, totalOrders = 0, totalShips = 0, totalExpenses = 0;

for (const { comp_idno } of compRows) {
  const users = compUsers[comp_idno];
  if (!users || users.length === 0) continue;

  const uid = () => rand(users);
  const owne = users[0]; // 첫 번째 유저(보통 owner)

  console.log(`\n━━━ comp_idno=${comp_idno} (유저 ${users.length}명) ━━━`);

  for (const tpl of BOTH_CLIENTS) {
    // 1. 겸용 거래처 생성
    const clieId = await insert("COAPP_CRM_CLIENT", {
      comp_idno, clie_name: tpl.name, indu_type: tpl.indu,
      clie_addr: tpl.addr, clie_memo: tpl.memo,
      clie_type: "both", enab_yesn: 1,
      crea_idno: owne, crea_date: daysAgo(110),
    });
    console.log(`  ✅ 거래처 생성: [${clieId}] ${tpl.name}`);
    totalClients++;

    // 2. 매출 체인
    for (const chain of tpl.salesChain) {
      const { saleInfo, scheInfo, orderInfo, shipments } = chain;

      // 영업일지
      const saleId = await insert("COAPP_CRM_SALE", {
        comp_idno, owne_idno: owne,
        clie_idno: clieId, clie_name: tpl.name,
        sale_loca: saleInfo.loc,
        vist_date: daysAgo(saleInfo.dAgo),
        orig_memo: saleInfo.memo,
        aiex_summ: saleInfo.summ,
        aiex_done: 1, aiex_stat: "completed",
        enab_yesn: 1, crea_idno: uid(), crea_date: daysAgo(saleInfo.dAgo + 0.1),
      });
      totalSales++;

      // 일정
      const scheId = await insert("COAPP_CRM_SCHEDULE", {
        comp_idno, owne_idno: owne,
        sale_idno: saleId,
        clie_idno: clieId, clie_name: tpl.name,
        sche_name: scheInfo.name,
        sche_pric: scheInfo.pric,
        sche_date: daysAgo(scheInfo.dAgo),
        sche_stat: scheInfo.stat,
        enab_yesn: 1, crea_idno: uid(), crea_date: daysAgo(scheInfo.dAgo + 0.5),
      });
      totalScheds++;

      // 수주
      const ordeId = await insert("COAPP_CRM_ORDER", {
        comp_idno, owne_idno: owne,
        clie_idno: clieId, clie_name: tpl.name,
        sale_idno: orderInfo.stat !== "proposal" ? saleId : null,
        sche_idno: scheId,
        prod_serv: orderInfo.prod,
        orde_pric: orderInfo.pric,
        orde_stat: orderInfo.stat,
        ctrt_date: orderInfo.ctrt ? daysAgo(orderInfo.dAgo) : null,
        enab_yesn: 1, crea_idno: uid(), crea_date: daysAgo(orderInfo.dAgo),
      });
      totalOrders++;

      // 납품
      for (const s of shipments) {
        await insert("COAPP_CRM_SHIPMENT", {
          comp_idno, owne_idno: owne,
          orde_idno: ordeId,
          clie_idno: clieId, clie_name: tpl.name,
          ship_stat: s.stat,
          ship_date: daysAgo(s.dAgo),
          ship_pric: s.pric,
          ship_memo: s.memo,
          enab_yesn: 1, crea_idno: uid(), crea_date: daysAgo(s.dAgo),
        });
        totalShips++;
      }
    }

    // 3. 매입 지출
    for (const e of tpl.expenses) {
      await insert("COAPP_CRM_EXPENSE", {
        comp_idno,
        clie_idno: clieId, clie_name: tpl.name,
        expe_name: e.name,
        expe_date: daysAgo(e.dAgo),
        expe_amnt: e.amnt,
        expe_type: e.type,
        paym_meth: e.meth,
        recr_type: "none",
        ai_categ: e.categ,
        enab_yesn: 1, crea_idno: uid(), crea_date: daysAgo(e.dAgo),
      });
      totalExpenses++;
    }

    console.log(`     매출 체인: ${tpl.salesChain.length}건 | 납품: ${tpl.salesChain.reduce((s, c) => s + c.shipments.length, 0)}건 | 매입 지출: ${tpl.expenses.length}건`);
  }
}

// ─── 결과 요약 ────────────────────────────────────────────────────────────────
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 겸용 거래처 전체 시드 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  거래처 (both): ${totalClients}개
  영업일지:     ${totalSales}건
  일정:         ${totalScheds}건
  수주:         ${totalOrders}건
  납품:         ${totalShips}건
  지출 (매입):  ${totalExpenses}건
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

await conn.end();
