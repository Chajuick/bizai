// client/src/lib/sale-export.ts

import ExcelJS from "exceljs";

type SaleItem = {
  sale_idno: number;
  clie_name: string | null;
  cont_name: string | null;
  sale_loca: string | null;
  vist_date: string | Date;
  orig_memo: string;
  aiex_done: boolean;
  aiex_summ: string | null;
};

// ── 컬럼 정의 ────────────────────────────────────────────────────
const COLUMNS = [
  { header: "방문일",    key: "vist_date", width: 13 },
  { header: "거래처",    key: "clie_name", width: 20 },
  { header: "담당자",    key: "cont_name", width: 13 },
  { header: "방문 위치", key: "sale_loca", width: 22 },
  { header: "영업 내용", key: "orig_memo", width: 52 },
  { header: "AI 요약",   key: "aiex_summ", width: 46 },
] as const;

// ── 행 높이 추정 (텍스트 길이 기반) ─────────────────────────────
const LINE_H    = 15;   // pt per line (10pt 폰트 기준)
const MIN_H     = 20;   // 최소 행 높이
const PADDING_H = 8;    // 상하 패딩

function estimateRowHeight(item: SaleItem): number {
  const memoCol = COLUMNS[4].width;
  const summCol = COLUMNS[5].width;

  // 한글 1자 ≈ 영문 2자 너비 → 한글 포함 텍스트는 절반으로 나눔
  const memoLines = Math.ceil((item.orig_memo?.length ?? 0) / (memoCol * 0.6));
  const summText  = item.aiex_summ ?? "";
  const summLines = Math.ceil(summText.length / (summCol * 0.6));

  const lines = Math.max(1, memoLines, summLines);
  return Math.max(MIN_H, lines * LINE_H + PADDING_H);
}

// ── 날짜 포맷 ────────────────────────────────────────────────────
function fmtDate(d: string | Date): string {
  const dt = new Date(d);
  const y  = dt.getFullYear();
  const m  = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${y}.${m}.${dd}`;
}

// ── 파일명 날짜 ──────────────────────────────────────────────────
function todayStr(): string {
  return fmtDate(new Date()).replace(/\./g, "");
}

// ── export ───────────────────────────────────────────────────────
export async function exportSalesToExcel(
  items: SaleItem[],
  rangeLabel: string,
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "FocusWin Sales Manager";
  wb.created = new Date();

  const ws = wb.addWorksheet("영업일지", {
    views: [{ state: "frozen", ySplit: 2 }],
    pageSetup: { fitToPage: true, fitToWidth: 1, orientation: "landscape" },
  });

  ws.columns = COLUMNS.map(c => ({ key: c.key, width: c.width }));

  // ── (1) 제목 행 ─────────────────────────────────────────────
  ws.mergeCells(1, 1, 1, COLUMNS.length);
  const titleCell        = ws.getCell("A1");
  titleCell.value        = `영업일지 · ${rangeLabel} · 총 ${items.length}건`;
  titleCell.font         = { name: "Malgun Gothic", size: 11, bold: true, color: { argb: "0F172A" } };
  titleCell.alignment    = { vertical: "middle", horizontal: "left", indent: 1 };
  titleCell.fill         = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } }; // slate-100
  titleCell.border       = { bottom: { style: "medium", color: { argb: "CBD5E1" } } };
  ws.getRow(1).height    = 30;

  // ── (2) 헤더 행 ─────────────────────────────────────────────
  const headerRow = ws.getRow(2);
  COLUMNS.forEach((col, i) => {
    const cell        = headerRow.getCell(i + 1);
    cell.value        = col.header;
    cell.font         = { name: "Malgun Gothic", size: 10, bold: true, color: { argb: "FFFFFF" } };
    cell.alignment    = { vertical: "middle", horizontal: "center" };
    cell.fill         = { type: "pattern", pattern: "solid", fgColor: { argb: "1E40AF" } }; // blue-800
    cell.border       = {
      bottom: { style: "thin", color: { argb: "1E3A8A" } },
      right:  i < COLUMNS.length - 1
        ? { style: "thin", color: { argb: "3B82F6" } }
        : undefined,
    };
  });
  headerRow.height = 24;

  // ── (3) 데이터 행 ────────────────────────────────────────────
  items.forEach((item, idx) => {
    const isEven  = idx % 2 === 1;
    const bgArgb  = isEven ? "F8FAFC" : "FFFFFF"; // slate-50 / white

    const values = [
      fmtDate(item.vist_date),
      item.clie_name ?? "",
      item.cont_name ?? "",
      item.sale_loca ?? "",
      item.orig_memo ?? "",
      item.aiex_summ ?? (item.aiex_done ? "" : "미분석"),
    ];

    const row = ws.addRow(values);

    row.eachCell({ includeEmpty: true }, (cell, colIdx) => {
      const isLastCol    = colIdx === COLUMNS.length;
      const isTextCol    = colIdx >= 5;
      const isUnanalyzed = colIdx === 6 && !item.aiex_done;

      cell.font      = {
        name:   "Malgun Gothic",
        size:   10,
        color:  { argb: isUnanalyzed ? "94A3B8" : "334155" }, // slate-400 / slate-700
        italic: isUnanalyzed,
      };
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
      cell.alignment = {
        vertical:   "top",
        horizontal: colIdx === 1 ? "center" : "left",
        wrapText:   isTextCol,
        indent:     colIdx === 1 ? 0 : 1,
      };
      cell.border = {
        bottom: { style: "thin", color: { argb: "E2E8F0" } },
        right:  !isLastCol
          ? { style: "thin", color: { argb: "E2E8F0" } }
          : undefined,
      };
    });

    // 텍스트 길이 기반 행 높이
    row.height = estimateRowHeight(item);
  });

  // ── (4) 하단 여백 행 (빈 행으로 깔끔한 마무리) ──────────────
  const footerRow       = ws.addRow([]);
  footerRow.height      = 8;
  ws.mergeCells(ws.rowCount, 1, ws.rowCount, COLUMNS.length);
  const footerCell      = ws.getCell(ws.rowCount, 1);
  footerCell.fill       = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };
  footerCell.border     = { top: { style: "medium", color: { argb: "CBD5E1" } } };

  // ── (5) 다운로드 ─────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement("a");
  a.href        = url;
  a.download    = `영업일지_${rangeLabel}_${todayStr()}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
